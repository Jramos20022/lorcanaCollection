import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Auth from "../../utils/auth";
import AuthModal from '../AuthModal';

export default function Navbar() {
  const currentPage = useLocation().pathname;
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState(() => {
    if (currentPage === '/login') return 'login';
    if (currentPage === '/signup') return 'signup';
    return '';
  });
  useEffect(() => {
    if (currentPage === '/login') setAuthMode('login');
    if (currentPage === '/signup') setAuthMode('signup');
  }, [currentPage]);
  const navLinkStyles = (path) => ({
    color: currentPage === path ? 'secondary.light' : 'text.primary',
    backgroundColor: 'transparent',
    borderRadius: 0,
    minHeight: 34,
    px: 1.25,
    py: 0.5,
    fontSize: '0.82rem',
    fontWeight: 700,
    borderBottom: '1px solid',
    borderBottomColor: currentPage === path ? 'secondary.main' : 'transparent',
    '&:hover': {
      color: 'secondary.light',
      backgroundColor: 'transparent',
      borderBottomColor: 'secondary.main',
    },
  });
  const logout = (event) => {
    event.preventDefault();
    Auth.logout();
  };
  const closeAuthModal = () => {
    setAuthMode('');
    if (currentPage === '/login' || currentPage === '/signup') navigate('/', { replace: true });
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: 'linear-gradient(90deg, rgba(13, 13, 31, 0.68), rgba(24, 17, 48, 0.58))',
        backdropFilter: 'blur(9px)',
        borderBottom: '1px solid',
        borderColor: 'rgba(216, 169, 67, 0.10)',
      }}
    >
      <Toolbar
        sx={{
          width: '100%',
          maxWidth: 1440,
          mx: 'auto',
          minHeight: { xs: 54, sm: 58 },
          justifyContent: 'space-between',
          gap: { xs: 1, sm: 2 },
          px: { xs: 2, sm: 3 },
          py: { xs: 0.75, sm: 0 },
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
        }}
      >
        <Typography
          variant="h5"
          color="inherit"
          component={Link}
          to="/"
          sx={{
            flexShrink: 0,
            width: 'fit-content',
            minWidth: 'fit-content',
            color: 'secondary.light',
            fontFamily: 'Cinzel, Georgia, serif',
            fontWeight: 700,
            letterSpacing: 0,
            lineHeight: 1,
            textDecoration: 'none',
            textShadow: '0 0 18px rgba(216, 169, 67, 0.22)',
            '&:hover': { color: 'secondary.main', textDecoration: 'none' },
          }}
        >
          The Inkcaster
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 0.25, ml: 'auto' }}>
          <Button color="inherit" component={Link} to="/cards"
            sx={navLinkStyles('/cards')}>
            Cards
          </Button>
          {Auth.loggedIn() ? (
            <>
            <Button color="inherit" component={Link} to="/builder"
            sx={navLinkStyles('/builder')}>
            Deck Builder
          </Button>
          <Button color="inherit" component={Link} to="/collection"
            sx={navLinkStyles('/collection')}>
            Collection
          </Button>
          <Button color="inherit" component={Link} to="/profile"
            sx={navLinkStyles('/profile')}>
            {Auth.getProfile().data.username} Decks
          </Button>
          <Button color="inherit" onClick={logout} sx={{ ...navLinkStyles(''), borderBottomColor: 'transparent' }}>
            Logout
          </Button>
          </>
        ) : (
          <>
          <Button color="inherit" onClick={() => setAuthMode('login')}
            sx={navLinkStyles('')}>
            Login
          </Button>
          <Button color="inherit" onClick={() => setAuthMode('signup')}
            sx={navLinkStyles('')}>
            Signup
          </Button>
          </>
        )}          
        </Box>
      </Toolbar>
      <AuthModal mode={authMode} onModeChange={setAuthMode} onClose={closeAuthModal} />
    </AppBar>
  );
}
