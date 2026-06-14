import React, { useState } from 'react';
import { Box, Button, TextField } from '@mui/material';

const SearchBar = ({ onChange }) => {
  const [query, setQuery] = useState('');

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const handleSearch = () => {
    console.log("Its running");
    onChange(query);
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: 1.5,
        width: '100%', 
        padding: '18px',
        mb: 2,
        background: 'linear-gradient(135deg, rgba(29, 22, 56, 0.92), rgba(8, 11, 23, 0.92))',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        boxShadow: '0 18px 36px rgba(0, 0, 0, 0.28)',
      }}
    >
      <TextField
        fullWidth
        variant="outlined"
        value={query}
        onChange={handleInputChange}
        placeholder="Search..."
      />
      <Button 
        variant="contained" 
        color="secondary"
        onClick={handleSearch}
        sx={{ px: 3, whiteSpace: 'nowrap' }}
      >
        Search
      </Button>
    </Box>
  );
};

export default SearchBar;
