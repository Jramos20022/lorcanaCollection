import { Container } from '@mui/material';
import MainCards from '../components/MainCards';

const Cards = () => {

    return (
      <Container maxWidth="xl" sx={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', py: 4 }}>
        <MainCards />     
      </Container>
    );
  };
  
  export default Cards;
