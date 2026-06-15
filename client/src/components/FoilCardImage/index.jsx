import { Box, CardMedia } from '@mui/material';

const FoilCardImage = ({ image, alt, active = false, loading, onClick }) => (
  <Box
    sx={{
      position: 'relative',
      overflow: 'hidden',
      isolation: 'isolate',
      aspectRatio: '0.716',
      cursor: onClick ? 'pointer' : 'default',
      '@keyframes foilSweep': {
        '0%': { backgroundPosition: '180% 0%' },
        '100%': { backgroundPosition: '-80% 100%' },
      },
      '@keyframes foilGlow': {
        '0%, 100%': { opacity: 0.25 },
        '50%': { opacity: 0.58 },
      },
    }}
    onClick={onClick}
  >
    <CardMedia
      component="img"
      image={image}
      alt={alt}
      loading={loading}
      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
    <Box
      aria-hidden="true"
      sx={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        opacity: active ? 0.62 : 0,
        mixBlendMode: 'color-dodge',
        background: `linear-gradient(
          115deg,
          transparent 15%,
          rgba(255, 83, 214, 0.55) 31%,
          rgba(96, 214, 255, 0.62) 42%,
          rgba(255, 226, 112, 0.7) 52%,
          rgba(132, 94, 255, 0.58) 63%,
          transparent 79%
        )`,
        backgroundSize: '260% 260%',
        animation: active ? 'foilSweep 1.7s linear infinite' : 'none',
        transition: 'opacity 180ms ease',
      }}
    />
    <Box
      aria-hidden="true"
      sx={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        opacity: active ? 0.36 : 0,
        mixBlendMode: 'screen',
        backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 14px, rgba(255,255,255,0.2) 15px 16px)',
        animation: active ? 'foilGlow 1.25s ease-in-out infinite' : 'none',
        transition: 'opacity 180ms ease',
      }}
    />
  </Box>
);

export default FoilCardImage;
