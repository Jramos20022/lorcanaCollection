import { Container, Typography } from '@mui/material';
import BuilderCards from '../components/BuilderCards';

const Builder = () => {

    return (
      <Container maxWidth="xl" sx={{ flexGrow: 1, paddingTop: '20px', pb: 4 }}>
         <BuilderCards />   
      </Container>
    );
  };
  
  export default Builder;
