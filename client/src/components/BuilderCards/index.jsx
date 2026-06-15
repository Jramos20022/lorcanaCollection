import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardMedia,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import DeleteSweepRoundedIcon from '@mui/icons-material/DeleteSweepRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import ViewListRoundedIcon from '@mui/icons-material/ViewListRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { ADD_DECK, UPDATE_DECK } from '../../utils/mutations';

const PAGE_SIZE = 48;
const COLORS = ['Amber', 'Amethyst', 'Emerald', 'Ruby', 'Sapphire', 'Steel'];
const COLOR_VALUES = {
  Amber: '#d9a928',
  Amethyst: '#8f58c7',
  Emerald: '#319665',
  Ruby: '#c9434d',
  Sapphire: '#3b82bd',
  Steel: '#8793a0',
};
const CARD_TYPES = ['Character', 'Action', 'Item', 'Location'];
const BALANCED_COST_TARGET = [0, 8, 12, 12, 10, 8, 5, 3, 2];

const lowerCaseKeys = (value) => {
  if (Array.isArray(value)) return value.map(lowerCaseKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key.toLowerCase(), lowerCaseKeys(item)]));
  }
  return value;
};

const withoutTypename = (card) => Object.fromEntries(
  Object.entries(card || {}).filter(([key]) => key !== '__typename')
);

const cardKey = (card) => card.unique_id || `${card.set_id}-${card.card_num}-${card.name}`;
const baseType = (card) => CARD_TYPES.find((type) => card.type?.includes(type)) || 'Other';
const stringValue = (value) => Array.isArray(value) ? value.join(', ') : String(value || '');
const integerValue = (value) => Number.parseInt(value, 10) || 0;
const toDeckCardInput = (card) => ({
  artist: stringValue(card.artist),
  set_name: stringValue(card.set_name),
  classifications: stringValue(card.classifications),
  abilities: stringValue(card.abilities),
  set_num: integerValue(card.set_num),
  color: stringValue(card.color),
  franchise: stringValue(card.franchise),
  image: stringValue(card.image),
  cost: integerValue(card.cost),
  inkable: Boolean(card.inkable),
  name: stringValue(card.name),
  type: stringValue(card.type) || 'Card',
  lore: integerValue(card.lore),
  rarity: stringValue(card.rarity),
  flavor_text: stringValue(card.flavor_text),
  unique_id: stringValue(card.unique_id || cardKey(card)),
  card_num: integerValue(card.card_num),
  body_text: stringValue(card.body_text),
  willpower: integerValue(card.willpower),
  card_variants: stringValue(card.card_variants),
  strength: integerValue(card.strength),
  set_id: stringValue(card.set_id),
  move_cost: integerValue(card.move_cost),
  count: Math.max(1, integerValue(card.count)),
});

