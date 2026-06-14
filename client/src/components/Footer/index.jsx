import { Box, Typography, IconButton, Link } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';

export default function Footer() {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 2,
          background: 'rgba(8, 11, 23, 0.92)',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="body2" color="text.secondary" align="center">
          © 2024 Los Tres Codigos
        </Typography>
        <Box sx={{ ml: 2 }}>
          <IconButton component="a" href="https://github.com/Velazqe/illuminears" target="_blank" sx={{ color: 'secondary.light' }}>
            <GitHubIcon />
          </IconButton>
        </Box>
      </Box>
    );
  }
