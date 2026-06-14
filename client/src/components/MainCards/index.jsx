import { Container, Typography, Card, CardContent, CardMedia, Button, Modal, Grid, Box } from '@mui/material';
import React, { useEffect, useState, useRef } from 'react';
import SearchBar from '../SearchBar/searchBar';

const MainCards = () => {
  const [cards, setCards] = useState([]);
  const [initialCards, setInitialCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [cardsPerPage] = useState(20);
  const [selectedCard, setSelectedCard] = useState(null);

  const cardRef = useRef(null);

  useEffect(() => {
    fetchCards(currentPage);
  }, [currentPage]);

  const fetchCards = (page) => {
    setLoading(true);
    fetch(`https://api.lorcana-api.com/cards/fetch?page=${page}&pagesize=${cardsPerPage}`)
      .then(response => response.json())
      .then(data => {
        setCards(data);
        setInitialCards(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        setLoading(false);
      });
  };


  const handleSearch = async (query) => {
    console.log(query);
    if (query.trim() === '') return;
    try {
      const response = await fetch(`https://api.lorcana-api.com/cards/fetch?search=Name~${query}`);
      const data = await response.json();
      console.log(data);
      setCards(data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const clearSearch = () => {
    setCards(initialCards);
  };

  const handleNextPage = () => {
    setCurrentPage(prevPage => prevPage + 1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prevPage => prevPage - 1);
    }
  };

  const handleImageError = (event) => {
    event.target.src = '../../../public/vite.svg'; 
    // Random placeholder for now to see if they load
  };

  const handleCardClick = (card) => {
    setSelectedCard(card);
  };

  const handleCloseModal = () => {
    setSelectedCard(null);
  };

  return (
    <Container maxWidth={false} disableGutters sx={{ margin: '10px 0px' }}>
      <SearchBar onChange={handleSearch}/>
      <Button variant="contained" onClick={clearSearch} sx={{ my: 1.5 }}>
        Clear
      </Button>
      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={card.Card_Num}>
            <Card className='target-card'
              sx={{
                width: '100%',
                height: "100%",
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out, border-color 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-6px)',
                  borderColor: 'secondary.main',
                  boxShadow: '0 22px 42px rgba(0, 0, 0, 0.48)',
                },
              }}
              ref={cardRef}
              onClick={() => handleCardClick(card)}
            >
              <CardContent sx={{ width: '100%', height: "100%", padding: 0, paddingBottom: '0 !important' }}>
                <CardMedia
                  component="img"
                  image={card.Image}
                  alt={card.Name}
                  sx={{ width: '100%', height: "100%" }}
                  onError={handleImageError}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
        <Button variant="contained" onClick={handlePreviousPage} disabled={currentPage === 1}>
          Previous
        </Button>
        <Typography variant="body1" sx={{ color: 'secondary.light', fontWeight: 800 }}> Page {currentPage} </Typography>
        <Button variant="contained" onClick={handleNextPage}>
          Next
        </Button>
      </Box>
      
      {selectedCard && (
        <Modal
          open={Boolean(selectedCard)}
          onClose={handleCloseModal}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '92%', md: '680px' },
            height:'auto',
            bgcolor: 'background.elevated',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 28px 70px rgba(0, 0, 0, 0.62)',
            p: 4,
            borderRadius: 2,
            display:'flex',
            flexDirection:'column',
            alignItems:'center',
            justifyContent:'center'
          }}>
            <Button onClick={handleCloseModal} sx={{ position: 'absolute', top: 10, right: 10}}>Close</Button>
            <Typography id="modal-modal-title" variant="h3" component="h3" sx={{textAlign:'center', color: 'secondary.light'}}>
              {selectedCard.Name}
            </Typography>
            <img src={selectedCard.Image} alt={selectedCard.Name} style={{width: 'min(350px, 100%)', borderRadius: '8px', margin:'auto' }} />
            <Typography id="modal-modal-description" sx={{ mt: 2, textAlign:'center'}}>
              <strong>Type:</strong> {selectedCard.Type}<br/>
              <strong>Classifications:</strong> {selectedCard.Classifications}<br/>
              <strong>Abilities:</strong> {selectedCard.Abilities}<br/>
              <strong>Body Text:</strong> {selectedCard.Body_Text}<br/>
              <strong>Rarity:</strong> {selectedCard.Rarity}<br/>
              <strong>Set Name:</strong> {selectedCard.Set_Name}<br/>
              <strong>Card Number:</strong> {selectedCard.Card_Num}<br/>
            </Typography>
          </Box>
        </Modal>
      )}
    </Container>
  );
};

export default MainCards;

