import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Navigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
  LinearProgress,
  Modal,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import MonetizationOnRoundedIcon from '@mui/icons-material/MonetizationOnRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import Auth from '../utils/auth';
import { QUERY_MY_COLLECTION, QUERY_MY_DECKS } from '../utils/queries';
import { UPDATE_COLLECTION_CARD } from '../utils/mutations';
import FoilCardImage from '../components/FoilCardImage';

const SET_CHECKLISTS = [
  { name: 'The First Chapter', total: 204, aliases: ['The First Chapter'] },
  { name: 'Rise of The Floodborn', total: 204, aliases: ['Rise of The Floodborn', 'Rise of the Floodborn'] },
  { name: 'Into the Inklands', total: 204, aliases: ['Into the Inklands'] },
  { name: "Illumineer's Quest: Deep Trouble", total: 35, aliases: ["Illumineer's Quest: Deep Trouble", 'Deep Trouble'] },
  { name: "Ursula's Return", total: 204, aliases: ["Ursula's Return"] },
  { name: 'Shimmering Skies', total: 204, aliases: ['Shimmering Skies'] },
  { name: 'Azurite Sea', total: 204, aliases: ['Azurite Sea'] },
  { name: "Archazia's Island", total: 204, aliases: ["Archazia's Island"] },
  { name: 'Reign of Jafar', total: 204, aliases: ['Reign of Jafar'] },
  { name: 'Fabled', total: 204, aliases: ['Fabled'] },
  { name: 'Whispers in the Well', total: 204, aliases: ['Whispers in the Well'] },
  { name: 'Winterspell', total: 204, aliases: ['Winterspell'] },
  { name: 'Disney Lorcana Promos', total: 33, aliases: ['Disney Lorcana Promos', 'Promo - Other', 'Promos'] },
];

const normalizeQuantity = (value) => Math.max(0, Number.parseInt(value, 10) || 0);
const normalizeSetName = (value = '') => value.trim().toLowerCase();
const formatCurrency = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
}).format(value);

const setAliasLookup = SET_CHECKLISTS.reduce((lookup, set) => {
  [set.name, ...set.aliases].forEach((alias) => lookup.set(normalizeSetName(alias), set.name));
  return lookup;
}, new Map());

const setSortOrder = SET_CHECKLISTS.reduce((lookup, set, index) => {
  lookup.set(set.name, index);
  return lookup;
}, new Map());

const getChecklistSetName = (setName = '') => (
  setAliasLookup.get(normalizeSetName(setName)) || setName || 'Unknown Set'
);

const getSetCardKey = (card) => {
  const number = String(card.card_num || '').trim();
  if (number) return number;
  return card.unique_id || card.name;
};

const getDisplayPrice = (price) => price?.marketPrice ?? price?.lowestPrice ?? null;

const loadCollectionCardPrice = async (card, printing, signal) => {
  const searchParams = new URLSearchParams({
    name: card.name || '',
    set: card.set_name || '',
    number: String(card.card_num || ''),
    rarity: card.rarity || '',
    printing,
  });
  const response = await fetch(`/api/card-price?${searchParams}`, { signal });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Price unavailable.');
  return data;
};

const escapeXml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const excelCell = (value, type = 'String') => {
  if (value === undefined || value === null || value === '') {
    return '<Cell><Data ss:Type="String"></Data></Cell>';
  }
  if (type === 'Number') {
    return `<Cell><Data ss:Type="Number">${Number(value) || 0}</Data></Cell>`;
  }
  if (type === 'Boolean') {
    return `<Cell><Data ss:Type="Boolean">${value ? 1 : 0}</Data></Cell>`;
  }
  if (type === 'DateTime') {
    return `<Cell ss:StyleID="Date"><Data ss:Type="DateTime">${value}</Data></Cell>`;
  }
  return `<Cell><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`;
};

const excelRow = (cells) => `<Row>${cells.map((cell) => excelCell(cell.value, cell.type)).join('')}</Row>`;

