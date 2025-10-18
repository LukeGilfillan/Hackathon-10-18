'use client'
import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Chip,
  Button,
  Divider,
  IconButton,
  Tooltip,
  Fade,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  faCheckCircle,
  faTimesCircle,
  faExclamationCircle,
  faExclamationTriangle,
  faCalendarAlt,
  faFileAlt,
  faBuilding,
  faTag,
  faMapMarkerAlt,
  faUser,
  faDollarSign,
  faIndustry,
  faGlobe,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import BusinessIcon from '@mui/icons-material/Business';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import CategoryIcon from '@mui/icons-material/Category';
import ArrowForward from '@mui/icons-material/ArrowForward';

// Source configuration for different grant sources
const SOURCE_CONFIG = {
  'grants.gov': { label: 'Grants.gov', color: 'primary' },
  'nsf': { label: 'NSF', color: 'info' },
  'nih': { label: 'NIH', color: 'success' },
  'default': { label: 'Government', color: 'default' }
};

const StyledContainer = styled(Paper)(({ theme }) => ({
  width: '100%',
  maxWidth: '1200px',
  margin: '0 auto',
  backgroundColor: theme.palette.background.paper,
  borderRadius: '12px',
  boxShadow: theme.shadows[2],
  overflow: 'hidden',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  position: 'relative',
}));

const HeaderSection = styled(Box)(({ theme }) => ({
  padding: '20px 20px 16px 20px',
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const HeaderTitle = styled(Typography)(({ theme }) => ({
  fontSize: '18px',
  fontWeight: 'bold',
  color: theme.palette.text.primary,
  marginBottom: '8px',
}));

const HeaderSubtitle = styled(Typography)(({ theme }) => ({
  fontSize: '14px',
  color: theme.palette.text.secondary,
  fontWeight: 400,
}));

const ColumnHeaders = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '12px 20px',
  backgroundColor: alpha(theme.palette.background.default, 0.6),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
}));

const ColumnHeader = styled(Typography)(({ theme }) => ({
  fontSize: '14px',
  fontWeight: 'bold',
  color: theme.palette.text.primary,
  '&.date': {
    flex: '0 0 80px',
  },
  '&.name': {
    flex: '1 1 auto',
    marginLeft: '16px',
  },
  '&.amount': {
    flex: '0 0 120px',
    textAlign: 'right',
  },
}));

const StyledListItem = styled(ListItem)(({ theme, selected }) => ({
  padding: 0,
  borderBottom: `1px solid ${theme.palette.divider}`,
  '&:last-child': {
    borderBottom: 'none',
  },
  backgroundColor: selected ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
  borderLeft: selected ? `4px solid ${theme.palette.primary.main}` : 'none',
  position: 'relative',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    '& .hover-indicator': {
      width: '4px',
      backgroundColor: theme.palette.primary.main,
    },
  },
}));

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  padding: '12px 20px',
  display: 'flex',
  alignItems: 'flex-start',
  width: '100%',
  flexDirection: 'column',
  position: 'relative',
  '&:hover': {
    backgroundColor: 'transparent',
  },
}));

const HoverIndicator = styled(Box)(({ theme }) => ({
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
  width: '0px',
  backgroundColor: 'transparent',
  transition: 'all 0.3s ease',
}));

const TransactionRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  marginBottom: '12px',
}));

const TransactionDetails = styled(Box)(({ theme }) => ({
  width: '100%',
  marginTop: '8px',
  paddingLeft: '56px', // Align with the content after icon
}));

const OverviewSection = styled(Box)(({ theme }) => ({
  marginBottom: '12px',
  padding: '8px 12px',
  backgroundColor: alpha(theme.palette.background.default, 0.5),
  borderRadius: '6px',
  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
}));

const DetailsGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr', lg: '1fr 1fr 1fr 1fr' },
  gap: theme.spacing(1.5),
  marginTop: theme.spacing(0.5),
}));

const DetailColumn = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
}));

const DetailItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  padding: '2px 0',
  minHeight: '20px',
}));