const BuilderCards = ({ selectedDeck, isEditing = false }) => {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [deckTitle, setDeckTitle] = useState('Untitled Deck');
  const [query, setQuery] = useState('');
  const [selectedColors, setSelectedColors] = useState([]);
  const [inkability, setInkability] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [deckTab, setDeckTab] = useState('cards');
  const [deckView, setDeckView] = useState('list');
  const [addDeck] = useMutation(ADD_DECK);
  const [updateDeck] = useMutation(UPDATE_DECK);

  const loadCards = useCallback(async ({ pageNumber = 1, search = '', append = false } = {}) => {
    append ? setLoadingMore(true) : setLoading(true);
    setNotice(null);
    try {
      const endpoint = search.trim()
        ? `https://api.lorcana-api.com/cards/fetch?search=Name~${encodeURIComponent(search.trim())}`
        : `https://api.lorcana-api.com/cards/fetch?page=${pageNumber}&pagesize=${PAGE_SIZE}`;
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Unable to load the card library.');
      const nextCards = lowerCaseKeys(await response.json());
      setCards((currentCards) => append ? [...currentCards, ...nextCards] : nextCards);
      setHasMore(!search.trim() && nextCards.length === PAGE_SIZE);
    } catch (error) {
      setNotice({ severity: 'error', message: error.message });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  useEffect(() => {
    if (!isEditing || !selectedDeck) return;
    setSelectedCards((selectedDeck.cards || []).map((card) => withoutTypename(card)));
    setDeckTitle(selectedDeck.deckName || 'Untitled Deck');
  }, [isEditing, selectedDeck]);

  const selectedById = useMemo(
    () => new Map(selectedCards.map((card) => [cardKey(card), card])),
    [selectedCards]
  );
  const totalCards = selectedCards.reduce((total, card) => total + (Number(card.count) || 0), 0);
  const uniqueCards = selectedCards.length;
  const inkableCards = selectedCards.reduce((total, card) => total + (card.inkable ? card.count : 0), 0);
  const uninkableCards = totalCards - inkableCards;
  const inkablePercentage = totalCards ? Math.round((inkableCards / totalCards) * 100) : 0;
  const uninkablePercentage = totalCards ? 100 - inkablePercentage : 0;
  const totalCost = selectedCards.reduce((total, card) => total + ((Number(card.cost) || 0) * card.count), 0);
  const averageCost = totalCards ? totalCost / totalCards : 0;
  const deckColors = [...new Set(selectedCards.flatMap((card) => String(card.color || '').split(',').map((color) => color.trim())).filter(Boolean))];
  const hasTooManyColors = deckColors.length > 2;
  const hasTooManyCopies = selectedCards.some((card) => card.count > 4);
  const isLegalDeck = totalCards >= 60 && !hasTooManyColors && !hasTooManyCopies;

  const typeCounts = useMemo(() => Object.fromEntries(
    [...CARD_TYPES, 'Other'].map((type) => [
      type,
      selectedCards.filter((card) => baseType(card) === type).reduce((total, card) => total + card.count, 0),
    ])
  ), [selectedCards]);

  const costCurve = useMemo(() => Array.from({ length: 9 }, (_, index) => ({
    label: index === 8 ? '8+' : String(index),
    count: selectedCards
      .filter((card) => Math.min(Number(card.cost) || 0, 8) === index)
      .reduce((total, card) => total + card.count, 0),
  })), [selectedCards]);
  const maxCostCount = Math.max(1, ...BALANCED_COST_TARGET, ...costCurve.map((item) => item.count));
  const targetLinePoints = BALANCED_COST_TARGET
    .map((count, index) => `${(index / 8) * 100},${100 - ((count / maxCostCount) * 78 + 12)}`)
    .join(' ');
  const sortedSelectedCards = useMemo(
    () => [...selectedCards].sort((a, b) => (a.cost || 0) - (b.cost || 0) || a.name.localeCompare(b.name)),
    [selectedCards]
  );

  const visibleCards = useMemo(() => cards.filter((card) => {
    const colors = String(card.color || '').split(',').map((color) => color.trim());
    if (selectedColors.length && !selectedColors.some((color) => colors.includes(color))) return false;
    if (inkability === 'inkable' && !card.inkable) return false;
    if (inkability === 'uninkable' && card.inkable) return false;
    return true;
  }), [cards, selectedColors, inkability]);

  const changeQuantity = (card, change) => {
    const key = cardKey(card);
    const currentCount = selectedById.get(key)?.count || 0;
    const nextCount = Math.max(0, Math.min(4, currentCount + change));
    if (nextCount === currentCount) return;

    setSelectedCards((currentCards) => {
      if (nextCount === 0) return currentCards.filter((item) => cardKey(item) !== key);
      if (currentCount === 0) return [...currentCards, { ...card, count: 1 }];
      return currentCards.map((item) => cardKey(item) === key ? { ...item, count: nextCount } : item);
    });
  };

  const searchCards = (event) => {
    event.preventDefault();
    setPage(1);
    loadCards({ search: query });
  };

  const clearSearch = () => {
    setQuery('');
    setPage(1);
    loadCards();
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadCards({ pageNumber: nextPage, append: true });
  };

  const saveDeck = async () => {
    if (!selectedCards.length) return;
    setSaving(true);
    setNotice(null);
    try {
      const deckCards = selectedCards.map(toDeckCardInput);
      if (isEditing && selectedDeck?._id) {
        await updateDeck({ variables: { deckId: selectedDeck._id, deckName: deckTitle.trim() || 'Untitled Deck', cards: deckCards } });
        navigate('/profile');
      } else {
        await addDeck({ variables: { deckName: deckTitle.trim() || 'Untitled Deck', cards: deckCards } });
        navigate('/profile');
      }
      setNotice({ severity: 'success', message: isEditing ? 'Deck updated.' : 'Deck saved.' });
    } catch (error) {
      setNotice({ severity: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const clearDeck = () => {
    setSelectedCards([]);
    setDeckTitle('Untitled Deck');
    setNotice(null);
  };

  return (
    <Box sx={{ minHeight: 'calc(100vh - 72px)' }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.65fr) minmax(360px, 0.85fr)' } }}>
        <Box sx={{ minWidth: 0, px: { xs: 1.5, sm: 2.5 }, py: 2, borderRight: { lg: '1px solid' }, borderColor: 'divider' }}>
          <Box component="form" onSubmit={searchCards} sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
            <TextField
              fullWidth
              size="small"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search cards by name..."
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> }}
            />
            <Button type="submit" variant="contained">Search</Button>
            {query && <Button onClick={clearSearch}>Clear</Button>}
          </Box>

          <Stack direction="row" alignItems="center" flexWrap="wrap" gap={0.75} sx={{ mb: 2 }}>
            <Chip label={`${visibleCards.length} cards`} variant="outlined" />
            <Chip label="All" clickable color={inkability === 'all' ? 'secondary' : 'default'} onClick={() => setInkability('all')} />
            <Chip label="Inkable" clickable color={inkability === 'inkable' ? 'secondary' : 'default'} onClick={() => setInkability('inkable')} />
            <Chip label="Uninkable" clickable color={inkability === 'uninkable' ? 'secondary' : 'default'} onClick={() => setInkability('uninkable')} />
            {COLORS.map((color) => {
              const active = selectedColors.includes(color);
              return (
                <Tooltip title={color} key={color}>
                  <Box
                    component="button"
                    type="button"
                    aria-label={color}
                    onClick={() => setSelectedColors((colors) => active ? colors.filter((item) => item !== color) : [...colors, color])}
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      border: '2px solid',
                      borderColor: active ? 'secondary.light' : 'rgba(255,255,255,0.22)',
                      bgcolor: COLOR_VALUES[color],
                      cursor: 'pointer',
                      boxShadow: active ? `0 0 0 2px ${COLOR_VALUES[color]}66` : 'none',
                    }}
                  />
                </Tooltip>
              );
            })}
          </Stack>

          {notice?.severity === 'error' && <Alert severity="error" sx={{ mb: 2 }}>{notice.message}</Alert>}
          {loading ? (
            <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 420 }}><CircularProgress color="secondary" /></Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' }, gap: { xs: 1, sm: 1.5 } }}>
              {visibleCards.map((card) => {
                const quantity = selectedById.get(cardKey(card))?.count || 0;
                return (
                  <Card key={cardKey(card)} sx={{ overflow: 'hidden', borderColor: quantity ? 'secondary.main' : 'divider' }}>
                    <CardMedia component="img" image={card.image} alt={card.name} loading="lazy" sx={{ width: '100%', aspectRatio: '0.716', objectFit: 'cover' }} />
                    <Box sx={{ display: 'grid', gridTemplateColumns: '34px 1fr 34px', alignItems: 'center', minHeight: 40, bgcolor: 'rgba(8, 10, 23, 0.96)' }}>
                      <IconButton size="small" disabled={!quantity} onClick={() => changeQuantity(card, -1)} aria-label={`Remove ${card.name}`}>
                        <RemoveRoundedIcon fontSize="small" />
                      </IconButton>
                      <Typography textAlign="center" fontWeight={900} color={quantity ? 'secondary.light' : 'text.secondary'}>{quantity} / 4</Typography>
                      <IconButton size="small" disabled={quantity >= 4} onClick={() => changeQuantity(card, 1)} aria-label={`Add ${card.name}`}>
                        <AddRoundedIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Card>
                );
              })}
            </Box>
          )}
          {!loading && visibleCards.length === 0 && <Paper sx={{ p: 5, textAlign: 'center' }}><Typography>No cards match these filters.</Typography></Paper>}
          {!loading && hasMore && !query && (
            <Box sx={{ display: 'grid', placeItems: 'center', py: 3 }}>
              <Button variant="outlined" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? <CircularProgress size={22} /> : 'Load More Cards'}
              </Button>
            </Box>
          )}
        </Box>

        <Box
          sx={{
            minWidth: 0,
            minHeight: { lg: 'calc(100vh - 72px)' },
            maxHeight: { lg: 'calc(100vh - 72px)' },
            position: { lg: 'sticky' },
            top: { lg: 72 },
            overflowY: 'auto',
            bgcolor: 'rgba(6, 7, 18, 0.93)',
            px: { xs: 1.5, sm: 2.5 },
            py: 2,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <TextField
              value={deckTitle}
              onChange={(event) => setDeckTitle(event.target.value)}
              variant="standard"
              fullWidth
              inputProps={{ 'aria-label': 'Deck name' }}
              sx={{ '& input': { fontSize: '1.25rem', fontWeight: 800 } }}
            />
            <EditRoundedIcon color="secondary" fontSize="small" />
          </Stack>

          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1.5 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              {isLegalDeck ? <CheckCircleRoundedIcon color="success" /> : <WarningAmberRoundedIcon color="warning" />}
              <Box>
                <Typography fontWeight={900}>{totalCards} / 60 cards</Typography>
                <Typography variant="caption" color="text.secondary">{isLegalDeck ? 'Deck requirements met' : 'Deck is still in progress'}</Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={0.5}>
              {deckColors.map((color) => <Chip key={color} label={color} size="small" sx={{ bgcolor: `${COLOR_VALUES[color] || '#777'}33`, color: COLOR_VALUES[color] || 'text.primary' }} />)}
            </Stack>
          </Stack>
          <LinearProgress variant="determinate" value={Math.min(100, (totalCards / 60) * 100)} color={isLegalDeck ? 'success' : 'secondary'} sx={{ mt: 1.25, height: 6, borderRadius: 1 }} />
          {hasTooManyColors && <Alert severity="warning" sx={{ mt: 1.5 }}>Lorcana decks may use no more than two ink colors.</Alert>}

          <Tabs value={deckTab} onChange={(_, value) => setDeckTab(value)} variant="fullWidth" sx={{ mt: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Tab value="cards" label={`Cards (${uniqueCards})`} />
            <Tab value="info" label="Deck Info" />
          </Tabs>

          {deckTab === 'cards' ? (
            <Box sx={{ mt: 1 }}>
              <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={deckView}
                  onChange={(_, nextView) => nextView && setDeckView(nextView)}
                  aria-label="Deck card view"
                >
                  <ToggleButton value="list" aria-label="List view">
                    <Tooltip title="List view"><ViewListRoundedIcon fontSize="small" /></Tooltip>
                  </ToggleButton>
                  <ToggleButton value="grid" aria-label="Grid view">
                    <Tooltip title="Grid view"><GridViewRoundedIcon fontSize="small" /></Tooltip>
                  </ToggleButton>
                </ToggleButtonGroup>
              </Stack>
              {!selectedCards.length && (
                <Box sx={{ py: 7, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary">Your deck is empty</Typography>
                  <Typography variant="body2" color="text.secondary">Use the plus buttons in the card library to begin.</Typography>
                </Box>
              )}
              {deckView === 'list' ? (
                <Stack divider={<Divider flexItem />}>
                  {sortedSelectedCards.map((card) => (
                    <Stack key={cardKey(card)} direction="row" alignItems="center" spacing={1} sx={{ py: 1 }}>
                      <Box component="img" src={card.image} alt="" sx={{ width: 42, aspectRatio: '0.716', objectFit: 'cover', borderRadius: 0.5 }} />
                      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                        <Typography noWrap fontWeight={800} sx={{ fontSize: '0.86rem' }}>{card.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{card.type} · Cost {card.cost ?? 0}</Typography>
                      </Box>
                      <IconButton size="small" onClick={() => changeQuantity(card, -1)}><RemoveRoundedIcon fontSize="small" /></IconButton>
                      <Typography sx={{ width: 18, textAlign: 'center', fontWeight: 900 }}>{card.count}</Typography>
                      <IconButton size="small" disabled={card.count >= 4} onClick={() => changeQuantity(card, 1)}><AddRoundedIcon fontSize="small" /></IconButton>
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5, pb: 1 }}>
                  {sortedSelectedCards.map((card) => (
                    <Paper key={cardKey(card)} variant="outlined" sx={{ minWidth: 0, p: 1, bgcolor: 'rgba(255,255,255,0.025)', overflow: 'hidden' }}>
                      <Box
                        aria-label={`${card.count} copies of ${card.name}`}
                        sx={{
                          position: 'relative',
                          width: '100%',
                          aspectRatio: '0.716',
                          mb: `${(card.count - 1) * 9}px`,
                        }}
                      >
                        {Array.from({ length: card.count }, (_, index) => (
                          <Box
                            key={index}
                            component="img"
                            src={card.image}
                            alt={index === card.count - 1 ? card.name : ''}
                            sx={{
                              position: 'absolute',
                              inset: 0,
                              top: `${index * 9}px`,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: 0.75,
                              border: '1px solid',
                              borderColor: index === card.count - 1 ? 'secondary.main' : 'rgba(255,255,255,0.38)',
                              boxShadow: '0 5px 12px rgba(0,0,0,0.42)',
                              zIndex: index + 1,
                            }}
                          />
                        ))}
                      </Box>
                      <Typography noWrap fontWeight={800} sx={{ mt: 0.75, fontSize: '0.78rem' }}>{card.name}</Typography>
                      <Stack direction="row" alignItems="center" justifyContent="center" sx={{ mt: 0.5 }}>
                        <IconButton size="small" onClick={() => changeQuantity(card, -1)} aria-label={`Remove ${card.name}`}>
                          <RemoveRoundedIcon fontSize="small" />
                        </IconButton>
                        <Typography sx={{ minWidth: 36, textAlign: 'center', fontWeight: 900 }}>{card.count} / 4</Typography>
                        <IconButton size="small" disabled={card.count >= 4} onClick={() => changeQuantity(card, 1)} aria-label={`Add ${card.name}`}>
                          <AddRoundedIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          ) : (
            <Stack spacing={2.5} sx={{ py: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                {[
                  ['Unique', uniqueCards],
                  ['Inkable', inkableCards],
                  ['Uninkable', uninkableCards],
                  ['Avg. cost', averageCost.toFixed(1)],
                  ['Characters', typeCounts.Character],
                  ['Actions', typeCounts.Action],
                ].map(([label, value]) => (
                  <Paper key={label} variant="outlined" sx={{ p: 1.25, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.025)' }}>
                    <Typography variant="h6" color="secondary.light">{value}</Typography>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                  </Paper>
                ))}
              </Box>
              <Box>
                <Typography fontWeight={900} sx={{ mb: 1 }}>Inkability</Typography>
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={3}>
                  <Box
                    role="img"
                    aria-label={`${inkableCards} inkable cards and ${uninkableCards} uninkable cards`}
                    sx={{
                      position: 'relative',
                      width: 132,
                      height: 132,
                      flexShrink: 0,
                      borderRadius: '50%',
                      background: totalCards
                        ? `conic-gradient(#d9a928 0 ${inkablePercentage}%, #8f58c7 ${inkablePercentage}% 100%)`
                        : 'rgba(255,255,255,0.08)',
                      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        inset: 22,
                        borderRadius: '50%',
                        bgcolor: '#090a18',
                        boxShadow: '0 0 0 1px rgba(255,255,255,0.08)',
                      },
                    }}
                  >
                    <Stack sx={{ position: 'absolute', inset: 0, zIndex: 1 }} alignItems="center" justifyContent="center">
                      <Typography variant="h5" color="secondary.light">{inkablePercentage}%</Typography>
                      <Typography variant="caption" color="text.secondary">inkable</Typography>
                    </Stack>
                  </Box>
                  <Stack spacing={1.25} sx={{ minWidth: 132 }}>
                    {[
                      ['Inkable', inkableCards, inkablePercentage, '#d9a928'],
                      ['Uninkable', uninkableCards, uninkablePercentage, '#8f58c7'],
                    ].map(([label, count, percentage, color]) => (
                      <Stack key={label} direction="row" alignItems="center" spacing={1}>
                        <Box sx={{ width: 10, height: 10, bgcolor: color, borderRadius: '50%', flexShrink: 0 }} />
                        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                          <Typography variant="body2" fontWeight={800}>{label}</Typography>
                          <Typography variant="caption" color="text.secondary">{count} cards · {percentage}%</Typography>
                        </Box>
                      </Stack>
                    ))}
                  </Stack>
                </Stack>
              </Box>
              <Box>
                <Typography fontWeight={900} sx={{ mb: 1 }}>Card types</Typography>
                {CARD_TYPES.map((type) => (
                  <Stack key={type} direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
                    <Typography variant="body2" sx={{ width: 74 }}>{type}</Typography>
                    <LinearProgress variant="determinate" value={totalCards ? (typeCounts[type] / totalCards) * 100 : 0} sx={{ flexGrow: 1, height: 7, borderRadius: 1 }} />
                    <Typography variant="body2" sx={{ width: 24, textAlign: 'right' }}>{typeCounts[type]}</Typography>
                  </Stack>
                ))}
              </Box>
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1 }}>
                  <Typography fontWeight={900}>Ink cost curve</Typography>
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    <Box sx={{ width: 18, height: 2, bgcolor: 'secondary.light' }} />
                    <Typography variant="caption" color="text.secondary">Balanced 60-card guide</Typography>
                  </Stack>
                </Stack>
                <Box sx={{ position: 'relative', height: 146, px: 0.5 }}>
                  <Box sx={{ position: 'absolute', inset: '0 4px 18px', zIndex: 2, pointerEvents: 'none' }}>
                    <Box
                      component="svg"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                      sx={{ width: '100%', height: '100%', overflow: 'visible' }}
                    >
                      <polyline
                        points={targetLinePoints}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        vectorEffect="non-scaling-stroke"
                        style={{ color: '#f1cf6a', filter: 'drop-shadow(0 0 4px rgba(241, 207, 106, 0.48))' }}
                      />
                      {BALANCED_COST_TARGET.map((count, index) => (
                        <circle
                          key={`${index}-${count}`}
                          cx={(index / 8) * 100}
                          cy={100 - ((count / maxCostCount) * 78 + 12)}
                          r="1.4"
                          fill="#f1cf6a"
                          vectorEffect="non-scaling-stroke"
                        />
                      ))}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 0.5, alignItems: 'end', height: '100%' }}>
                    {costCurve.map((item, index) => (
                      <Stack key={item.label} alignItems="center" justifyContent="flex-end" sx={{ height: '100%', position: 'relative', zIndex: 1 }}>
                        <Typography variant="caption" color="text.secondary">{item.count}</Typography>
                        <Box sx={{ width: '100%', maxWidth: 24, height: `${Math.max(4, (item.count / maxCostCount) * 102)}px`, bgcolor: 'secondary.main', opacity: 0.78, borderRadius: '2px 2px 0 0' }} />
                        <Typography variant="caption">{item.label}</Typography>
                        <Typography variant="caption" sx={{ color: 'secondary.light', fontSize: '0.62rem', lineHeight: 1 }}>
                          {BALANCED_COST_TARGET[index]}
                        </Typography>
                      </Stack>
                    ))}
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Gold numbers are a balanced starting point. Aggro decks usually run lower; control decks can lean higher.
                </Typography>
              </Box>
            </Stack>
          )}

          {notice?.severity === 'success' && <Alert severity="success" sx={{ mt: 2 }}>{notice.message}</Alert>}
          <Stack direction="row" spacing={1} sx={{ py: 2, mt: 1, bgcolor: 'rgba(6, 7, 18, 0.96)' }}>
            <Button fullWidth variant="contained" startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveRoundedIcon />} disabled={!selectedCards.length || saving} onClick={saveDeck}>
              {isEditing ? 'Update Deck' : 'Save Deck'}
            </Button>
            <Tooltip title="Clear deck">
              <span><IconButton color="error" disabled={!selectedCards.length || saving} onClick={clearDeck}><DeleteSweepRoundedIcon /></IconButton></span>
            </Tooltip>
          </Stack>
          {!isLegalDeck && selectedCards.length > 0 && (
            <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ display: 'block', mt: -1 }}>
              In-progress decks can be saved before reaching 60 cards.
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default BuilderCards;
