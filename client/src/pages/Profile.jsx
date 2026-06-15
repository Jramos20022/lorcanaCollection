import { Container, Typography, Grid, Card, CardContent, CardMedia, CircularProgress, Button } from '@mui/material';
import { useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { QUERY_MY_DECKS } from "../utils/queries";
import { REMOVE_DECK } from "../utils/mutations";
import Auth from "../utils/auth";


const Profile = () => {
  const navigate = useNavigate();
  // Fetching decks data using useQuery
  const { loading, error, data, refetch } = useQuery(QUERY_MY_DECKS);
  // Remove selected deck using useMutation
  const [removeDeck] = useMutation(REMOVE_DECK);

  // Refetch data on component mount
  useEffect(() => {
    refetch();     
  }, [refetch]);

  // If data is loading, display CircularProgress
  if (loading) return <CircularProgress />;

  // If there's an error fetching data, display an error message
  if (error) return <Typography variant="h6">Error fetching decks: {error.message}</Typography>; 
  
  const editDeck = (deck) => {
    navigate('/builder', { state: { selectedDeck: deck, isEditing: true } });
  };

  // Delete the selected deck by ID
  const deleteDeck = async (deckId) => {
    try {
      await removeDeck({
        variables: { deckId }
      });
      console.log(`${deckId} deleted`);
      // Recall QUERY_MY_DECKS to display current decks after deletion
      refetch();
    } catch (error) {
      console.error("Error deleting deck:", error);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ flexGrow: 1, paddingTop: '32px', pb: 5 }}>
      <>
          <Typography variant="h3" sx={{ textAlign: 'center', marginBottom: '28px', color: 'secondary.light' }}>
            {`${Auth.getProfile().data.username}'s Decks`}
          </Typography>
  
          <Grid container spacing={3}>
            {data.myDecks.map((deck) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={deck._id}>
                <Card
                  sx={{
                    background: 'linear-gradient(180deg, rgba(29, 22, 56, 0.98), rgba(8, 11, 23, 0.98))',
                    border: '1px solid',
                    borderColor: 'divider',
                    width: '100%',
                    height: '86%',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out, border-color 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      borderColor: 'secondary.main',
                      boxShadow: '0 22px 44px rgba(0, 0, 0, 0.42)',
                    },
                  }}
                >
                  <CardContent sx={{ display: 'flex', justifyContent: 'space-between', backgroundColor: 'rgba(216, 169, 67, 0.10)' }}>
                    <Typography variant="h5" sx={{ color: 'secondary.light', textAlign:'center', width:'100%' }}>
                      {deck.deckName}
                    </Typography>
                    {/* Button to delete the deck */}
                    {/* <Button onClick={() => deleteDeck(deck._id)}>Delete</Button> */}
                  </CardContent>
                  {/* Display the first image of the deck */}
                  <CardMedia
                    component="img"
                    image={deck.cards.length > 0 ? deck.cards[0].image : '/default-image.jpg'} // Use a default image if no cards in deck
                    alt={deck.deckName}
                    sx={{objectFit:'contain' }}
                  />
                </Card>
                <Button variant="contained" color="secondary" sx={{marginTop:'20px'}} onClick={() => editDeck(deck)}>Edit</Button>
                    {/* Button to delete the deck */}
                    <Button variant="contained" sx={{display:'flex', float:'right', marginTop:'20px'}} onClick={() => deleteDeck(deck._id)}>Delete</Button>
              </Grid>
            ))}
          </Grid>
      </>
    </Container>
  );
  
};

export default Profile;
