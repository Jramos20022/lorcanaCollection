const express = require('express');

const router = express.Router();
const ACTOR_ID = 'devcake~tcgplayer-data-scraper';
const CACHE_DURATION = 6 * 60 * 60 * 1000;
const priceCache = new Map();

const readValue = (item, paths) => {
  for (const path of paths) {
    const value = path.split('.').reduce((current, key) => current?.[key], item);
    if (value !== undefined && value !== null && value !== '') return value;
  }

  return null;
};

const toNumber = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return null;

  const parsedValue = Number(value.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const normalizeText = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const getVariantText = (item) => normalizeText([
  readValue(item, ['productName', 'name', 'title']),
  readValue(item, ['rarity', 'rarityName', 'productRarity', 'cardRarity']),
  readValue(item, ['printing', 'printingName', 'finish']),
  readValue(item, ['variant', 'variantName', 'treatment']),
].filter(Boolean).join(' '));

const getProductId = (item) => {
  const directId = readValue(item, [
    'productId',
    'productID',
    'tcgplayerId',
    'tcgplayer_id',
    'id',
  ]);
  if (directId) return String(directId);

  const productUrl = readValue(item, ['productUrl', 'url', 'tcgplayerUrl', 'link']);
  return String(productUrl || '').match(/\/product\/(\d+)/)?.[1] || '';
};

const isRequiredVariant = (rarity) => normalizeText(rarity) === 'enchanted';

const matchesRequiredVariant = (item, rarity) => (
  !isRequiredVariant(rarity) || getVariantText(item).includes('enchanted')
);

const matchesProductId = (item, productId) => (
  !productId || getProductId(item) === String(productId)
);

const scoreResult = (item, card) => {
  const title = normalizeText(readValue(item, ['productName', 'name', 'title']));
  const setName = normalizeText(readValue(item, ['setName', 'groupName', 'set.name', 'set']));
  const cardName = normalizeText(card.name);
  const requestedSet = normalizeText(card.set);
  const requestedRarity = normalizeText(card.rarity);
  const variantText = getVariantText(item);
  const productId = getProductId(item);
  let score = 0;

  if (card.tcgplayerId && productId === String(card.tcgplayerId)) score += 100;
  if (title === cardName) score += 6;
  else if (title.includes(cardName)) score += 4;
  if (requestedSet && setName === requestedSet) score += 4;
  else if (requestedSet && setName.includes(requestedSet)) score += 2;
  if (card.number && title.includes(normalizeText(card.number))) score += 1;
  if (requestedRarity && variantText.includes(requestedRarity)) score += 10;

  return score;
};

const normalizePrice = (item) => ({
  marketPrice: toNumber(readValue(item, [
    'marketPrice',
    'market_price',
    'prices.marketPrice',
    'pricing.marketPrice',
    'pricePoints.marketPrice',
    'priceData.marketPrice',
  ])),
  lowestPrice: toNumber(readValue(item, [
    'lowestPrice',
    'lowPrice',
    'lowestListingPrice',
    'prices.lowPrice',
    'pricing.lowPrice',
    'pricePoints.lowPrice',
    'priceData.lowPrice',
  ])),
  productUrl: readValue(item, ['productUrl', 'url', 'tcgplayerUrl', 'link']),
  productName: readValue(item, ['productName', 'name', 'title']),
  setName: readValue(item, ['setName', 'groupName', 'set.name', 'set']),
});

router.get('/', async (req, res) => {
  const name = String(req.query.name || '').trim();
  const set = String(req.query.set || '').trim();
  const number = String(req.query.number || '').trim();
  const rarity = String(req.query.rarity || '').trim();
  const tcgplayerId = String(req.query.tcgplayerId || '').trim();

  if (!name) return res.status(400).json({ message: 'A card name is required.' });
  if (!process.env.APIFY_TOKEN) {
    return res.status(503).json({
      code: 'PRICE_SERVICE_NOT_CONFIGURED',
      message: 'Card pricing has not been configured yet.',
    });
  }

  const cacheKey = `${name}|${set}|${number}|${rarity}|${tcgplayerId}`.toLowerCase();
  const cachedPrice = priceCache.get(cacheKey);
  if (cachedPrice && Date.now() - cachedPrice.createdAt < CACHE_DURATION) {
    return res.json(cachedPrice.data);
  }

  try {
    const query = ['Disney Lorcana', name, set, rarity, number ? `#${number}` : '']
      .filter(Boolean)
      .join(' ');
    const actorUrl = new URL(`https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items`);
    actorUrl.searchParams.set('token', process.env.APIFY_TOKEN);
    actorUrl.searchParams.set('timeout', '120');

    const response = await fetch(actorUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queries: [query],
        sortOption: 'Best Match',
        startPage: 1,
        pageCount: 1,
        enrichData: true,
      }),
    });

    if (!response.ok) throw new Error(`Apify request failed with status ${response.status}.`);

    const items = await response.json();
    const matchingItems = items.filter((item) => (
      matchesRequiredVariant(item, rarity) && matchesProductId(item, tcgplayerId)
    ));
    const bestMatch = [...matchingItems]
      .sort((firstItem, secondItem) => (
        scoreResult(secondItem, { name, set, number, rarity, tcgplayerId })
          - scoreResult(firstItem, { name, set, number, rarity, tcgplayerId })
      ))[0];

    if (!bestMatch) {
      const variantLabel = tcgplayerId ? ' exact promo' : isRequiredVariant(rarity) ? ' Enchanted' : '';
      return res.status(404).json({ message: `No${variantLabel} TCGplayer listing was found.` });
    }

    const price = normalizePrice(bestMatch);
    if (price.marketPrice === null && price.lowestPrice === null) {
      return res.status(404).json({ message: 'No current price was found for this card.' });
    }

    const data = { ...price, currency: 'USD', updatedAt: new Date().toISOString() };
    priceCache.set(cacheKey, { createdAt: Date.now(), data });
    return res.json(data);
  } catch (error) {
    console.error('Unable to load TCGplayer pricing:', error.message);
    return res.status(502).json({ message: 'Unable to load the current card value.' });
  }
});

module.exports = router;