const excelWorksheet = (name, headers, rows) => `
  <Worksheet ss:Name="${escapeXml(name)}">
    <Table>
      ${excelRow(headers.map((header) => ({ value: header })))}
      ${rows.map((row) => excelRow(row)).join('')}
    </Table>
  </Worksheet>`;

const downloadCollectionBackup = ({ collection, decks, setProgress }) => {
  const createdAt = new Date();
  const createdAtIso = createdAt.toISOString();
  const profile = Auth.getProfile?.();
  const username = profile?.data?.username || profile?.username || 'account';
  const standardCards = collection.reduce((total, card) => total + (card.standard_count || 0), 0);
  const foilCards = collection.reduce((total, card) => total + (card.foil_count || 0), 0);
  const totalCards = standardCards + foilCards;

  const collectionRows = collection.map((card) => {
    const standard = card.standard_count || 0;
    const foil = card.foil_count || 0;
    return [
      { value: card.set_name },
      { value: card.set_id },
      { value: card.set_num, type: 'Number' },
      { value: card.card_num },
      { value: card.name },
      { value: card.rarity },
      { value: card.color },
      { value: card.cost, type: 'Number' },
      { value: card.type },
      { value: card.inkable, type: 'Boolean' },
      { value: standard, type: 'Number' },
      { value: foil, type: 'Number' },
      { value: standard + foil, type: 'Number' },
      { value: card.unique_id },
      { value: card.image },
    ];
  });

  const setRows = setProgress.map((set) => [
    { value: set.name },
    { value: set.owned, type: 'Number' },
    { value: set.total, type: 'Number' },
    { value: set.percent, type: 'Number' },
    { value: set.remaining, type: 'Number' },
    { value: set.copies, type: 'Number' },
  ]);

  const deckRows = decks.flatMap((deck) => (deck.cards || []).map((card) => [
    { value: deck.deckName },
    { value: deck._id },
    { value: card.name },
    { value: card.set_name },
    { value: card.set_id },
    { value: card.set_num, type: 'Number' },
    { value: card.card_num },
    { value: card.rarity },
    { value: card.color },
    { value: card.cost, type: 'Number' },
    { value: card.inkable, type: 'Boolean' },
    { value: card.count || 0, type: 'Number' },
    { value: card.unique_id },
    { value: card.image },
  ]));

  const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:html="http://www.w3.org/TR/REC-html40">
  <Styles>
    <Style ss:ID="Date"><NumberFormat ss:Format="Short Date"/></Style>
  </Styles>
  ${excelWorksheet('Summary', ['Field', 'Value'], [
    [{ value: 'Backup created' }, { value: createdAtIso, type: 'DateTime' }],
    [{ value: 'Username' }, { value: username }],
    [{ value: 'Unique owned cards' }, { value: collection.length, type: 'Number' }],
    [{ value: 'Total copies' }, { value: totalCards, type: 'Number' }],
    [{ value: 'Standard copies' }, { value: standardCards, type: 'Number' }],
    [{ value: 'Foil copies' }, { value: foilCards, type: 'Number' }],
    [{ value: 'Saved decks' }, { value: decks.length, type: 'Number' }],
    [{ value: 'Restore note' }, { value: 'Use Collection Backup columns set_name, card_num, unique_id, standard_count, and foil_count for imports.' }],
  ])}
  ${excelWorksheet('Collection Backup', [
    'set_name',
    'set_id',
    'set_num',
    'card_num',
    'name',
    'rarity',
    'color',
    'cost',
    'type',
    'inkable',
    'standard_count',
    'foil_count',
    'total_count',
    'unique_id',
    'image',
  ], collectionRows)}
  ${excelWorksheet('Set Summary', [
    'set_name',
    'unique_owned_cards',
    'set_total_cards',
    'percent_complete',
    'cards_remaining',
    'total_copies',
  ], setRows)}
  ${excelWorksheet('Decks Backup', [
    'deck_name',
    'deck_id',
    'card_name',
    'set_name',
    'set_id',
    'set_num',
    'card_num',
    'rarity',
    'color',
    'cost',
    'inkable',
    'quantity_in_deck',
    'unique_id',
    'image',
  ], deckRows)}
</Workbook>`;

  const blob = new Blob([workbook], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `inkcaster-${username}-backup-${createdAtIso.slice(0, 10)}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

const toCardInput = (card) => ({
  image: card.image,
  name: card.name,
  set_name: card.set_name || '',
  set_num: Number(card.set_num) || 0,
  color: card.color || '',
  cost: Number(card.cost) || 0,
  inkable: Boolean(card.inkable),
  type: card.type || 'Card',
  rarity: card.rarity || '',
  unique_id: card.unique_id,
  card_num: String(card.card_num || ''),
  set_id: card.set_id || '',
  count: Number(card.count) || 0,
  standard_count: Number(card.standard_count) || 0,
  foil_count: Number(card.foil_count) || 0,
});

const QuantityEditor = ({ label, value, saving, onChange, onCommit, onPreview }) => (
  <Box
    onMouseEnter={() => onPreview?.(true)}
    onMouseLeave={() => onPreview?.(false)}
    onFocusCapture={() => onPreview?.(true)}
    onBlurCapture={() => onPreview?.(false)}
    sx={{
      display: 'grid',
      gridTemplateColumns: 'minmax(76px, 1fr) 38px 72px 38px',
      alignItems: 'center',
      gap: 0.5,
      p: 0.75,
      borderRadius: 1,
      bgcolor: label === 'Foil' ? 'rgba(119, 78, 178, 0.16)' : 'rgba(255, 255, 255, 0.035)',
    }}
  >
    <Typography fontWeight={800} color={label === 'Foil' ? 'secondary.light' : 'text.primary'}>
      {label}
    </Typography>
    <IconButton
      size="small"
      data-quantity-step="true"
      disabled={normalizeQuantity(value) === 0 || saving}
      onClick={() => {
        const nextValue = Math.max(0, normalizeQuantity(value) - 1);
        onChange(nextValue);
        onCommit(nextValue);
      }}
      aria-label={`Remove one ${label.toLowerCase()}`}
    >
      <RemoveRoundedIcon fontSize="small" />
    </IconButton>
    <TextField
      type="number"
      size="small"
      value={value}
      onChange={(event) => {
        const nextValue = event.target.value;
        onChange(nextValue === '' ? '' : normalizeQuantity(nextValue));
        onCommit(nextValue === '' ? 0 : normalizeQuantity(nextValue));
      }}
      disabled={saving}
      onBlur={() => onChange(normalizeQuantity(value))}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          const nextValue = normalizeQuantity(value);
          onChange(nextValue);
          onCommit(nextValue);
          event.currentTarget.blur();
        }
      }}
      inputProps={{ min: 0, inputMode: 'numeric', 'aria-label': `${label} quantity` }}
      sx={{ '& input': { p: 1, textAlign: 'center', fontWeight: 900 } }}
    />
    <IconButton
      size="small"
      data-quantity-step="true"
      disabled={saving}
      onClick={() => {
        const nextValue = normalizeQuantity(value) + 1;
        onChange(nextValue);
        onCommit(nextValue);
      }}
      aria-label={`Add one ${label.toLowerCase()}`}
    >
      <AddRoundedIcon fontSize="small" />
    </IconButton>
  </Box>
);

