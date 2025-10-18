'use client'
import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
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
  faExclamationCircle,
  faExclamationTriangle,
  faCalendarAlt,
  faBuilding,
  faTag,
  faUser,
  faDollarSign,
  faIndustry,
  faFileAlt,
  faLink,
  faPhone,
  faInfoCircle,
  faUsers,
  faShieldAlt,
  faClock,
} from '@fortawesome/free-solid-svg-icons';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

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

  const getCatholicComplianceIcon = (compliance) => {
    switch (compliance) {
      case 'compliant':
        return { icon: faCheckCircle, color: 'success.main', label: 'Compliant' };
      case 'flagged':
        return { icon: faExclamationTriangle, color: 'warning.main', label: 'Flagged' };
      case 'non_compliant':
        return { icon: faExclamationCircle, color: 'error.main', label: 'Non-Compliant' };
      default:
        return { icon: faInfoCircle, color: 'info.main', label: 'Not Reviewed' };
    }
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
            <HeaderTitle>Cardinal Concordia AI Recommendations</HeaderTitle>
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
          const daysUntilDeadline = opportunity.close_date ? getDaysUntilDeadline(opportunity.close_date) : null;
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
                            label={SOURCE_CONFIG[opportunity.agency_code]?.label || opportunity.agency_code || 'Government'}
                            size="small"
                            color="info"
                          />
                          <StatusChip
                            label={opportunity.is_closed ? 'Closed' : 'Active'}
                            active={!opportunity.is_closed}
                            icon={opportunity.is_closed ? <CancelIcon /> : <CheckCircleIcon />}
                            size="small"
                          />
                          {opportunity.funding_instrument_type && opportunity.funding_instrument_type !== 'N/A' && (
                            <Chip
                              icon={<FontAwesomeIcon icon={faTag} style={{ color: 'white' }} />}
                              label={opportunity.funding_instrument_type}
                              size="small"
                              sx={{
                                borderRadius: '20px',
                                backgroundColor: theme.palette.secondary.main,
                                color: 'white',
                                fontWeight: 600,
                              }}
                            />
                          )}
                          {opportunity.category_of_funding_activity && opportunity.category_of_funding_activity !== 'N/A' && (
                            <Chip
                              icon={<FontAwesomeIcon icon={faTag} style={{ color: 'white' }} />}
                              label={opportunity.category_of_funding_activity}
                              size="small"
                              sx={{
                                borderRadius: '20px',
                                backgroundColor: theme.palette.warning.main,
                                color: 'white',
                                fontWeight: 600,
                              }}
                            />
                          )}
                          {opportunity.cfda_numbers && (
                            <Chip
                              icon={<FontAwesomeIcon icon={faIndustry} style={{ color: 'white' }} />}
                              label={`CFDA: ${opportunity.cfda_numbers}`}
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
                            <Tooltip title={`${daysUntilDeadline} ${daysUntilDeadline === 1 ? 'day' : 'days'} left until the application deadline`} arrow>
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
                          {opportunity.catholic_social_teaching_compliance && (
                            <Tooltip title={`Catholic Social Teaching Compliance: ${getCatholicComplianceIcon(opportunity.catholic_social_teaching_compliance).label}`} arrow>
                              <Chip
                                icon={<FontAwesomeIcon icon={getCatholicComplianceIcon(opportunity.catholic_social_teaching_compliance).icon} />}
                                label={getCatholicComplianceIcon(opportunity.catholic_social_teaching_compliance).label}
                                color={getCatholicComplianceIcon(opportunity.catholic_social_teaching_compliance).color.split('.')[0]}
                                size="small"
                                sx={{
                                  borderRadius: '20px',
                                  backgroundColor: theme.palette[getCatholicComplianceIcon(opportunity.catholic_social_teaching_compliance).color.split('.')[0]].main,
                                  color: 'white',
                                  fontWeight: 600,
                                }}
                              />
                            </Tooltip>
                          )}
                        </Box>
                      </Box>

                      {/* Full Description Display */}
                      {opportunity.description && (
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
                            {opportunity.description}
                          </Typography>
                        </Box>
                      )}

                      {/* Key Information Cards */}
                      <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr', lg: '1fr 1fr 1fr 1fr 1fr' },
                        gap: 1.5,
                        mt: 2,
                        width: '100%',
                        maxWidth: '100%',
                        overflow: 'hidden'
                      }}>
                        {/* Agency Card */}
                        {opportunity.agency_name && (
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
                                {opportunity.agency_name}
                              </Typography>
                            </Box>
                            </Box>
                          )}

                        {/* Financial Card */}
                        {(opportunity.award_floor || opportunity.award_ceiling || opportunity.estimated_total_program_funding) && (
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
                                Funding Range
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5, color: theme.palette.success.main }}>
                                {opportunity.award_floor && opportunity.award_ceiling 
                                  ? `${formatCurrency(opportunity.award_floor)} - ${formatCurrency(opportunity.award_ceiling)}`
                                  : opportunity.estimated_total_program_funding 
                                    ? formatCurrency(opportunity.estimated_total_program_funding)
                                    : opportunity.award_floor 
                                      ? `From ${formatCurrency(opportunity.award_floor)}`
                                      : opportunity.award_ceiling 
                                        ? `Up to ${formatCurrency(opportunity.award_ceiling)}`
                                        : 'N/A'}
                              </Typography>
                            </Box>
                            </Box>
                          )}

                        {/* Deadline Card */}
                          {opportunity.close_date && (
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
                              <FontAwesomeIcon icon={faCalendarAlt} />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Deadline
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {formatDate(opportunity.close_date)}
                              </Typography>
                            </Box>
                            </Box>
                          )}

                        {/* Contact Email Card */}
                        {opportunity.grantor_contact_email && (
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
                                {opportunity.grantor_contact_email}
                              </Typography>
                            </Box>
                            </Box>
                          )}

                        {/* Contact Phone Card - Show if contact phone exists and we have space */}
                        {opportunity.grantor_contact_phone_number && (
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
                              <FontAwesomeIcon icon={faPhone} />
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
                                {opportunity.grantor_contact_phone_number}
                              </Typography>
                            </Box>
                            </Box>
                          )}

                        {/* Expected Number of Awards Card */}
                        {opportunity.expected_number_of_awards && (
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
                              <FontAwesomeIcon icon={faUsers} />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Expected Awards
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
                                {opportunity.expected_number_of_awards}
                              </Typography>
                            </Box>
                            </Box>
                          )}

                        {/* Additional Information URL Card */}
                        {opportunity.additional_information_url && (
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
                              <FontAwesomeIcon icon={faLink} />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                More Info
                              </Typography>
                              <Typography variant="body2" sx={{
                                fontWeight: 500,
                                mt: 0.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '100%',
                                minWidth: 0,
                                color: theme.palette.info.main,
                                cursor: 'pointer',
                                '&:hover': {
                                  textDecoration: 'underline'
                                }
                              }}
                              onClick={() => window.open(opportunity.additional_information_url, '_blank')}
                              >
                                View Details
                              </Typography>
                            </Box>
                            </Box>
                          )}

                        {/* Post Date Card */}
                        {opportunity.post_date && (
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
                              <FontAwesomeIcon icon={faClock} />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Posted
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
                                {formatDate(opportunity.post_date)}
                              </Typography>
                            </Box>
                            </Box>
                          )}
                      </Box>

                      {/* Additional Details Section */}
                      {(opportunity.eligible_applicants || opportunity.additional_information_on_eligibility || 
                        opportunity.cost_sharing_or_matching_requirement || opportunity.additional_information_text ||
                        opportunity.grantor_contact_text || opportunity.catholic_social_teaching_notes) && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 600, 
                            mb: 1.5, 
                            color: theme.palette.text.primary,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}>
                            <FontAwesomeIcon icon={faFileAlt} />
                            Additional Details
                          </Typography>
                          
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {opportunity.eligible_applicants && (
                              <Box sx={{ p: 2, backgroundColor: alpha(theme.palette.primary.main, 0.05), borderRadius: '8px', border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: theme.palette.primary.main }}>
                                  Eligible Applicants
                                </Typography>
                                <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                                  {opportunity.eligible_applicants}
                                </Typography>
                              </Box>
                            )}
                            
                            {opportunity.additional_information_on_eligibility && (
                              <Box sx={{ p: 2, backgroundColor: alpha(theme.palette.info.main, 0.05), borderRadius: '8px', border: `1px solid ${alpha(theme.palette.info.main, 0.1)}` }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: theme.palette.info.main }}>
                                  Additional Eligibility Information
                                </Typography>
                                <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                                  {opportunity.additional_information_on_eligibility}
                                </Typography>
                              </Box>
                            )}
                            
                            {opportunity.cost_sharing_or_matching_requirement && (
                              <Box sx={{ p: 2, backgroundColor: alpha(theme.palette.warning.main, 0.05), borderRadius: '8px', border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}` }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: theme.palette.warning.main }}>
                                  Cost Sharing/Matching Requirements
                                </Typography>
                                <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                                  {opportunity.cost_sharing_or_matching_requirement}
                                </Typography>
                              </Box>
                            )}
                            
                            {opportunity.additional_information_text && (
                              <Box sx={{ p: 2, backgroundColor: alpha(theme.palette.secondary.main, 0.05), borderRadius: '8px', border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}` }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: theme.palette.secondary.main }}>
                                  Additional Information
                                </Typography>
                                <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                                  {opportunity.additional_information_text}
                                </Typography>
                              </Box>
                            )}
                            
                            {opportunity.grantor_contact_text && (
                              <Box sx={{ p: 2, backgroundColor: alpha(theme.palette.success.main, 0.05), borderRadius: '8px', border: `1px solid ${alpha(theme.palette.success.main, 0.1)}` }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: theme.palette.success.main }}>
                                  Contact Information
                                </Typography>
                                <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                                  {opportunity.grantor_contact_text}
                                </Typography>
                              </Box>
                            )}
                            
                            {opportunity.catholic_social_teaching_notes && (
                              <Box sx={{ p: 2, backgroundColor: alpha(theme.palette.error.main, 0.05), borderRadius: '8px', border: `1px solid ${alpha(theme.palette.error.main, 0.1)}` }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: theme.palette.error.main, display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <FontAwesomeIcon icon={faShieldAlt} />
                                  Catholic Social Teaching Review Notes
                                </Typography>
                                <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                                  {opportunity.catholic_social_teaching_notes}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      )}

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
