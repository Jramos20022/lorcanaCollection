import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import Auth from "../../utils/auth";

export default function Navbar() {
  const currentPage = useLocation().pathname;
  const logout = (event) => {
    event.preventDefault();
    Auth.logout();
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: 'rgba(8, 11, 23, 0.88)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', gap: 2, py: 1, flexWrap: 'wrap' }}>
        <Typography
          variant="h4"
          color="inherit"
          component={Link}
          to="/"
          sx={{
            flexGrow: 1,
            minWidth: 'fit-content',
            color: 'secondary.light',
            fontWeight: 900,
            textDecoration: 'none',
            textShadow: '0 0 22px rgba(216, 169, 67, 0.28)',
            '&:hover': { color: 'secondary.main', textDecoration: 'none' },
          }}
        >
          Illuminears Quest
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 1 }}>
          <Button color="inherit" component={Link} to="/cards"
            sx={currentPage === '/cards' ? { color: 'secondary.light', backgroundColor: 'rgba(216, 169, 67, 0.12)' } : { color: 'text.primary' }}>
            Cards
          </Button>
          {Auth.loggedIn() ? (
            <>
            <Button color="inherit" component={Link} to="/builder"
            sx={currentPage === '/builder' ? { color: 'secondary.light', backgroundColor: 'rgba(216, 169, 67, 0.12)' } : { color: 'text.primary' }}>
            Deck Builder
          </Button>
          <Button color="inherit" component={Link} to="/profile"
            sx={currentPage === '/profile' ? { color: 'secondary.light', backgroundColor: 'rgba(216, 169, 67, 0.12)' } : { color: 'text.primary' }}>
            {Auth.getProfile().data.username}'s Decks
          </Button>
          <Button color="inherit" onClick={logout} sx={{ color: 'text.primary' }}>
            Logout
          </Button>
          </>
        ) : (
          <>
          <Button color="inherit" component={Link} to="/login"
            sx={currentPage === '/login' ? { color: 'secondary.light', backgroundColor: 'rgba(216, 169, 67, 0.12)' } : { color: 'text.primary' }}>
            Login
          </Button>
          <Button color="inherit" component={Link} to="/signup"
            sx={currentPage === '/signup' ? { color: 'secondary.light', backgroundColor: 'rgba(216, 169, 67, 0.12)' } : { color: 'text.primary' }}>
            Signup
          </Button>
          </>
        )}          
        </Box>
      </Toolbar>
    </AppBar>
  );
}
