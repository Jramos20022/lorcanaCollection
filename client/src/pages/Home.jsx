import { Container, Typography, Button, Box, Stack } from '@mui/material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import StyleRoundedIcon from '@mui/icons-material/StyleRounded';
import CollectionsBookmarkRoundedIcon from '@mui/icons-material/CollectionsBookmarkRounded';
import { Link } from 'react-router-dom';
import Auth from "../utils/auth";
import backgroundImage from "../../public/inkcaster-hero.jpg";


const Home = () => {
  const isLoggedIn = Auth.loggedIn();
  const username = isLoggedIn ? Auth.getProfile().data.username : null;

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        position: 'relative',
        backgroundImage: `linear-gradient(180deg, rgba(8, 11, 23, 0.82) 0%, rgba(18, 14, 38, 0.74) 48%, rgba(8, 11, 23, 0.96) 100%), url(${backgroundImage})`,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        display: 'flex',
        flexGrow: 1,
        minHeight: { xs: 'calc(100vh - 116px)', md: 'calc(100vh - 65px)' },
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: 'column',
        px: { xs: 2.5, sm: 4 },
        pt: { xs: 7, md: 10 },
        pb: { xs: 4, md: 5 },
        overflow: 'hidden',
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 38%, rgba(109, 59, 214, 0.12), transparent 42%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Stack
        spacing={{ xs: 2.5, md: 3 }}
        alignItems="center"
        sx={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 980, mx: 'auto', textAlign: 'center' }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'secondary.light' }}>
          <AutoAwesomeRoundedIcon fontSize="small" />
          <Typography variant="overline" sx={{ fontWeight: 900, letterSpacing: '0.14em' }}>
            {isLoggedIn ? `Welcome back, ${username}` : 'Your Lorcana deck workshop'}
          </Typography>
        </Stack>

        <Typography
          component="h1"
          sx={{
            color: '#fffaf0',
            fontFamily: 'Cinzel, Georgia, serif',
            fontSize: { xs: '2.8rem', sm: '4.4rem', md: '5.8rem' },
            fontWeight: 700,
            lineHeight: 0.96,
            letterSpacing: 0,
            maxWidth: 900,
            textShadow: '0 14px 42px rgba(0, 0, 0, 0.72)',
          }}
        >
          Build your next
          <Box
            component="span"
            sx={{ display: 'block', color: 'secondary.light', mt: { xs: 1.5, md: 2 } }}
          >
            legendary deck.
          </Box>
        </Typography>

        <Typography
          variant="h6"
          sx={{ color: 'text.secondary', maxWidth: 650, fontWeight: 400, lineHeight: 1.55 }}
        >
          Shape your strategy, discover new cards, and keep every deck ready for the next quest.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: { xs: '100%', sm: 'auto' }, pt: 1 }}>
          <Button
            component={Link}
            to={isLoggedIn ? '/builder' : '/signup'}
            variant="contained"
            color="primary"
            size="large"
            startIcon={<StyleRoundedIcon />}
            sx={{ minWidth: 190, px: 3.5 }}
          >
            {isLoggedIn ? 'Build a deck' : 'Start building'}
          </Button>
          <Button
            component={Link}
            to="/cards"
            variant="contained"
            color="secondary"
            size="large"
            startIcon={<CollectionsBookmarkRoundedIcon />}
            sx={{ minWidth: 190, px: 3.5 }}
          >
            Browse cards
          </Button>
        </Stack>
      </Stack>

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 760,
          mx: 'auto',
          mt: { xs: 7, md: 10 },
          pt: 3,
          borderTop: '1px solid',
          borderColor: 'divider',
          textAlign: 'center',
        }}
      >
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 1.5 }}>
          {isLoggedIn ? 'Your saved decks are waiting.' : 'Already charting your quest?'}
        </Typography>
        <Button
          component={Link}
          to={isLoggedIn ? '/profile' : '/login'}
          color="secondary"
          startIcon={<CollectionsBookmarkRoundedIcon />}
        >
          {isLoggedIn ? 'Open my decks' : 'Sign in to your collection'}
        </Button>
      </Box>
    </Container>
  );
};

export default Home;