const TransactionIcon = styled(Avatar)(({ theme, iconcolor }) => ({
  width: 40,
  height: 40,
  backgroundColor: iconcolor || theme.palette.primary.main,
  marginRight: '16px',
  '& .MuiSvgIcon-root': {
    fontSize: '20px',
    color: theme.palette.common.white,
  },
}));

const TransactionDate = styled(Typography)(({ theme }) => ({
  fontSize: '14px',
  color: theme.palette.text.primary,
  fontWeight: 500,
  flex: '0 0 80px',
}));

const TransactionName = styled(Box)(({ theme }) => ({
  flex: '1 1 auto',
  marginLeft: '16px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
}));

const TransactionTitle = styled(Typography)(({ theme }) => ({
  fontSize: '14px',
  color: theme.palette.text.primary,
  fontWeight: 500,
  marginBottom: '4px',
  lineHeight: 1.3,
}));

const TransactionStatus = styled(Chip)(({ theme }) => ({
  fontSize: '12px',
  height: '20px',
  backgroundColor: theme.palette.warning.light,
  color: theme.palette.warning.contrastText,
  '& .MuiChip-label': {
    padding: '0 8px',
  },
}));

const TransactionAmount = styled(Box)(({ theme }) => ({
  flex: '0 0 120px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '8px',
}));

const AmountText = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'positive',
})(({ theme, positive }) => ({
  fontSize: '14px',
  fontWeight: 'bold',
  color: positive ? theme.palette.success.main : theme.palette.text.primary,
}));

const ArrowIcon = styled(ArrowForward)(({ theme }) => ({
  fontSize: '16px',
  color: theme.palette.text.secondary,
}));

