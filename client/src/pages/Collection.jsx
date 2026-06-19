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
  LinearProgress,
  Modal,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import Auth from '../utils/auth';
import { QUERY_MY_COLLECTION } from '../utils/queries';
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
  const quantitySaveTimers = useRef({});
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
        </Box>
        <Inventory2RoundedIcon sx={{ color: 'secondary.main', fontSize: 42 }} />
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
