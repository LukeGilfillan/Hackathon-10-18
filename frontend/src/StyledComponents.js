import { styled } from '@mui/material/styles';
import { Button, Paper, Box, Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';

export const StyledSearchPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: '20px',
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.1)}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: `0 25px 50px ${alpha(theme.palette.primary.main, 0.15)}`,
    transform: 'translateY(-2px)',
  },
}));

export const StyledSearchBox = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  maxWidth: '800px',
  margin: '0 auto',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '-20px',
    left: '-20px',
    right: '-20px',
    bottom: '-20px',
    background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.light, 0.1)})`,
    borderRadius: '30px',
    zIndex: -1,
    filter: 'blur(20px)',
  },
}));

export const StyledSearchButton = styled(Button)(({ theme, $isLoading }) => ({
  borderRadius: '25px',
  padding: '12px 24px',
  minWidth: '120px',
  height: '48px',
  background: $isLoading 
    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.7)} 0%, ${alpha(theme.palette.primary.dark, 0.7)} 100%)`
    : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  color: 'white',
  fontWeight: 600,
  fontSize: '1rem',
  textTransform: 'none',
  boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.3)}`,
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
    transform: 'translateY(-2px)',
  },
  '&:disabled': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.grey[400], 0.7)} 0%, ${alpha(theme.palette.grey[500], 0.7)} 100%)`,
    color: alpha(theme.palette.common.white, 0.7),
    boxShadow: 'none',
    transform: 'none',
  },
  '& .button-text': {
    transition: 'opacity 0.3s ease',
    opacity: $isLoading ? 0 : 1,
  },
}));

export const ExampleQueryChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  borderRadius: '20px',
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.light, 0.1)} 100%)`,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  color: theme.palette.primary.main,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.primary.light, 0.2)} 100%)`,
    transform: 'translateY(-2px)',
    boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.2)}`,
  },
}));
