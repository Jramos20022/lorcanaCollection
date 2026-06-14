import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6d3bd6',
      light: '#9c6cff',
      dark: '#301067',
      contrastText: '#fff8e7',
    },
    secondary: {
      main: '#d8a943',
      light: '#f3d888',
      dark: '#8f6b18',
      contrastText: '#101423',
    },
    error: {
      main: '#ff6b7a',
    },
    success: {
      main: '#67df9b',
    },
    text: {
      primary: '#f6edff',
      secondary: '#c9c2dd',
    },
    background: {
      default: '#080b17',
      paper: '#151128',
      secondary: '#10182b',
      elevated: '#1d1638',
    },
    divider: 'rgba(216, 169, 67, 0.24)',
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: '"Inter", "Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: 'clamp(2.4rem, 6vw, 5rem)',
      fontWeight: 800,
      color: '#fff8e7',
      letterSpacing: 0,
    },
    h3: {
      fontWeight: 800,
      color: '#fff8e7',
      letterSpacing: 0,
    },
    h4: {
      fontWeight: 700,
      color: '#f3d888',
      letterSpacing: 0,
    },
    h5: {
      fontWeight: 700,
      letterSpacing: 0,
    },
    button: {
      fontWeight: 800,
      letterSpacing: 0,
      textTransform: 'none',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            'radial-gradient(circle at 18% 8%, rgba(109, 59, 214, 0.32), transparent 34%), radial-gradient(circle at 86% 4%, rgba(216, 169, 67, 0.20), transparent 30%), linear-gradient(145deg, #080b17 0%, #10182b 48%, #0b0a18 100%)',
          backgroundAttachment: 'fixed',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          minHeight: 42,
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #7d4df1 0%, #4a1fa4 100%)',
          border: '1px solid rgba(243, 216, 136, 0.32)',
          boxShadow: '0 10px 24px rgba(50, 18, 114, 0.35)',
          '&:hover': {
            boxShadow: '0 12px 28px rgba(50, 18, 114, 0.48)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #f3d888 0%, #c8962f 100%)',
          color: '#101423',
          boxShadow: '0 10px 24px rgba(216, 169, 67, 0.22)',
          '&:hover': {
            background: 'linear-gradient(135deg, #ffe9a8 0%, #dda93d 100%)',
            color: '#080b17',
            boxShadow: '0 12px 28px rgba(216, 169, 67, 0.34)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(180deg, rgba(29, 22, 56, 0.96), rgba(12, 17, 32, 0.96))',
          border: '1px solid rgba(216, 169, 67, 0.22)',
          boxShadow: '0 18px 42px rgba(0, 0, 0, 0.34)',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(8, 11, 23, 0.72)',
          '& fieldset': {
            borderColor: 'rgba(216, 169, 67, 0.34)',
          },
          '&:hover fieldset': {
            borderColor: '#d8a943',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#9c6cff',
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#c9c2dd',
        },
      },
    },
  },
});

export default theme;