const FooterButton = styled(Button)(({ theme }) => ({
  width: '100%',
  padding: '16px',
  borderRadius: '8px',
  border: `1px solid ${theme.palette.divider}`,
  color: theme.palette.text.primary,
  backgroundColor: 'transparent',
  textTransform: 'none',
  fontSize: '14px',
  fontWeight: 500,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const StatusChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== 'active',
})(({ theme, active }) => ({
  borderRadius: '20px',
  fontWeight: theme.typography.fontWeightMedium,
  color: theme.palette.common.white,
  backgroundColor: active ? theme.palette.success.main : theme.palette.error.main,
  '& .MuiChip-icon': {
    color: 'inherit',
  },
  transition: 'all 0.2s ease-in-out',
}));

const StyledCard = styled(Card)(({ theme, selected }) => ({
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  border: selected ? `2px solid ${theme.palette.primary.main}` : `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: selected ? theme.shadows[2] : 'none',
  backgroundColor: selected ? alpha(theme.palette.primary.main, 0.02) : 'transparent',
  position: 'relative',
  marginBottom: '0px',
  borderLeft: selected ? `4px solid ${theme.palette.primary.main}` : `4px solid transparent`,
  borderBottom: `1px solid ${theme.palette.divider}`,

  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    boxShadow: theme.shadows[1],
    '& .hover-indicator': {
      width: '4px',
      backgroundColor: theme.palette.primary.main,
    },
  },
  '& .MuiCardContent-root': {
    padding: '12px 16px',
    '&:last-child': {
      paddingBottom: '12px',
    },
  },
}));

const LoadingCard = styled(Card)(({ theme }) => ({
  cursor: 'default',
  transition: 'all 0.3s ease',
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: 'none',
  backgroundColor: 'transparent',
  position: 'relative',
  marginBottom: '0px',
  borderLeft: `4px solid transparent`,
  borderBottom: `1px solid ${theme.palette.divider}`,
  filter: 'blur(1.5px)',
  opacity: 0.6,
  animation: 'pulse 2s ease-in-out infinite',
  '@keyframes pulse': {
    '0%': { opacity: 0.6 },
    '50%': { opacity: 0.8 },
    '100%': { opacity: 0.6 },
  },
  '& .MuiCardContent-root': {
    padding: '12px 16px',
    '&:last-child': {
      paddingBottom: '12px',
    },
  },
}));

const SkeletonBox = styled(Box)(({ theme, width, height }) => ({
  backgroundColor: alpha(theme.palette.text.primary, 0.1),
  borderRadius: '4px',
  width: width || '100%',
  height: height || '16px',
  marginBottom: '8px',
  animation: 'shimmer 1.5s ease-in-out infinite',
  '@keyframes shimmer': {
    '0%': { backgroundColor: alpha(theme.palette.text.primary, 0.1) },
    '50%': { backgroundColor: alpha(theme.palette.text.primary, 0.2) },
    '100%': { backgroundColor: alpha(theme.palette.text.primary, 0.1) },
  },
}));

const SkeletonChip = styled(Box)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.2),
  borderRadius: '20px',
  height: '24px',
  width: '80px',
  marginRight: '8px',
  marginBottom: '8px',
  animation: 'shimmer 1.5s ease-in-out infinite',
  '@keyframes shimmer': {
    '0%': { backgroundColor: alpha(theme.palette.primary.main, 0.2) },
    '50%': { backgroundColor: alpha(theme.palette.primary.main, 0.3) },
    '100%': { backgroundColor: alpha(theme.palette.primary.main, 0.2) },
  },
}));

const SkeletonIcon = styled(Box)(({ theme }) => ({
  width: 36,
  height: 36,
  borderRadius: '10px',
  backgroundColor: alpha(theme.palette.primary.main, 0.2),
  marginRight: '12px',
  animation: 'shimmer 1.5s ease-in-out infinite',
  '@keyframes shimmer': {
    '0%': { backgroundColor: alpha(theme.palette.primary.main, 0.2) },
    '50%': { backgroundColor: alpha(theme.palette.primary.main, 0.3) },
    '100%': { backgroundColor: alpha(theme.palette.primary.main, 0.2) },
  },
}));

const formatCurrency = (amount) => {
  if (!amount) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatShortDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
};

const RecommendationsListWrapper = ({
  opportunities = [],
  onSelectOpportunity,
  currentIndex = 0,
  showFooter = true,
  onLoadMore,
  hasMore = false,
  showList,
  onToggleList,
  isLoading = false
}) => {
  const theme = useTheme();
  const [displayCount, setDisplayCount] = useState(5);

  const getDaysUntilDeadline = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const timeDiff = deadlineDate - now;
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  };

  const getDeadlineIcon = (days) => {
    if (days < 3) return { icon: faExclamationCircle, color: 'error.main' };
    if (days >= 3 && days <= 7) return { icon: faExclamationTriangle, color: 'warning.main' };
    return { icon: faCheckCircle, color: 'success.main' };
  };

  const getStatusChip = (opportunity) => {
    if (opportunity.active === false) {
      return <TransactionStatus label="Inactive" size="small" />;
    }
    if (opportunity.responseDeadline) {
      const daysLeft = getDaysUntilDeadline(opportunity.responseDeadline);

      if (daysLeft <= 0) {
        return <TransactionStatus label="Expired" size="small" />;
      } else if (daysLeft <= 7) {
        return <TransactionStatus label="Urgent" size="small" />;
      } else if (daysLeft <= 30) {
        return <TransactionStatus label="Due Soon" size="small" />;
      }
    }
    return null;
  };

  const handleLoadMore = () => {
    if (onLoadMore) {
      onLoadMore();
      // When external onLoadMore is called, increase displayCount to show more
      setDisplayCount(prev => Math.min(prev + 10, opportunities.length));
    } else {
      setDisplayCount(prev => Math.min(prev + 10, opportunities.length));
    }
  };

  // Use displayCount for pagination, but if onLoadMore is provided, it will add more opportunities to the array
  const displayedOpportunities = opportunities.slice(0, displayCount);

  // Generate skeleton loading cards
  const generateSkeletonCards = (count = 3) => {
    return Array.from({ length: count }, (_, index) => (
      <Grid item xs={12} key={`skeleton-${index}`}>
        <Fade in timeout={300} style={{ transitionDelay: `${index * 100}ms` }}>
          <LoadingCard>
            <Box sx={{ display: 'flex' }}>
              <Box
                sx={{
                  width: '4px',
                  transition: 'all 0.2s ease-in-out',
                  backgroundColor: 'transparent'
                }}
              />
              <CardContent sx={{
                flexGrow: 1,
                p: 1.5,
                '&:last-child': {
                  paddingBottom: 1.5,
                },
              }}>
                {/* Header Section */}
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Box sx={{ flex: 1, mr: 2 }}>
                    <SkeletonBox height="20px" width="70%" />
                    <SkeletonBox height="16px" width="40%" />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <SkeletonChip />
                    <SkeletonChip />
                    <SkeletonChip />
                  </Box>
                </Box>

                {/* Description */}
                <Box sx={{ mb: 2 }}>
                  <SkeletonBox height="16px" width="100%" />
                  <SkeletonBox height="16px" width="85%" />
                </Box>

                {/* Key Information Cards */}
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
                  gap: 1.5,
                  mt: 2,
                }}>
                  {/* Agency Card */}
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    borderRadius: '12px',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  }}>
                    <SkeletonIcon />
                    <Box sx={{ flex: 1 }}>
                      <SkeletonBox height="12px" width="60%" />
                      <SkeletonBox height="14px" width="80%" />
                    </Box>
                  </Box>

                  {/* Financial Card */}
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    backgroundColor: alpha(theme.palette.success.main, 0.05),
                    borderRadius: '12px',
                    border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                  }}>
                    <SkeletonIcon />
                    <Box sx={{ flex: 1 }}>
                      <SkeletonBox height="12px" width="70%" />
                      <SkeletonBox height="14px" width="90%" />
                    </Box>
                  </Box>

                  {/* Location Card */}
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    backgroundColor: alpha(theme.palette.info.main, 0.05),
                    borderRadius: '12px',
                    border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                  }}>
                    <SkeletonIcon />
                    <Box sx={{ flex: 1 }}>
                      <SkeletonBox height="12px" width="50%" />
                      <SkeletonBox height="14px" width="75%" />
                    </Box>
                  </Box>

                  {/* Contact Card */}
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    backgroundColor: alpha(theme.palette.secondary.main, 0.05),
                    borderRadius: '12px',
                    border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
                  }}>
                    <SkeletonIcon />
                    <Box sx={{ flex: 1 }}>
                      <SkeletonBox height="12px" width="55%" />
                      <SkeletonBox height="14px" width="85%" />
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Box>
          </LoadingCard>
        </Fade>
      </Grid>
    ));
  };

  return (
    <StyledContainer elevation={3}>
      <HeaderSection>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Box>
            <HeaderTitle>GovRat AI Recommendations</HeaderTitle>
            <HeaderSubtitle>
              {isLoading
                ? "We are filtering our database for your best opportunities"
                : `RECENT RECOMMENDATIONS - You have ${opportunities.length} opportunity recommendations`
              }
            </HeaderSubtitle>
          </Box>
          {onToggleList && (
            <Button
              variant="contained"
              onClick={onToggleList}
              endIcon={showList ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{
                borderRadius: '20px',
                padding: '10px 20px',
                background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${alpha(theme.palette.primary.main, 0.8)} 90%)`,
                color: theme.palette.common.white,
                boxShadow: `0 3px 5px 2px ${alpha(theme.palette.primary.main, 0.3)}`,
                textTransform: 'none',
                fontWeight: 'bold',
                fontSize: '14px',
                border: 'none !important',
                '&:hover': {
                  background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.8)} 30%, ${theme.palette.primary.main} 90%)`,
                  boxShadow: `0 3px 5px 2px ${alpha(theme.palette.primary.main, 0.3)}`,
                  transform: 'none',
                },
                '&:focus': {
                  boxShadow: `0 3px 5px 2px ${alpha(theme.palette.primary.main, 0.3)}`,
                },
                transition: 'background 0.3s ease',
              }}
            >
              {showList ? 'Hide List' : 'Show List'}
            </Button>
          )}
        </Box>
      </HeaderSection>

      {showList && (
        <Grid container spacing={0}>
          {isLoading ? (
            generateSkeletonCards(3)
          ) : (
            displayedOpportunities.map((opportunity, index) => {
          const isSelected = currentIndex === index;
          const daysUntilDeadline = opportunity.responseDeadline ? getDaysUntilDeadline(opportunity.responseDeadline) : null;
          const deadlineIcon = daysUntilDeadline ? getDeadlineIcon(daysUntilDeadline) : null;

          return (
            <Grid item xs={12} key={`${opportunity.id}-${index}`}>
              <Fade in timeout={300} style={{ transitionDelay: `${index * 50}ms` }}>
                <StyledCard
                  selected={isSelected}
                  onClick={() => onSelectOpportunity && onSelectOpportunity(opportunity, index)}
                >
                  <Box sx={{ display: 'flex' }}>
                    <Box
                      className="hover-indicator"
                      sx={{
                        width: isSelected ? '4px' : '0px',
                        transition: 'all 0.2s ease-in-out',
                        backgroundColor: isSelected ? theme.palette.primary.main : 'transparent'
                      }}
                    />
                    <CardContent sx={{
                      flexGrow: 1,
                      p: 1.5,
                      '&:last-child': {
                        paddingBottom: 1.5,
                      },
                    }}>
                      {/* Header Section */}
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Box sx={{ flex: 1, mr: 2 }}>
                          <Typography
                            variant="h6"
                            gutterBottom
                            className="contract-title"
                            sx={{
                              fontWeight: isSelected ? 700 : 600,
                              lineHeight: 1.3,
                              color: isSelected ? theme.palette.primary.main : theme.palette.text.primary,
                            }}
                          >
                            {opportunity.title}
                          </Typography>

                          {isSelected && (
                            <Chip
                              label="Current Selection"
                              size="small"
                              sx={{
                                mt: 1,
                                borderRadius: '20px',
                                backgroundColor: theme.palette.primary.main,
                                color: 'white',
                                fontWeight: 600,
                                animation: 'pulse 2s infinite',
                                '@keyframes pulse': {
                                  '0%': { opacity: 1 },
                                  '50%': { opacity: 0.7 },
                                  '100%': { opacity: 1 },
                                },
                              }}
                            />
                          )}
                        </Box>

                        <Box sx={{
                          display: 'flex',
                          gap: 1,
                          flexWrap: 'wrap',
                          justifyContent: 'flex-end',
                          '& .MuiChip-root': {
                            borderRadius: '20px',
                          },
                        }}>
                          <Chip
                            label={SOURCE_CONFIG[opportunity.source]?.label || 'Unknown Source'}
                            size="small"
                            color="info"
                          />
                          <StatusChip
                            label={opportunity.active ? 'Active' : 'Inactive'}
                            active={opportunity.active}
                            icon={opportunity.active ? <CheckCircleIcon /> : <CancelIcon />}
                            size="small"
                          />
                          {opportunity.type && opportunity.type !== 'N/A' && (
                            <Chip
                              icon={<FontAwesomeIcon icon={faTag} style={{ color: 'white' }} />}
                              label={opportunity.type}
                              size="small"
                              sx={{
                                borderRadius: '20px',
                                backgroundColor: theme.palette.secondary.main,
                                color: 'white',
                                fontWeight: 600,
                              }}
                            />
                          )}
                          {opportunity.setAside && opportunity.setAside !== 'N/A' && opportunity.setAside !== 'None' && (
                            <Chip
                              icon={<FontAwesomeIcon icon={faTag} style={{ color: 'white' }} />}
                              label={opportunity.setAside.length > 10 ? `${opportunity.setAside.substring(0, 10)}...` : opportunity.setAside}
                              size="small"
                              sx={{
                                borderRadius: '20px',
                                backgroundColor: theme.palette.warning.main,
                                color: 'white',
                                fontWeight: 600,
                              }}
                            />
                          )}
                          {opportunity.naicsCode && (
                            <Chip
                              icon={<FontAwesomeIcon icon={faIndustry} style={{ color: 'white' }} />}
                              label={`NAICS: ${opportunity.naicsCode}`}
                              size="small"
                              sx={{
                                borderRadius: '20px',
                                backgroundColor: theme.palette.info.main,
                                color: 'white',
                                fontWeight: 600,
                              }}
                            />
                          )}
                          {deadlineIcon && (
                            <Tooltip title={`${daysUntilDeadline} ${daysUntilDeadline === 1 ? 'day' : 'days'} left until the response deadline`} arrow>
                              <Chip
                                icon={<FontAwesomeIcon icon={deadlineIcon.icon} />}
                                label={`${daysUntilDeadline} ${daysUntilDeadline === 1 ? 'day' : 'days'} left`}
                                color={deadlineIcon.color.split('.')[0]}
                                size="small"
                                sx={{
                                  borderRadius: '20px',
                                  boxShadow: `0 3px 5px 2px ${alpha(theme.palette[deadlineIcon.color.split('.')[0]].main, 0.3)}`,
                                }}
                              />
                            </Tooltip>
                          )}
                        </Box>
                      </Box>

                      {/* 2-Sentence Overview - Full Width Display */}
                      {(opportunity.ai_two_sentence_overview || opportunity.ai_general_description) && (
                        <Box sx={{ mb: 2, width: '100%' }}>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 500,
                              lineHeight: 1.6,
                              color: theme.palette.text.primary,
                              fontSize: '0.95rem',
                              width: '100%',
                              maxWidth: '100%',
                            }}
                          >
                            {opportunity.ai_two_sentence_overview || opportunity.ai_general_description}
                          </Typography>
                        </Box>
                      )}

                      {/* Key Information Cards */}
                      <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
                        gap: 1.5,
                        mt: 2,
                        width: '100%',
                        maxWidth: '100%',
                        overflow: 'hidden'
                      }}>
                        {/* Agency Card */}
                        {opportunity.organizationName && (
                          <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            p: 1.5,
                            backgroundColor: alpha(theme.palette.primary.main, 0.05),
                            borderRadius: '12px',
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                            transition: 'all 0.3s ease',
                            minWidth: 0,
                            width: '100%',
                            maxWidth: '100%',
                            overflow: 'hidden',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.08),
                              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                            }
                          }}>
                            <Box sx={{
                              width: 36,
                              height: 36,
                              borderRadius: '10px',
                              backgroundColor: theme.palette.primary.main,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                            }}>
                              <FontAwesomeIcon icon={faBuilding} />
                          </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Agency
                            </Typography>
                              <Typography variant="body2" sx={{
                                fontWeight: 500,
                                mt: 0.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '100%',
                                minWidth: 0
                              }}>
                                {opportunity.organizationName && opportunity.organizationName.length > 25
                                  ? `${opportunity.organizationName.substring(0, 25)}...`
                                  : opportunity.organizationName}
                              </Typography>
                            </Box>
                            </Box>
                          )}

                        {/* Financial Card */}
                        {(opportunity.awardAmount || (opportunity.ai_estimated_total_award && opportunity.ai_estimated_total_award.amount && opportunity.ai_estimated_total_award.amount !== 'N/A')) && (
                          <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            p: 1.5,
                            backgroundColor: alpha(theme.palette.success.main, 0.05),
                            borderRadius: '12px',
                            border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                            transition: 'all 0.3s ease',
                            minWidth: 0,
                            width: '100%',
                            maxWidth: '100%',
                            overflow: 'hidden',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.success.main, 0.08),
                              boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.15)}`,
                            }
                          }}>
                            <Box sx={{
                              width: 36,
                              height: 36,
                              borderRadius: '10px',
                              backgroundColor: theme.palette.success.main,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                            }}>
                              <FontAwesomeIcon icon={faDollarSign} />
                        </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {opportunity.ai_estimated_total_award ? 'AI Estimated Value' : 'Est. Value'}
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5, color: theme.palette.success.main }}>
                                {opportunity.ai_estimated_total_award?.amount || formatCurrency(opportunity.awardAmount)}
                              </Typography>
                            </Box>
                            </Box>
                          )}

                        {/* Location Card */}
                          {(opportunity.popCity || opportunity.popState) && (
                          <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            p: 1.5,
                            backgroundColor: alpha(theme.palette.info.main, 0.05),
                            borderRadius: '12px',
                            border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                            transition: 'all 0.3s ease',
                            minWidth: 0,
                            width: '100%',
                            maxWidth: '100%',
                            overflow: 'hidden',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.info.main, 0.08),
                              boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.15)}`,
                            }
                          }}>
                            <Box sx={{
                              width: 36,
                              height: 36,
                              borderRadius: '10px',
                              backgroundColor: theme.palette.info.main,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                            }}>
                              <FontAwesomeIcon icon={faMapMarkerAlt} />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Location
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {[opportunity.popCity, opportunity.popState].filter(Boolean).join(', ')}
                              </Typography>
                            </Box>
                            </Box>
                          )}

                        {/* Contact Email Card */}
                        {opportunity.contactEmail && (
                          <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            p: 1.5,
                            backgroundColor: alpha(theme.palette.purple?.main || theme.palette.secondary.main, 0.05),
                            borderRadius: '12px',
                            border: `1px solid ${alpha(theme.palette.purple?.main || theme.palette.secondary.main, 0.1)}`,
                            transition: 'all 0.3s ease',
                            minWidth: 0,
                            width: '100%',
                            maxWidth: '100%',
                            overflow: 'hidden',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.purple?.main || theme.palette.secondary.main, 0.08),
                              boxShadow: `0 4px 12px ${alpha(theme.palette.purple?.main || theme.palette.secondary.main, 0.15)}`,
                            }
                          }}>
                            <Box sx={{
                              width: 36,
                              height: 36,
                              borderRadius: '10px',
                              backgroundColor: theme.palette.purple?.main || theme.palette.secondary.main,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                            }}>
                              <FontAwesomeIcon icon={faUser} />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Contact
                              </Typography>
                              <Typography variant="body2" sx={{
                                fontWeight: 500,
                                mt: 0.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '100%',
                                minWidth: 0
                              }}>
                                {opportunity.contactEmail && opportunity.contactEmail.length > 25
                                  ? `${opportunity.contactEmail.substring(0, 25)}...`
                                  : opportunity.contactEmail}
                              </Typography>
                            </Box>
                            </Box>
                          )}

                        {/* Contact Phone Card - Show if contact phone exists and we have space */}
                        {(opportunity.contactPhone || opportunity.contactPhoneNumber) && (
                          <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            p: 1.5,
                            backgroundColor: alpha(theme.palette.orange?.main || theme.palette.warning.main, 0.05),
                            borderRadius: '12px',
                            border: `1px solid ${alpha(theme.palette.orange?.main || theme.palette.warning.main, 0.1)}`,
                            transition: 'all 0.3s ease',
                            minWidth: 0,
                            width: '100%',
                            maxWidth: '100%',
                            overflow: 'hidden',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.orange?.main || theme.palette.warning.main, 0.08),
                              boxShadow: `0 4px 12px ${alpha(theme.palette.orange?.main || theme.palette.warning.main, 0.15)}`,
                            }
                          }}>
                            <Box sx={{
                              width: 36,
                              height: 36,
                              borderRadius: '10px',
                              backgroundColor: theme.palette.orange?.main || theme.palette.warning.main,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                            }}>
                              <FontAwesomeIcon icon={faUser} />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Phone
                              </Typography>
                              <Typography variant="body2" sx={{
                                fontWeight: 500,
                                mt: 0.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '100%',
                                minWidth: 0
                              }}>
                                {(opportunity.contactPhone || opportunity.contactPhoneNumber) && (opportunity.contactPhone || opportunity.contactPhoneNumber).length > 25
                                  ? `${(opportunity.contactPhone || opportunity.contactPhoneNumber).substring(0, 25)}...`
                                  : (opportunity.contactPhone || opportunity.contactPhoneNumber)}
                              </Typography>
                            </Box>
                            </Box>
                          )}
                      </Box>

                    </CardContent>
                  </Box>
                </StyledCard>
              </Fade>
            </Grid>
          );
            })
          )}
        </Grid>
      )}

      {showList && showFooter && displayCount < opportunities.length && (
        <Box sx={{
          p: 2,
          textAlign: 'center',
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          backgroundColor: alpha(theme.palette.background.default, 0.5),
        }}>
          <FooterButton variant="outlined" onClick={handleLoadMore}>
            See more recommendations ({opportunities.length - displayCount} remaining)
          </FooterButton>
        </Box>
      )}
    </StyledContainer>
  );
};

export default RecommendationsListWrapper;
