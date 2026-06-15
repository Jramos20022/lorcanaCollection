import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Modal,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import Auth from '../../utils/auth';
import {
  ADD_COLLECTION_CARD,
  UPDATE_COLLECTION_CARD,
} from '../../utils/mutations';
import { QUERY_MY_COLLECTION } from '../../utils/queries';
import FoilCardImage from '../FoilCardImage';

const PAGE_SIZE = 48;
const COLORS = ['Amber', 'Amethyst', 'Emerald', 'Ruby', 'Sapphire', 'Steel'];
const COSTS = [1, 2, 3, 4, 5, 6, 7, 8, '9+'];
const TYPES = ['Character', 'Action', 'Item', 'Location'];
const SPECIAL_RARITIES = ['Enchanted', 'Epic', 'Iconic'];
const RARITIES = [
  'Common',
  'Uncommon',
  'Rare',
  'Super Rare',
  'Legendary',
  'Enchanted',
  'Epic',
  'Iconic',
];

const colorStyles = {
  Amber: '#d8a52b',
  Amethyst: '#8d56c7',
  Emerald: '#2f9b65',
  Ruby: '#ce3e47',
  Sapphire: '#3784c6',
  Steel: '#8a96a3',
};

const createDefaultFilters = () => ({
  colors: [],
  costs: [],
  types: [],
  rarities: [],
  sets: [],
  promos: [],
  inkability: 'all',
});

const formatRarity = (rarity = '') => rarity
  .split('_')
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');

const normalizeLorcastCard = (card) => ({
  Artist: card.illustrators?.join(', ') || '',
  Set_Name: card.set?.name || '',
  Classifications: card.classifications?.join(' - ') || '',
  Set_Num: Number(card.set?.code) || 0,
  Color: card.inks?.join(', ') || card.ink || '',
  Image: card.image_uris?.digital?.large || card.image_uris?.digital?.normal || '',
  Cost: card.cost,
  Inkable: Boolean(card.inkwell),
  Name: card.version ? `${card.name} - ${card.version}` : card.name,
  Type: card.type?.join(' - ') || '',
  Lore: card.lore,
  Rarity: formatRarity(card.rarity),
  Flavor_Text: card.flavor_text || '',
  Unique_ID: card.id,
  Card_Num: Number(card.collector_number) || card.collector_number,
  Body_Text: card.text || '',
  Willpower: card.willpower,
  Strength: card.strength,
  Set_ID: card.set?.code || '',
  TCGplayer_ID: card.tcgplayer_id || '',
  TCGplayer_URL: card.purchase_uris?.tcgplayer || '',
});

const toCollectionCardInput = (card) => ({
  image: card.Image,
  name: card.Name,
  set_name: card.Set_Name || '',
  set_num: Number(card.Set_Num) || 0,
  color: card.Color || '',
  cost: Number(card.Cost) || 0,
  inkable: Boolean(card.Inkable),
  type: card.Type || 'Card',
  rarity: card.Rarity || '',
  unique_id: card.Unique_ID || `${card.Set_ID}-${card.Card_Num}-${card.Name}`,
  card_num: Number.parseInt(card.Card_Num, 10) || 0,
  set_id: card.Set_ID || '',
  count: 0,
  standard_count: 0,
  foil_count: 0,
});

const FilterSection = ({ label, children }) => (
  <Box>
    <Typography
      variant="overline"
      sx={{ color: 'secondary.light', fontWeight: 900, letterSpacing: '0.1em' }}
    >
      {label}
    </Typography>
    <Box sx={{ mt: 1 }}>{children}</Box>
  </Box>
);

