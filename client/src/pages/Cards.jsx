import { Container } from '@mui/material';
import MainCards from '../components/MainCards';

const Cards = () => {

    return (
      <Container maxWidth={false} sx={{ display: 'flex', flexGrow: 1, flexDirection: 'column', px: { xs: 1.5, sm: 2.5 }, py: 2.5 }}>
        <MainCards />     
      </Container>
    );
  };
  
  export default Cards;
