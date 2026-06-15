import BuilderCards from '../components/BuilderCards';
import { useLocation } from 'react-router-dom';

const Builder = () => {
    const location = useLocation();
    const selectedDeck = location.state?.selectedDeck || null;
    const isEditing = Boolean(location.state?.isEditing && selectedDeck);

    return (
      <BuilderCards selectedDeck={selectedDeck} isEditing={isEditing} />
    );
  };
  
  export default Builder;