const PrintingCounter = ({ cardName, label, quantity, saving, onChange, onPreview }) => (
  <Box
    onMouseEnter={() => onPreview?.(true)}
    onMouseLeave={() => onPreview?.(false)}
    onFocusCapture={() => onPreview?.(true)}
    onBlurCapture={() => onPreview?.(false)}
    sx={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) 28px 28px 28px',
      alignItems: 'center',
      minHeight: 34,
      px: 0.5,
      borderRadius: 1,
      bgcolor: label === 'Foil' ? 'rgba(119, 78, 178, 0.14)' : 'transparent',
    }}
  >
    <Typography variant="caption" sx={{ pl: 0.25, fontWeight: 800, color: label === 'Foil' ? 'secondary.light' : 'text.secondary' }}>
      {label}
    </Typography>
    <IconButton
      size="small"
      aria-label={`Remove one ${label.toLowerCase()} ${cardName}`}
      disabled={quantity === 0 || saving}
      onClick={(event) => onChange(event, -1)}
      sx={{ width: 28, height: 28 }}
    >
      <RemoveRoundedIcon sx={{ fontSize: 18 }} />
    </IconButton>
    <Typography sx={{ textAlign: 'center', fontSize: '0.78rem', fontWeight: 900, lineHeight: 1 }}>
      {saving ? <CircularProgress size={14} color="secondary" /> : quantity}
    </Typography>
    <IconButton
      size="small"
      aria-label={`Add one ${label.toLowerCase()} ${cardName}`}
      disabled={saving}
      onClick={(event) => onChange(event, 1)}
      sx={{ width: 28, height: 28 }}
    >
      <AddRoundedIcon sx={{ fontSize: 18 }} />
    </IconButton>
  </Box>
);