const Collection = () => {
  const [query, setQuery] = useState('');
  const [selectedSetName, setSelectedSetName] = useState('');
  const [foilPreviewId, setFoilPreviewId] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const [standardQuantity, setStandardQuantity] = useState(0);
  const [foilQuantity, setFoilQuantity] = useState(0);
  const [modalFoilPreview, setModalFoilPreview] = useState(false);
  const [savingPrinting, setSavingPrinting] = useState('');
  const [saveError, setSaveError] = useState('');
  const [cardPrices, setCardPrices] = useState({ standard: null, foil: null });
  const [loadingCardPrices, setLoadingCardPrices] = useState(false);
  const [cardPriceError, setCardPriceError] = useState('');
  const [collectionValue, setCollectionValue] = useState(null);
  const [pricedPrintings, setPricedPrintings] = useState(0);
  const [totalPrintings, setTotalPrintings] = useState(0);
  const [loadingCollectionValue, setLoadingCollectionValue] = useState(false);
  const [collectionValueError, setCollectionValueError] = useState('');
  const quantitySaveTimers = useRef({});
  const priceCache = useRef(new Map());
  const { data, loading, error, refetch } = useQuery(QUERY_MY_COLLECTION, {
    skip: !Auth.loggedIn(),
  });
  const { data: deckData } = useQuery(QUERY_MY_DECKS, {
    skip: !Auth.loggedIn(),
  });
  const [updateCollectionCard] = useMutation(UPDATE_COLLECTION_CARD);

  const collection = useMemo(() => data?.myCollection || [], [data]);
  const decks = useMemo(() => deckData?.myDecks || [], [deckData]);
  const filteredCollection = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return collection;

    return collection.filter((card) => (
      [card.name, card.set_name, card.rarity]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    ));
  }, [collection, query]);
  const setProgress = useMemo(() => {
    const progress = new Map(SET_CHECKLISTS.map((set) => [
      set.name,
      {
        ...set,
        ownedCards: new Set(),
        copies: 0,
        knownSet: true,
      },
    ]));

    collection.forEach((card) => {
      const copies = (card.standard_count || 0) + (card.foil_count || 0);
      if (copies <= 0) return;

      const setName = getChecklistSetName(card.set_name);
      if (!progress.has(setName)) {
        progress.set(setName, {
          name: setName,
          total: 0,
          aliases: [],
          ownedCards: new Set(),
          copies: 0,
          knownSet: false,
        });
      }

      const set = progress.get(setName);
      set.ownedCards.add(getSetCardKey(card));
      set.copies += copies;
    });

    return [...progress.values()]
      .map((set) => {
        const owned = set.ownedCards.size;
        const percent = set.total ? Math.min(100, Math.round((owned / set.total) * 100)) : 0;
        return {
          ...set,
          owned,
          percent,
          remaining: set.total ? Math.max(set.total - owned, 0) : 0,
        };
      })
      .sort((first, second) => {
        const firstOrder = setSortOrder.get(first.name) ?? 999;
        const secondOrder = setSortOrder.get(second.name) ?? 999;
        return firstOrder - secondOrder || first.name.localeCompare(second.name);
      });
  }, [collection]);
  const groupedFilteredCollection = useMemo(() => {
    const groups = new Map();

    filteredCollection.forEach((card) => {
      const setName = getChecklistSetName(card.set_name);
      if (!groups.has(setName)) groups.set(setName, []);
      groups.get(setName).push(card);
    });

    return [...groups.entries()]
      .map(([setName, cards]) => ({ setName, cards }))
      .sort((first, second) => {
        const firstOrder = setSortOrder.get(first.setName) ?? 999;
        const secondOrder = setSortOrder.get(second.setName) ?? 999;
        return firstOrder - secondOrder || first.setName.localeCompare(second.setName);
      });
  }, [filteredCollection]);
  const selectedSetCards = useMemo(() => {
    if (!selectedSetName) return [];
    return groupedFilteredCollection.find((group) => group.setName === selectedSetName)?.cards || [];
  }, [groupedFilteredCollection, selectedSetName]);
  const standardCards = collection.reduce((total, card) => total + (card.standard_count || 0), 0);
  const foilCards = collection.reduce((total, card) => total + (card.foil_count || 0), 0);
  const totalCards = standardCards + foilCards;

  useEffect(() => () => {
    Object.values(quantitySaveTimers.current).forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    if (!selectedCard) {
      setCardPrices({ standard: null, foil: null });
      setCardPriceError('');
      setLoadingCardPrices(false);
      return () => controller.abort();
    }

    const loadPrices = async () => {
      setLoadingCardPrices(true);
      setCardPriceError('');
      setCardPrices({ standard: null, foil: null });

      const results = await Promise.allSettled([
        loadCollectionCardPrice(selectedCard, 'standard', controller.signal),
        loadCollectionCardPrice(selectedCard, 'foil', controller.signal),
      ]);

      if (controller.signal.aborted) return;

      setCardPrices({
        standard: results[0].status === 'fulfilled' ? results[0].value : null,
        foil: results[1].status === 'fulfilled' ? results[1].value : null,
      });
      if (results.every((result) => result.status === 'rejected')) {
        setCardPriceError(results[0].reason?.message || 'Unable to load pricing.');
      }
      setLoadingCardPrices(false);
    };

    loadPrices();
    return () => controller.abort();
  }, [selectedCard]);

  if (!Auth.loggedIn()) return <Navigate to="/login" replace />;

  const openCard = (card) => {
    setSelectedCard(card);
    setStandardQuantity(card.standard_count || 0);
    setFoilQuantity(card.foil_count || 0);
    setModalFoilPreview(false);
    setSaveError('');
  };

  const closeCard = () => {
    if (savingPrinting) return;
    setSelectedCard(null);
    setModalFoilPreview(false);
    setSaveError('');
  };

  const updateQuantity = async (printing, quantity) => {
    if (!selectedCard) return;

    const nextQuantity = normalizeQuantity(quantity);
    const currentQuantity = printing === 'standard'
      ? (selectedCard.standard_count || 0)
      : (selectedCard.foil_count || 0);
    if (nextQuantity === currentQuantity) return;

    setSavingPrinting(printing);
    setSaveError('');
    try {
      const card = toCardInput(selectedCard);
      const result = await updateCollectionCard({
        variables: { card, printing, quantity: nextQuantity },
      });
      const updatedCard = result.data?.updateCollectionCard?.find(
        (collectionCard) => collectionCard.unique_id === selectedCard.unique_id
      );
      await refetch();
      if (updatedCard) {
        setSelectedCard((currentCard) => ({ ...currentCard, ...updatedCard }));
      } else {
        setSelectedCard(null);
        setModalFoilPreview(false);
      }
    } catch (requestError) {
      if (printing === 'standard') setStandardQuantity(currentQuantity);
      if (printing === 'foil') setFoilQuantity(currentQuantity);
      setSaveError(requestError.message);
    } finally {
      setSavingPrinting('');
    }
  };

  const calculateCollectionValue = async () => {
    const priceRequests = collection.flatMap((card) => ([
      card.standard_count > 0 ? { card, printing: 'standard', quantity: card.standard_count } : null,
      card.foil_count > 0 ? { card, printing: 'foil', quantity: card.foil_count } : null,
    ].filter(Boolean)));

    setTotalPrintings(priceRequests.length);
    setPricedPrintings(0);
    setCollectionValue(null);
    setCollectionValueError('');

    if (priceRequests.length === 0) {
      setCollectionValue(0);
      return;
    }

    setLoadingCollectionValue(true);
    let nextRequestIndex = 0;
    let pricedCount = 0;
    const totals = [];

    const loadNextPrice = async () => {
      while (nextRequestIndex < priceRequests.length) {
        const request = priceRequests[nextRequestIndex];
        nextRequestIndex += 1;
        const cacheKey = `${request.card.unique_id}:${request.printing}`;

        try {
          let unitPrice = priceCache.current.get(cacheKey);
          if (unitPrice === undefined) {
            const price = await loadCollectionCardPrice(request.card, request.printing);
            unitPrice = getDisplayPrice(price);
            priceCache.current.set(cacheKey, unitPrice);
          }

          if (unitPrice !== null) {
            pricedCount += 1;
            totals.push(unitPrice * request.quantity);
            setPricedPrintings(pricedCount);
          }
        } catch {
          totals.push(0);
        }
      }
    };

    try {
      await Promise.all(Array.from({ length: Math.min(3, priceRequests.length) }, loadNextPrice));
      setCollectionValue(totals.reduce((total, value) => total + value, 0));
      if (pricedCount === 0) setCollectionValueError('No collection prices were found.');
    } catch (requestError) {
      setCollectionValueError(requestError.message || 'Unable to calculate collection value.');
    } finally {
      setLoadingCollectionValue(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2.5, md: 4 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h3" sx={{ color: 'secondary.light' }}>My Collection</Typography>
          <Typography color="text.secondary">
            {collection.length} unique cards · {totalCards} copies · {standardCards} standard · {foilCards} foil
          </Typography>
          <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
            <Button
              variant="contained"
              color="secondary"
              size="small"
              startIcon={loadingCollectionValue ? <CircularProgress size={16} color="inherit" /> : <MonetizationOnRoundedIcon />}
              disabled={loading || loadingCollectionValue || collection.length === 0}
              onClick={calculateCollectionValue}
            >
              {loadingCollectionValue ? 'Calculating...' : 'Calculate Value'}
            </Button>
            {collectionValue !== null && (
              <Typography sx={{ color: 'secondary.light', fontWeight: 900 }}>
                Estimated value: {formatCurrency(collectionValue)}
              </Typography>
            )}
            {totalPrintings > 0 && pricedPrintings < totalPrintings && collectionValue !== null && (
              <Typography variant="caption" color="text.secondary">
                {pricedPrintings} of {totalPrintings} printings priced
              </Typography>
            )}
            {collectionValueError && (
              <Typography variant="caption" color="error.main">{collectionValueError}</Typography>
            )}
          </Stack>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<DownloadRoundedIcon />}
            disabled={loading || collection.length === 0}
            onClick={() => downloadCollectionBackup({ collection, decks, setProgress })}
          >
            Download Backup
          </Button>
          <Inventory2RoundedIcon sx={{ color: 'secondary.main', fontSize: 42 }} />
        </Stack>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, md: 2 },
          mb: 3,
          background: 'rgba(13, 13, 31, 0.74)',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          spacing={0.75}
          sx={{ mb: 1.5 }}
        >
          <Box>
            <Typography variant="h5" sx={{ color: 'secondary.light' }}>Set Progress</Typography>
            <Typography variant="body2" color="text.secondary">
              Completion counts unique card numbers owned in each set.
            </Typography>
          </Box>
          <Chip
            color="secondary"
            label={`${setProgress.reduce((total, set) => total + set.owned, 0)} checklist cards owned`}
            sx={{ fontWeight: 900 }}
          />
        </Stack>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            gap: 1.25,
          }}
        >
          {setProgress.map((set) => (
            <Box
              key={set.name}
              onClick={() => setSelectedSetName(set.name)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedSetName(set.name);
                }
              }}
              role="button"
              tabIndex={0}
              aria-pressed={selectedSetName === set.name}
              aria-label={`View ${set.name} collection cards`}
              sx={{
                p: 1.25,
                borderRadius: 1,
                border: '1px solid',
                borderColor: selectedSetName === set.name
                  ? 'secondary.main'
                  : set.owned ? 'rgba(216, 165, 43, 0.28)' : 'divider',
                bgcolor: selectedSetName === set.name
                  ? 'rgba(216, 165, 43, 0.13)'
                  : set.owned ? 'rgba(216, 165, 43, 0.055)' : 'rgba(255, 255, 255, 0.03)',
                cursor: 'pointer',
                transition: 'border-color 160ms ease, background-color 160ms ease, transform 160ms ease',
                '&:hover': {
                  borderColor: 'secondary.main',
                  bgcolor: 'rgba(216, 165, 43, 0.1)',
                  transform: 'translateY(-1px)',
                },
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineColor: 'secondary.light',
                  outlineOffset: 2,
                },
              }}
            >
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                <Typography fontWeight={900} sx={{ lineHeight: 1.2 }}>{set.name}</Typography>
                <Typography variant="caption" sx={{ color: 'secondary.light', fontWeight: 900 }}>
                  {set.total ? `${set.percent}%` : 'Tracked'}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={set.percent}
                color="secondary"
                sx={{
                  height: 8,
                  my: 1,
                  borderRadius: 999,
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                  '& .MuiLinearProgress-bar': { borderRadius: 999 },
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {set.total
                  ? `${set.owned} / ${set.total} cards · ${set.remaining} left`
                  : `${set.owned} cards tracked`}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      <Paper
        elevation={0}
        sx={{ p: 2, mb: 3, background: 'rgba(13, 13, 31, 0.78)', border: '1px solid', borderColor: 'divider' }}
      >
        <TextField
          fullWidth
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search your collection..."
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment>,
          }}
        />
      </Paper>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={1}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h5" sx={{ color: 'secondary.light' }}>
            {selectedSetName || 'Select a Set'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedSetName
              ? 'Showing owned cards from the selected set.'
              : 'Choose a set above to view the cards you own from it.'}
          </Typography>
        </Box>
        {selectedSetName && (
          <Chip
            size="small"
            label={`${selectedSetCards.length} owned`}
            sx={{ fontWeight: 800, bgcolor: 'rgba(255, 255, 255, 0.08)' }}
          />
        )}
      </Stack>
      {loading && <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 220 }}><CircularProgress color="secondary" /></Box>}
      {error && <Alert severity="error">{error.message}</Alert>}
      {!loading && !error && collection.length === 0 && (
        <Paper sx={{ p: 5, textAlign: 'center' }}>
          <Inventory2RoundedIcon sx={{ color: 'secondary.main', fontSize: 48, mb: 1 }} />
          <Typography variant="h5">Your collection is empty</Typography>
        </Paper>
      )}
      {!loading && !error && collection.length > 0 && !selectedSetName && filteredCollection.length > 0 && (
        <Paper sx={{ p: 5, textAlign: 'center' }}>
          <Inventory2RoundedIcon sx={{ color: 'secondary.main', fontSize: 42, mb: 1 }} />
          <Typography variant="h5">Pick a set to open your binder</Typography>
        </Paper>
      )}
      {!loading && !error && collection.length > 0 && selectedSetName && selectedSetCards.length > 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(5, 1fr)', xl: 'repeat(6, 1fr)' }, gap: 2 }}>
          {selectedSetCards.map((card) => (
            <Card key={card.unique_id} sx={{ overflow: 'hidden' }}>
              <Box
                onMouseEnter={() => card.foil_count > 0 && setFoilPreviewId(card.unique_id)}
                onMouseLeave={() => setFoilPreviewId('')}
                onClick={() => openCard(card)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openCard(card);
                  }
                }}
                aria-label={`Edit ${card.name} quantities`}
                sx={{ position: 'relative', cursor: 'pointer' }}
              >
                <FoilCardImage image={card.image} alt={card.name} active={foilPreviewId === card.unique_id} />
                <Chip label={`×${(card.standard_count || 0) + (card.foil_count || 0)}`} color="secondary" sx={{ position: 'absolute', top: 8, right: 8, fontWeight: 900 }} />
              </Box>
              <Stack spacing={1} sx={{ p: 1.25 }}>
                <Typography fontWeight={800} sx={{ fontSize: '0.88rem', lineHeight: 1.25 }}>{card.name}</Typography>
                <Typography variant="caption" color="text.secondary">{card.set_name} · #{card.card_num}</Typography>
              </Stack>
            </Card>
          ))}
        </Box>
      )}
      {!loading && !error && collection.length > 0 && selectedSetName && selectedSetCards.length === 0 && (
        <Paper sx={{ p: 5, textAlign: 'center' }}>
          <Typography variant="h5">
            {query.trim()
              ? `No ${selectedSetName} cards match that search`
              : `No ${selectedSetName} cards in your collection yet`}
          </Typography>
        </Paper>
      )}
      {!loading && !error && collection.length > 0 && !selectedSetName && filteredCollection.length === 0 && (
        <Paper sx={{ p: 5, textAlign: 'center' }}>
          <Typography variant="h5">No owned cards match that search</Typography>
        </Paper>
      )}
      <Modal open={Boolean(selectedCard)} onClose={closeCard} aria-label="Edit collection card quantities">
        <Paper
          elevation={16}
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'min(92vw, 390px)',
            maxHeight: '92vh',
            overflowY: 'auto',
            p: 1.5,
            bgcolor: 'rgba(13, 13, 31, 0.98)',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {selectedCard && (
            <Stack spacing={1.25}>
              <Box sx={{ display: 'grid', placeItems: 'center', width: '100%' }}>
                <Box sx={{ width: '100%', maxWidth: 290, borderRadius: 1, overflow: 'hidden' }}>
                  <FoilCardImage image={selectedCard.image} alt={selectedCard.name} active={modalFoilPreview} />
                </Box>
              </Box>
              <Paper
                elevation={0}
                sx={{
                  p: 1,
                  bgcolor: 'rgba(216, 165, 43, 0.08)',
                  border: '1px solid',
                  borderColor: 'rgba(216, 165, 43, 0.28)',
                }}
              >
                <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.75 }}>
                  <MonetizationOnRoundedIcon sx={{ color: 'secondary.main', fontSize: 20 }} />
                  <Typography fontWeight={900} color="secondary.light">TCGplayer Value</Typography>
                </Stack>
                {loadingCardPrices && (
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CircularProgress size={16} color="secondary" />
                    <Typography variant="body2" color="text.secondary">Loading prices...</Typography>
                  </Stack>
                )}
                {!loadingCardPrices && cardPriceError && (
                  <Typography variant="body2" color="text.secondary">{cardPriceError}</Typography>
                )}
                {!loadingCardPrices && !cardPriceError && (
                  <Stack spacing={0.5}>
                    {[
                      ['Standard', cardPrices.standard],
                      ['Foil', cardPrices.foil],
                    ].map(([label, price]) => {
                      const value = getDisplayPrice(price);
                      return (
                        <Stack key={label} direction="row" justifyContent="space-between" spacing={1}>
                          <Typography variant="body2" color="text.secondary">{label}</Typography>
                          <Typography variant="body2" fontWeight={900}>
                            {value === null ? 'Unavailable' : formatCurrency(value)}
                          </Typography>
                        </Stack>
                      );
                    })}
                  </Stack>
                )}
              </Paper>
              <QuantityEditor
                label="Standard"
                value={standardQuantity}
                saving={Boolean(savingPrinting)}
                onChange={setStandardQuantity}
                onCommit={(quantity) => {
                  clearTimeout(quantitySaveTimers.current.standard);
                  quantitySaveTimers.current.standard = setTimeout(() => updateQuantity('standard', quantity), 450);
                }}
              />
              <QuantityEditor
                label="Foil"
                value={foilQuantity}
                saving={Boolean(savingPrinting)}
                onChange={setFoilQuantity}
                onCommit={(quantity) => {
                  clearTimeout(quantitySaveTimers.current.foil);
                  quantitySaveTimers.current.foil = setTimeout(() => updateQuantity('foil', quantity), 450);
                }}
                onPreview={setModalFoilPreview}
              />
              {saveError && <Alert severity="error">{saveError}</Alert>}
            </Stack>
          )}
        </Paper>
      </Modal>
    </Container>
  );
};

export default Collection;
