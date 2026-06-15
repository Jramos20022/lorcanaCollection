import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Modal,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import StyleRoundedIcon from '@mui/icons-material/StyleRounded';
import { QUERY_MY_DECKS } from '../utils/queries';
import { REMOVE_DECK } from '../utils/mutations';
import Auth from '../utils/auth';

const COLOR_VALUES = {
  Amber: '#d9a928',
  Amethyst: '#8f58c7',
  Emerald: '#319665',
  Ruby: '#c9434d',
  Sapphire: '#3b82bd',
  Steel: '#8793a0',
};

const Profile = () => {
  const navigate = useNavigate();
  const [previewDeck, setPreviewDeck] = useState(null);
  const { loading, error, data, refetch } = useQuery(QUERY_MY_DECKS);
  const [removeDeck, { loading: deleting }] = useMutation(REMOVE_DECK);
  const decks = data?.myDecks || [];

  useEffect(() => {
    refetch();
  }, [refetch]);

  const editDeck = (deck) => {
    navigate('/builder', { state: { selectedDeck: deck, isEditing: true } });
  };

  const deleteDeck = async (deckId) => {
    await removeDeck({ variables: { deckId } });
    await refetch();
  };

  if (loading) {
    return <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}><CircularProgress color="secondary" /></Box>;
  }

  if (error) {
    return <Container maxWidth="lg" sx={{ py: 5 }}><Alert severity="error">{error.message}</Alert></Container>;
  }

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'flex-end' }} justifyContent="space-between" spacing={2} sx={{ mb: 4 }}>
        <Box>
          <Typography
            component="h1"
            sx={{
              color: 'secondary.light',
              fontFamily: 'Palatino Linotype, Book Antiqua, Georgia, serif',
              fontSize: { xs: '2.25rem', sm: '3rem' },
              fontWeight: 600,
              lineHeight: 1.05,
            }}
          >
            {`${Auth.getProfile().data.username}'s Decks`}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            {decks.length} saved {decks.length === 1 ? 'deck' : 'decks'}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate('/builder')}>
          New Deck
        </Button>
      </Stack>

      {!decks.length ? (
        <Box sx={{ py: 10, textAlign: 'center', borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider' }}>
          <StyleRoundedIcon sx={{ fontSize: 48, color: 'secondary.main', mb: 1.5 }} />
          <Typography variant="h5">No saved decks yet</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2.5 }}>Start with a few cards and shape the deck as you go.</Typography>
          <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={() => navigate('/builder')}>Build a Deck</Button>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' }, gap: 2.5 }}>
          {decks.map((deck) => {
            const cards = deck.cards || [];
            const totalCards = cards.reduce((total, card) => total + (Number(card.count) || 0), 0);
            const colors = [...new Set(cards.flatMap((card) => String(card.color || '').split(',').map((color) => color.trim())).filter(Boolean))];
            const previewCards = cards.slice(0, 3);

            return (
              <Card
                key={deck._id}
                sx={{
                  overflow: 'hidden',
                  bgcolor: 'rgba(10, 11, 27, 0.92)',
                  backgroundImage: 'none',
                  transition: 'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    borderColor: 'rgba(216, 169, 67, 0.48)',
                    boxShadow: '0 16px 34px rgba(0,0,0,0.36)',
                  },
                }}
              >
                <Box
                  onClick={() => setPreviewDeck(deck)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setPreviewDeck(deck);
                    }
                  }}
                  aria-label={`View ${deck.deckName}`}
                  sx={{ position: 'relative', height: 250, cursor: 'pointer', overflow: 'hidden', bgcolor: 'rgba(255,255,255,0.025)' }}
                >
                  {previewCards.length ? previewCards.map((card, index) => (
                    <Box
                      key={card._id || `${deck._id}-${index}`}
                      component="img"
                      src={card.image}
                      alt={index === previewCards.length - 1 ? deck.deckName : ''}
                      sx={{
                        position: 'absolute',
                        width: 150,
                        aspectRatio: '0.716',
                        objectFit: 'cover',
                        left: `calc(50% - 75px + ${(index - 1) * 38}px)`,
                        top: 22 + Math.abs(index - 1) * 9,
                        transform: `rotate(${(index - 1) * 5}deg)`,
                        zIndex: index + 1,
                        borderRadius: 1,
                        border: '1px solid rgba(255,255,255,0.28)',
                        boxShadow: '0 14px 28px rgba(0,0,0,0.5)',
                      }}
                    />
                  )) : (
                    <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
                      <StyleRoundedIcon sx={{ fontSize: 52, color: 'text.secondary' }} />
                    </Stack>
                  )}
                  <Chip
                    label={`${totalCards} / 60`}
                    size="small"
                    color={totalCards >= 60 ? 'success' : 'default'}
                    sx={{ position: 'absolute', top: 12, right: 12, zIndex: 5, fontWeight: 900, backdropFilter: 'blur(8px)' }}
                  />
                </Box>

                <Box sx={{ px: 1.75, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography noWrap fontWeight={800} sx={{ fontSize: '1rem' }}>{deck.deckName}</Typography>
                      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">{cards.length} unique</Typography>
                        {colors.map((color) => (
                          <Tooltip title={color} key={color}>
                            <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: COLOR_VALUES[color] || '#777', border: '1px solid rgba(255,255,255,0.38)' }} />
                          </Tooltip>
                        ))}
                      </Stack>
                    </Box>
                    <Stack direction="row" spacing={0.25}>
                      <Tooltip title="Edit deck">
                        <IconButton size="small" onClick={() => editDeck(deck)} aria-label={`Edit ${deck.deckName}`}>
                          <EditRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete deck">
                        <span>
                          <IconButton color="error" size="small" disabled={deleting} onClick={() => deleteDeck(deck._id)} aria-label={`Delete ${deck.deckName}`}>
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </Box>
              </Card>
            );
          })}
        </Box>
      )}
      <Modal
        open={Boolean(previewDeck)}
        onClose={() => setPreviewDeck(null)}
        aria-labelledby="deck-preview-title"
      >
        <Paper
          elevation={18}
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'min(94vw, 1120px)',
            maxHeight: '90vh',
            overflowY: 'auto',
            p: { xs: 2, sm: 3 },
            bgcolor: 'rgba(9, 10, 24, 0.98)',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {previewDeck && (() => {
            const previewCards = previewDeck.cards || [];
            const totalCards = previewCards.reduce((total, card) => total + (Number(card.count) || 0), 0);

            return (
              <>
                <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'baseline' }} justifyContent="space-between" spacing={0.5} sx={{ mb: 2.5 }}>
                  <Typography
                    id="deck-preview-title"
                    sx={{
                      fontFamily: 'Palatino Linotype, Book Antiqua, Georgia, serif',
                      fontSize: { xs: '1.8rem', sm: '2.35rem' },
                      fontWeight: 600,
                      color: 'secondary.light',
                    }}
                  >
                    {previewDeck.deckName}
                  </Typography>
                  <Typography color="text.secondary">
                    {previewCards.length} unique · {totalCards} total cards
                  </Typography>
                </Stack>

                {previewCards.length ? (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))', lg: 'repeat(5, minmax(0, 1fr))' }, gap: { xs: 1.25, sm: 2 } }}>
                    {previewCards.map((card, index) => (
                      <Box key={card._id || `${previewDeck._id}-${index}`} sx={{ position: 'relative', minWidth: 0 }}>
                        <Box
                          component="img"
                          src={card.image}
                          alt={card.name}
                          sx={{
                            display: 'block',
                            width: '100%',
                            aspectRatio: '0.716',
                            objectFit: 'cover',
                            borderRadius: 1,
                            border: '1px solid rgba(216,169,67,0.28)',
                            boxShadow: '0 12px 26px rgba(0,0,0,0.38)',
                          }}
                        />
                        <Box
                          aria-label={`${card.count || 0} copies`}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            display: 'grid',
                            placeItems: 'center',
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            bgcolor: 'secondary.main',
                            color: 'secondary.contrastText',
                            border: '2px solid rgba(255,255,255,0.82)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.52)',
                            fontWeight: 900,
                            zIndex: 1,
                          }}
                        >
                          {card.count || 0}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ py: 8, textAlign: 'center' }}>
                    <Typography color="text.secondary">This deck does not contain any cards yet.</Typography>
                  </Box>
                )}
              </>
            );
          })()}
        </Paper>
      </Modal>
    </Container>
  );
};

export default Profile;