const MainCards = () => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [cards, setCards] = useState([]);
  const [availableSets, setAvailableSets] = useState([]);
  const [availableCatalogSets, setAvailableCatalogSets] = useState([]);
  const [availablePromos, setAvailablePromos] = useState([]);
  const [selectedSetCards, setSelectedSetCards] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingSets, setLoadingSets] = useState(true);
  const [loadingSetCards, setLoadingSetCards] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  const [retryToken, setRetryToken] = useState(0);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(createDefaultFilters);
  const [sortBy, setSortBy] = useState('set');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [cardPrice, setCardPrice] = useState(null);
  const [cardPriceError, setCardPriceError] = useState('');
  const [loadingCardPrice, setLoadingCardPrice] = useState(false);
  const [addingToCollection, setAddingToCollection] = useState(false);
  const [quickSavingId, setQuickSavingId] = useState('');
  const [foilPreviewId, setFoilPreviewId] = useState('');
  const [collectionNotice, setCollectionNotice] = useState(null);
  const [addCollectionCard] = useMutation(ADD_COLLECTION_CARD);
  const [updateCollectionCard] = useMutation(UPDATE_COLLECTION_CARD);
  const { data: collectionData, refetch: refetchCollection } = useQuery(QUERY_MY_COLLECTION, {
    skip: !Auth.loggedIn(),
  });
  const loaderRef = useRef(null);
  const hasCatalogFilters = filters.sets.length > 0 || filters.promos.length > 0;
  const hasNameSearch = query.trim().length > 0;
  const hasOldestSetSort = sortBy === 'set-oldest';
  const hasRemoteFilters = hasCatalogFilters || filters.rarities.length > 0 || hasNameSearch || hasOldestSetSort;
  const collectionById = useMemo(
    () => new Map((collectionData?.myCollection || []).map((card) => [card.unique_id, card])),
    [collectionData]
  );

  const handleAddToCollection = async (printing) => {
    if (!selectedCard) return;

    setAddingToCollection(true);
    try {
      await addCollectionCard({ variables: { card: toCollectionCardInput(selectedCard), printing } });
      await refetchCollection();
      const finish = printing === 'foil' ? 'Foil' : 'Standard';
      setCollectionNotice({ severity: 'success', message: `${finish} ${selectedCard.Name} added to your collection.` });
    } catch (requestError) {
      setCollectionNotice({ severity: 'error', message: requestError.message });
    } finally {
      setAddingToCollection(false);
    }
  };

  const handleQuickCollectionChange = async (event, card, printing, change) => {
    event.stopPropagation();
    const cardInput = toCollectionCardInput(card);
    const ownedCard = collectionById.get(cardInput.unique_id);
    const countField = `${printing}_count`;
    const currentCount = ownedCard?.[countField] || 0;
    const nextCount = currentCount + change;

    if (nextCount < 0) return;

    setQuickSavingId(`${cardInput.unique_id}:${printing}`);
    try {
      if (change > 0) {
        await addCollectionCard({ variables: { card: cardInput, printing } });
      } else {
        await updateCollectionCard({ variables: { card: cardInput, printing, quantity: nextCount } });
      }
      await refetchCollection();
    } catch (requestError) {
      setCollectionNotice({ severity: 'error', message: requestError.message });
    } finally {
      setQuickSavingId('');
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    if (!selectedCard) {
      setCardPrice(null);
      setCardPriceError('');
      setLoadingCardPrice(false);
      return () => controller.abort();
    }

    const loadCardPrice = async () => {
      setCardPrice(null);
      setCardPriceError('');
      setLoadingCardPrice(true);

      try {
        const searchParams = new URLSearchParams({
          name: selectedCard.Name,
          set: selectedCard.Set_Name || '',
          number: String(selectedCard.Card_Num || ''),
          rarity: selectedCard.Rarity || '',
          tcgplayerId: String(selectedCard.TCGplayer_ID || ''),
        });
        const response = await fetch(`/api/card-price?${searchParams}`, { signal: controller.signal });
        const data = await response.json();

        if (!response.ok) throw new Error(data.message || 'Unable to load the current card value.');
        setCardPrice(data);
      } catch (requestError) {
        if (requestError.name !== 'AbortError') setCardPriceError(requestError.message);
      } finally {
        if (!controller.signal.aborted) setLoadingCardPrice(false);
      }
    };

    loadCardPrice();
    return () => controller.abort();
  }, [selectedCard]);

  useEffect(() => {
    const controller = new AbortController();

    const loadSets = async () => {
      try {
        const [setsResponse, promoResponse] = await Promise.all([
          fetch('https://api.lorcana-api.com/sets/all', { signal: controller.signal }),
          fetch('https://api.lorcast.com/v0/sets', { signal: controller.signal }),
        ]);

        if (!setsResponse.ok || !promoResponse.ok) {
          throw new Error('Unable to load the set catalog.');
        }

        const [data, promoData] = await Promise.all([
          setsResponse.json(),
          promoResponse.json(),
        ]);
        setAvailableSets(
          [...data]
            .sort((firstSet, secondSet) => Number(secondSet.Set_Num) - Number(firstSet.Set_Num))
            .map((set) => set.Name)
        );
        setAvailablePromos(
          (promoData.results || [])
            .filter((set) => !/^\d+$/.test(set.code))
            .map((set) => ({ code: set.code, name: set.name }))
        );
        setAvailableCatalogSets(
          (promoData.results || [])
            .filter((set) => /^\d+$/.test(set.code))
            .sort((firstSet, secondSet) => Number(firstSet.code) - Number(secondSet.code))
        );
      } catch (requestError) {
        if (requestError.name !== 'AbortError') setError(requestError.message);
      } finally {
        if (!controller.signal.aborted) setLoadingSets(false);
      }
    };

    loadSets();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadCards = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(
          `https://api.lorcana-api.com/cards/fetch?page=${currentPage}&pagesize=${PAGE_SIZE}`,
          { signal: controller.signal }
        );

        if (!response.ok) throw new Error('Unable to load cards right now.');

        const data = await response.json();
        setCards((previousCards) => {
          const cardMap = new Map(
            [...previousCards, ...data].map((card) => [card.Unique_ID || `${card.Set_ID}-${card.Card_Num}-${card.Name}`, card])
          );
          return Array.from(cardMap.values());
        });
        setHasMore(data.length === PAGE_SIZE);
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setError(requestError.message);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadCards();
    return () => controller.abort();
  }, [currentPage, retryToken]);

  useEffect(() => {
    const controller = new AbortController();

    if (!hasRemoteFilters) {
      setSelectedSetCards([]);
      setLoadingSetCards(false);
      return () => controller.abort();
    }

    const loadSelectedSets = async () => {
      setLoadingSetCards(true);
      setError('');

      try {
        const catalogResponses = await Promise.all([
          ...filters.sets.map(async (setName) => {
            if (setName === 'Fabled') {
              const response = await fetch('https://api.lorcast.com/v0/cards/search?q=set%3A9', {
                signal: controller.signal,
              });

              if (!response.ok) throw new Error('Unable to load Fabled.');
              const data = await response.json();
              return (data.results || []).map(normalizeLorcastCard);
            }

            const response = await fetch(
              `https://api.lorcana-api.com/cards/fetch?search=Set_Name~${encodeURIComponent(setName)}`,
              { signal: controller.signal }
            );

            if (!response.ok) throw new Error(`Unable to load ${setName}.`);
            return response.json();
          }),
          ...filters.promos.map(async (setCode) => {
            const promo = availablePromos.find((set) => set.code === setCode);
            const response = await fetch(
              `https://api.lorcast.com/v0/cards/search?q=${encodeURIComponent(`set:${setCode}`)}`,
              { signal: controller.signal }
            );

            if (!response.ok) throw new Error(`Unable to load ${promo?.name || setCode}.`);
            const data = await response.json();
            return (data.results || []).map(normalizeLorcastCard);
          }),
          ...(!hasCatalogFilters ? filters.rarities : []).map(async (rarity) => {
            const rarityQuery = rarity.toLowerCase().replaceAll(' ', '_');
            const response = await fetch(
              `https://api.lorcast.com/v0/cards/search?q=${encodeURIComponent(`rarity:${rarityQuery}`)}`,
              { signal: controller.signal }
            );

            if (!response.ok) throw new Error(`Unable to load ${rarity} cards.`);
            const data = await response.json();
            return (data.results || []).map(normalizeLorcastCard);
          }),
          ...(!hasCatalogFilters && hasNameSearch ? [
            `name:${query.trim()}`,
            ...SPECIAL_RARITIES.map((rarity) => `name:${query.trim()} rarity:${rarity}`),
          ] : []).map(async (searchQuery) => {
            const response = await fetch(
              `https://api.lorcast.com/v0/cards/search?q=${encodeURIComponent(searchQuery)}`,
              { signal: controller.signal }
            );

            if (!response.ok) throw new Error(`Unable to search for ${query.trim()}.`);
            const data = await response.json();
            return (data.results || []).map(normalizeLorcastCard);
          }),
          ...(!hasCatalogFilters && filters.rarities.length === 0 && !hasNameSearch && hasOldestSetSort
            ? availableCatalogSets
            : []).map(async (set) => {
            const response = await fetch(
              `https://api.lorcast.com/v0/cards/search?q=${encodeURIComponent(`set:${set.code}`)}`,
              { signal: controller.signal }
            );

            if (!response.ok) throw new Error(`Unable to load ${set.name}.`);
            const data = await response.json();
            return (data.results || []).map(normalizeLorcastCard);
          }),
        ]);

        const cardMap = new Map(
          catalogResponses
            .flat()
            .map((card) => [card.Unique_ID || `${card.Set_ID}-${card.Card_Num}-${card.Name}`, card])
        );
        setSelectedSetCards(Array.from(cardMap.values()));
      } catch (requestError) {
        if (requestError.name !== 'AbortError') setError(requestError.message);
      } finally {
        if (!controller.signal.aborted) setLoadingSetCards(false);
      }
    };

    loadSelectedSets();
    return () => controller.abort();
  }, [availableCatalogSets, availablePromos, filters.promos, filters.rarities, filters.sets, hasCatalogFilters, hasNameSearch, hasOldestSetSort, hasRemoteFilters, query]);

  useEffect(() => {
    const loader = loaderRef.current;
    if (!loader || !hasMore || hasRemoteFilters) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading) {
          setCurrentPage((page) => page + 1);
        }
      },
      { rootMargin: '600px 0px' }
    );

    observer.observe(loader);
    return () => observer.disconnect();
  }, [hasMore, hasRemoteFilters, loading]);

  const filteredCards = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const cardSource = hasRemoteFilters ? selectedSetCards : cards;
    const filtered = cardSource.filter((card) => {
      const cardName = String(card.Name || '').toLowerCase();
      const cardColors = String(card.Color || '').split(',').map((color) => color.trim());
      const cardType = String(card.Type || '').split(' - ')[0];
      const costMatches = filters.costs.length === 0 || filters.costs.some((cost) => (
        cost === '9+' ? Number(card.Cost) >= 9 : Number(card.Cost) === cost
      ));

      return (
        (!normalizedQuery || cardName.includes(normalizedQuery)) &&
        (filters.colors.length === 0 || filters.colors.some((color) => cardColors.includes(color))) &&
        costMatches &&
        (filters.types.length === 0 || filters.types.includes(cardType)) &&
        (filters.rarities.length === 0 || filters.rarities.includes(card.Rarity)) &&
        (filters.inkability === 'all' || card.Inkable === (filters.inkability === 'inkable'))
      );
    });

    return [...filtered].sort((firstCard, secondCard) => {
      if (sortBy === 'name') return firstCard.Name.localeCompare(secondCard.Name);
      if (sortBy === 'cost-low') return Number(firstCard.Cost) - Number(secondCard.Cost);
      if (sortBy === 'cost-high') return Number(secondCard.Cost) - Number(firstCard.Cost);
      if (sortBy === 'set-oldest') {
        return Number(firstCard.Set_Num) - Number(secondCard.Set_Num)
          || Number(firstCard.Card_Num) - Number(secondCard.Card_Num);
      }
      return Number(secondCard.Set_Num) - Number(firstCard.Set_Num) || Number(firstCard.Card_Num) - Number(secondCard.Card_Num);
    });
  }, [cards, filters, hasRemoteFilters, query, selectedSetCards, sortBy]);

  const activeFilterCount =
    filters.colors.length +
    filters.costs.length +
    filters.types.length +
    filters.rarities.length +
    filters.sets.length +
    filters.promos.length +
    (filters.inkability === 'all' ? 0 : 1);

  const toggleArrayFilter = (filterName, value) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [filterName]: currentFilters[filterName].includes(value)
        ? currentFilters[filterName].filter((item) => item !== value)
        : [...currentFilters[filterName], value],
    }));
  };

  const resetFilters = () => {
    setQuery('');
    setFilters(createDefaultFilters());
    setSortBy('set');
  };

  const filterPanel = (
    <Stack spacing={3} sx={{ width: 270, p: 2.5 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h5" sx={{ color: 'secondary.light' }}>Filters</Typography>
        {!isDesktop && (
          <IconButton aria-label="Close filters" onClick={() => setFiltersOpen(false)}>
            <CloseRoundedIcon />
          </IconButton>
        )}
      </Stack>

      <FilterSection label="Sort order">
        <FormControl fullWidth size="small">
          <Select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <MenuItem value="set">Newest set</MenuItem>
            <MenuItem value="set-oldest">Oldest set</MenuItem>
            <MenuItem value="name">Name A-Z</MenuItem>
            <MenuItem value="cost-low">Cost low-high</MenuItem>
            <MenuItem value="cost-high">Cost high-low</MenuItem>
          </Select>
        </FormControl>
      </FilterSection>

      <Divider />

      <FilterSection label="Inkability">
        <Stack spacing={0.25}>
          {[
            ['all', 'All cards'],
            ['inkable', 'Inkable'],
            ['uninkable', 'Uninkable'],
          ].map(([value, label]) => (
            <FormControlLabel
              key={value}
              label={label}
              control={
                <Checkbox
                  checked={filters.inkability === value}
                  onChange={() => setFilters((currentFilters) => ({ ...currentFilters, inkability: value }))}
                  size="small"
                />
              }
            />
          ))}
        </Stack>
      </FilterSection>

      <Divider />

      <FilterSection label="Ink colors">
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {COLORS.map((color) => (
            <Chip
              key={color}
              label={color}
              onClick={() => toggleArrayFilter('colors', color)}
              sx={{
                color: filters.colors.includes(color) ? '#fff' : 'text.secondary',
                backgroundColor: filters.colors.includes(color) ? colorStyles[color] : 'rgba(255,255,255,0.04)',
                border: '1px solid',
                borderColor: filters.colors.includes(color) ? colorStyles[color] : 'divider',
                '&:hover': { backgroundColor: colorStyles[color], color: '#fff' },
              }}
            />
          ))}
        </Stack>
      </FilterSection>

      <Divider />

      <FilterSection label="Ink cost">
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1 }}>
          {COSTS.map((cost) => (
            <Button
              key={cost}
              variant={filters.costs.includes(cost) ? 'contained' : 'outlined'}
              onClick={() => toggleArrayFilter('costs', cost)}
              sx={{ minWidth: 0, minHeight: 36, p: 0.5 }}
            >
              {cost}
            </Button>
          ))}
        </Box>
      </FilterSection>

      <Divider />

      <FilterSection label="Card type">
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {TYPES.map((type) => (
            <Chip
              key={type}
              label={type}
              variant={filters.types.includes(type) ? 'filled' : 'outlined'}
              color={filters.types.includes(type) ? 'primary' : 'default'}
              onClick={() => toggleArrayFilter('types', type)}
            />
          ))}
        </Stack>
      </FilterSection>

      <Divider />

      <FilterSection label="Rarity">
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {RARITIES.map((rarity) => (
            <Chip
              key={rarity}
              label={rarity}
              variant={filters.rarities.includes(rarity) ? 'filled' : 'outlined'}
              color={filters.rarities.includes(rarity) ? 'secondary' : 'default'}
              onClick={() => toggleArrayFilter('rarities', rarity)}
            />
          ))}
        </Stack>
      </FilterSection>

      <Divider />

      <FilterSection label="Set">
        <Stack sx={{ maxHeight: 230, overflowY: 'auto', pr: 0.5 }}>
          {loadingSets && <CircularProgress size={22} color="secondary" sx={{ alignSelf: 'center', my: 2 }} />}
          {!loadingSets && availableSets.map((setName) => (
            <FormControlLabel
              key={setName}
              label={setName}
              control={
                <Checkbox
                  checked={filters.sets.includes(setName)}
                  onChange={() => toggleArrayFilter('sets', setName)}
                  size="small"
                />
              }
              sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.86rem' } }}
            />
          ))}
        </Stack>
      </FilterSection>

      <Divider />

      <FilterSection label="Promo cards">
        <Stack sx={{ maxHeight: 230, overflowY: 'auto', pr: 0.5 }}>
          {loadingSets && <CircularProgress size={22} color="secondary" sx={{ alignSelf: 'center', my: 2 }} />}
          {!loadingSets && availablePromos.map((promo) => (
            <FormControlLabel
              key={promo.code}
              label={promo.name}
              control={
                <Checkbox
                  checked={filters.promos.includes(promo.code)}
                  onChange={() => toggleArrayFilter('promos', promo.code)}
                  size="small"
                />
              }
              sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.86rem' } }}
            />
          ))}
        </Stack>
      </FilterSection>

      <Button startIcon={<RestartAltRoundedIcon />} onClick={resetFilters} color="secondary">
        Reset filters
      </Button>
    </Stack>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, md: 2 },
          mb: 2,
          background: 'rgba(13, 13, 31, 0.78)',
          backdropFilter: 'blur(12px)',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <TextField
          fullWidth
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by card name..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment>
            ),
            endAdornment: query ? (
              <InputAdornment position="end">
                <IconButton aria-label="Clear search" onClick={() => setQuery('')} size="small">
                  <CloseRoundedIcon />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
      </Paper>

      {!isDesktop && (
        <Button
          fullWidth
          variant="contained"
          startIcon={<FilterListRoundedIcon />}
          onClick={() => setFiltersOpen(true)}
          sx={{ mb: 2 }}
        >
          Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}
        </Button>
      )}

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5 }}>
        {isDesktop && (
          <Paper
            elevation={0}
            sx={{
              position: 'sticky',
              top: 74,
              flexShrink: 0,
              maxHeight: 'calc(100vh - 92px)',
              overflowY: 'auto',
              background: 'rgba(13, 13, 31, 0.76)',
              backdropFilter: 'blur(12px)',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            {filterPanel}
          </Paper>
        )}

        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          {error && (
            <Paper sx={{ p: 3, mb: 2, textAlign: 'center', borderColor: 'error.main' }}>
              <Typography color="error.main">{error}</Typography>
              <Button sx={{ mt: 1 }} onClick={() => setRetryToken((token) => token + 1)}>Try again</Button>
            </Paper>
          )}

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, minmax(0, 1fr))',
                sm: 'repeat(3, minmax(0, 1fr))',
                lg: 'repeat(4, minmax(0, 1fr))',
                xl: 'repeat(5, minmax(0, 1fr))',
              },
              gap: { xs: 1.25, sm: 2 },
            }}
          >
            {filteredCards.map((card) => {
              const cardId = card.Unique_ID || `${card.Set_ID}-${card.Card_Num}-${card.Name}`;
              const ownedCard = collectionById.get(cardId);
              const standardCount = ownedCard?.standard_count || 0;
              const foilCount = ownedCard?.foil_count || 0;

              return (
                <Card
                  key={cardId}
                  sx={{
                    overflow: 'hidden',
                    transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      borderColor: 'secondary.main',
                      boxShadow: '0 20px 38px rgba(0, 0, 0, 0.48)',
                    },
                  }}
                >
                  <FoilCardImage
                    image={card.Image}
                    alt={card.Name}
                    loading="lazy"
                    onClick={() => setSelectedCard(card)}
                    active={foilPreviewId === cardId}
                  />
                  {Auth.loggedIn() && (
                    <Stack
                      spacing={0.25}
                      sx={{ minHeight: 72, p: 0.5, bgcolor: 'rgba(13, 13, 31, 0.94)' }}
                    >
                      <PrintingCounter
                        cardName={card.Name}
                        label="Standard"
                        quantity={standardCount}
                        saving={quickSavingId === `${cardId}:standard`}
                        onChange={(event, change) => handleQuickCollectionChange(event, card, 'standard', change)}
                      />
                      <PrintingCounter
                        cardName={card.Name}
                        label="Foil"
                        quantity={foilCount}
                        saving={quickSavingId === `${cardId}:foil`}
                        onChange={(event, change) => handleQuickCollectionChange(event, card, 'foil', change)}
                        onPreview={(active) => setFoilPreviewId(active ? cardId : '')}
                      />
                    </Stack>
                  )}
                </Card>
              );
            })}
          </Box>

          {!loading && !loadingSetCards && filteredCards.length === 0 && (
            <Paper sx={{ p: 5, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ color: 'secondary.light', mb: 1 }}>No cards found</Typography>
              <Typography sx={{ color: 'text.secondary', mb: 2 }}>Try removing a filter or using a broader search.</Typography>
              <Button startIcon={<RestartAltRoundedIcon />} onClick={resetFilters}>Reset filters</Button>
            </Paper>
          )}

          <Stack ref={loaderRef} alignItems="center" justifyContent="center" sx={{ minHeight: 110, py: 3 }}>
            {(loading || loadingSetCards) && <CircularProgress color="secondary" />}
            {!loading && !loadingSetCards && !hasRemoteFilters && hasMore && (
              <Typography color="text.secondary">Scroll for more cards</Typography>
            )}
            {!loading && !loadingSetCards && !hasRemoteFilters && !hasMore && cards.length > 0 && (
              <Typography color="text.secondary">You have reached the end of the archive.</Typography>
            )}
          </Stack>
        </Box>
      </Box>

      <Drawer
        anchor="left"
        open={!isDesktop && filtersOpen}
        onClose={() => setFiltersOpen(false)}
        PaperProps={{
          sx: {
            background: 'linear-gradient(180deg, #151128, #080b17)',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        {filterPanel}
      </Drawer>

      <Modal open={Boolean(selectedCard)} onClose={() => setSelectedCard(null)}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '92%', md: 760 },
            maxHeight: '90vh',
            overflowY: 'auto',
            p: { xs: 2, sm: 3 },
            bgcolor: 'background.elevated',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            boxShadow: '0 28px 70px rgba(0, 0, 0, 0.68)',
          }}
        >
          <IconButton
            aria-label="Close card details"
            onClick={() => setSelectedCard(null)}
            sx={{ position: 'absolute', top: 10, right: 10, zIndex: 1, bgcolor: 'rgba(8,11,23,0.8)' }}
          >
            <CloseRoundedIcon />
          </IconButton>
          {selectedCard && (
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={5}>
                <Box
                  component="img"
                  src={selectedCard.Image}
                  alt={selectedCard.Name}
                  sx={{ display: 'block', width: '100%', borderRadius: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={7}>
                <Typography variant="h4" sx={{ color: 'secondary.light', pr: 4 }}>
                  {selectedCard.Name}
                </Typography>
                <Typography sx={{ color: 'text.secondary', mb: 2 }}>
                  {selectedCard.Set_Name} · #{selectedCard.Card_Num}
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
                  <Chip label={selectedCard.Color} />
                  <Chip label={`${selectedCard.Cost} ink`} />
                  <Chip label={selectedCard.Type} />
                  <Chip label={selectedCard.Rarity} color="secondary" />
                </Stack>
                {selectedCard.Classifications && (
                  <Typography sx={{ color: 'text.secondary', mb: 1 }}>
                    {selectedCard.Classifications}
                  </Typography>
                )}
                <Typography sx={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                  {selectedCard.Body_Text || selectedCard.Flavor_Text || 'No additional card text.'}
                </Typography>
                {Auth.loggedIn() && (
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={addingToCollection ? <CircularProgress size={18} color="inherit" /> : <AddRoundedIcon />}
                      disabled={addingToCollection}
                      onClick={() => handleAddToCollection('standard')}
                    >
                      Add Standard
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={addingToCollection ? <CircularProgress size={18} color="inherit" /> : <AddRoundedIcon />}
                      disabled={addingToCollection}
                      onClick={() => handleAddToCollection('foil')}
                    >
                      Add Foil
                    </Button>
                  </Stack>
                )}
                <Divider sx={{ my: 2 }} />
                <Typography variant="overline" sx={{ color: 'secondary.light', fontWeight: 900 }}>
                  TCGplayer value
                </Typography>
                {loadingCardPrice && (
                  <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mt: 1 }}>
                    <CircularProgress size={20} color="secondary" />
                    <Typography color="text.secondary">Checking current value...</Typography>
                  </Stack>
                )}
                {!loadingCardPrice && cardPrice && (
                  <Stack direction="row" flexWrap="wrap" gap={2} sx={{ mt: 1 }}>
                    {cardPrice.marketPrice !== null && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">Market price</Typography>
                        <Typography variant="h5" color="secondary.light">
                          ${cardPrice.marketPrice.toFixed(2)}
                        </Typography>
                      </Box>
                    )}
                    {cardPrice.lowestPrice !== null && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">Lowest listing</Typography>
                        <Typography variant="h5">${cardPrice.lowestPrice.toFixed(2)}</Typography>
                      </Box>
                    )}
                  </Stack>
                )}
                {!loadingCardPrice && cardPriceError && (
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    {cardPriceError}
                  </Typography>
                )}
              </Grid>
            </Grid>
          )}
        </Box>
      </Modal>
      <Snackbar
        open={Boolean(collectionNotice)}
        autoHideDuration={3500}
        onClose={() => setCollectionNotice(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {collectionNotice ? (
          <Alert severity={collectionNotice.severity} onClose={() => setCollectionNotice(null)} variant="filled">
            {collectionNotice.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
};

export default MainCards;
