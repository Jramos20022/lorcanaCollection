import { useQuery } from "@apollo/client";
import { Container, Typography, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import Auth from "../utils/auth";
import backgroundImage from "../../public/Hero.avif";


const Home = () => {
  const logout = (event) => {
    event.preventDefault();
    Auth.logout();
  };

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        position: 'relative',
        backgroundImage: `linear-gradient(90deg, rgba(8, 11, 23, 0.92) 0%, rgba(18, 14, 38, 0.72) 48%, rgba(8, 11, 23, 0.54) 100%), url(${backgroundImage})`,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        display: 'flex',
        flexGrow: 1,
        minHeight: { xs: 'calc(100vh - 140px)', md: 'calc(100vh - 128px)' },
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        px: 3,
        py: 8,
        overflow: 'hidden',
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, transparent 68%, rgba(8, 11, 23, 0.95) 100%)',
          pointerEvents: 'none',
        },
      }}
    >
       {Auth.loggedIn() ? (
        <>
        <Typography variant="h1" component="h1" sx={{ position: 'relative', zIndex: 1, margin: '20px', textAlign: 'center', textShadow: '0 10px 36px rgba(0, 0, 0, 0.72)'}}>
       WELCOME <br></br>{Auth.getProfile().data.username}!
      </Typography>
      <Button variant="contained" color="secondary" onClick={logout} sx={{ position: 'relative', zIndex: 1, margin: "20px"}}>
        Log Out
      </Button>
      </>
       ) : (
        <>
         <Typography variant="h1" component="h1" sx={{ position: 'relative', zIndex: 1, margin: '20px', textAlign: 'center', textShadow: '0 10px 36px rgba(0, 0, 0, 0.72)'}}>
       WELCOME ILLUMINEARS!
      </Typography>
      <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2 }}>
      <Button variant="contained" color="primary" component={Link} to="/login" sx={{ margin: "8px"}}>
        Log In
      </Button>
      <Button variant="contained" color="secondary" component={Link} to="/signup" sx={{ margin: "8px"}}>
        Sign Up
      </Button>
      </Box>      
        </>
       )}
           
    </Container>
  );
};

export default Home;
