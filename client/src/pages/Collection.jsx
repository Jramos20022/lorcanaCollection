import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Navigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Card,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
  Modal,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import MonetizationOnRoundedIcon from '@mui/icons-material/MonetizationOnRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import Auth from '../utils/auth';
import { QUERY_MY_COLLECTION } from '../utils/queries';
import { UPDATE_COLLECTION_CARD } from '../utils/mutations';
import FoilCardImage from '../components/FoilCardImage';

const normalizeQuantity = (value) => Math.max(0, Number.parseInt(value, 10) || 0);
const formatCurrency = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
}).format(value);

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
  card_num: Number(card.card_num) || 0,
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
      }}
      disabled={saving}
      onBlur={(event) => {
        if (event.relatedTarget?.dataset.quantityStep) return;
        const nextValue = normalizeQuantity(value);
        onChange(nextValue);
        onCommit(nextValue);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur();
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
  const [foilPreviewId, setFoilPreviewId] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const [standardQuantity, setStandardQuantity] = useState(0);
  const [foilQuantity, setFoilQuantity] = useState(0);
  const [modalFoilPreview, setModalFoilPreview] = useState(false);
  const [savingPrinting, setSavingPrinting] = useState('');
  const [saveError, setSaveError] = useState('');
  const [collectionValue, setCollectionValue] = useState(0);
  const [pricedPrintings, setPricedPrintings] = useState(0);
  const [totalPrintings, setTotalPrintings] = useState(0);
  const [loadingCollectionValue, setLoadingCollectionValue] = useState(false);
  const priceCache = useRef(new Map());
  const { data, loading, error, refetch } = useQuery(QUERY_MY_COLLECTION, {
    skip: !Auth.loggedIn(),
  });
  const [updateCollectionCard] = useMutation(UPDATE_COLLECTION_CARD);

  const collection = useMemo(() => data?.myCollection || [], [data]);
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
  const standardCards = collection.reduce((total, card) => total + (card.standard_count || 0), 0);
  const foilCards = collection.reduce((total, card) => total + (card.foil_count || 0), 0);
  const totalCards = standardCards + foilCards;

  useEffect(() => {
    const controller = new AbortController();
    const priceRequests = collection.flatMap((card) => ([
      card.standard_count > 0 ? { card, printing: 'standard', quantity: card.standard_count } : null,
      card.foil_count > 0 ? { card, printing: 'foil', quantity: card.foil_count } : null,
    ].filter(Boolean)));

    setTotalPrintings(priceRequests.length);
    if (priceRequests.length === 0) {
      setCollectionValue(0);
      setPricedPrintings(0);
      setLoadingCollectionValue(false);
      return () => controller.abort();
    }

    const loadCollectionValue = async () => {
      setLoadingCollectionValue(true);
      let nextRequestIndex = 0;
      const results = [];

      const loadNextPrice = async () => {
        while (nextRequestIndex < priceRequests.length && !controller.signal.aborted) {
          const request = priceRequests[nextRequestIndex];
          nextRequestIndex += 1;
          const cacheKey = `${request.card.unique_id}:${request.printing}`;

          try {
            let unitPrice = priceCache.current.get(cacheKey);
            if (unitPrice === undefined) {
              const searchParams = new URLSearchParams({
                name: request.card.name,
                set: request.card.set_name || '',
                number: String(request.card.card_num || ''),
                rarity: request.card.rarity || '',
                printing: request.printing,
              });
              const response = await fetch(`/api/card-price?${searchParams}`, { signal: controller.signal });
              const data = await response.json();
              if (!response.ok) throw new Error(data.message || 'Price unavailable.');
              unitPrice = data.marketPrice ?? data.lowestPrice;
              if (unitPrice === null || unitPrice === undefined) throw new Error('Price unavailable.');
              priceCache.current.set(cacheKey, unitPrice);
            }
            results.push(unitPrice * request.quantity);
          } catch (requestError) {
            if (requestError.name === 'AbortError') return;
            results.push(null);
          }
        }
      };

      await Promise.all(Array.from({ length: Math.min(3, priceRequests.length) }, loadNextPrice));
      if (!controller.signal.aborted) {
        setCollectionValue(results.reduce((total, value) => total + (value || 0), 0));
        setPricedPrintings(results.filter((value) => value !== null).length);
        setLoadingCollectionValue(false);
      }
    };

    loadCollectionValue();
    return () => controller.abort();
  }, [collection]);

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
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.75 }}>
            <MonetizationOnRoundedIcon sx={{ color: 'secondary.main', fontSize: 22 }} />
            <Typography sx={{ color: 'secondary.light', fontWeight: 900 }}>
              {loadingCollectionValue ? 'Calculating collection value...' : `Estimated value: ${formatCurrency(collectionValue)}`}
            </Typography>
            {!loadingCollectionValue && totalPrintings > 0 && pricedPrintings < totalPrintings && (
              <Typography variant="caption" color="text.secondary">
                ({pricedPrintings} of {totalPrintings} printings priced)
              </Typography>
            )}
          </Stack>
        </Box>
        <Inventory2RoundedIcon sx={{ color: 'secondary.main', fontSize: 42 }} />
      </Stack>

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

      <Typography variant="h5" sx={{ color: 'secondary.light', mb: 2 }}>Owned Cards</Typography>
      {loading && <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 220 }}><CircularProgress color="secondary" /></Box>}
      {error && <Alert severity="error">{error.message}</Alert>}
      {!loading && !error && collection.length === 0 && (
        <Paper sx={{ p: 5, textAlign: 'center' }}>
          <Inventory2RoundedIcon sx={{ color: 'secondary.main', fontSize: 48, mb: 1 }} />
          <Typography variant="h5">Your collection is empty</Typography>
        </Paper>
      )}
      {!loading && !error && collection.length > 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(5, 1fr)', xl: 'repeat(6, 1fr)' }, gap: 2 }}>
          {filteredCollection.map((card) => (
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
      {!loading && !error && collection.length > 0 && filteredCollection.length === 0 && (
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
              <QuantityEditor
                label="Standard"
                value={standardQuantity}
                saving={Boolean(savingPrinting)}
                onChange={setStandardQuantity}
                onCommit={(quantity) => updateQuantity('standard', quantity)}
              />
              <QuantityEditor
                label="Foil"
                value={foilQuantity}
                saving={Boolean(savingPrinting)}
                onChange={setFoilQuantity}
                onCommit={(quantity) => updateQuantity('foil', quantity)}
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
