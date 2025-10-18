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
  faGraduationCap,
  faUniversity,
  faEnvelope,
  faGlobe,
  faBook,
  faFlask,
} from '@fortawesome/free-solid-svg-icons';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

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

const SearchResultsWrapper = ({
  results = [],
  resultType = 'grants', // 'grants' or 'profiles'
  onSelectResult,
  currentIndex = 0,
  showFooter = true,
  onLoadMore,
  hasMore = false,
  showList,
  onToggleList,
  isLoading = false,
  query = ''
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
      setDisplayCount(prev => Math.min(prev + 10, results.length));
    } else {
      setDisplayCount(prev => Math.min(prev + 10, results.length));
    }
  };

  const displayedResults = results.slice(0, displayCount);

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

                <Box sx={{ mb: 2 }}>
                  <SkeletonBox height="16px" width="100%" />
                  <SkeletonBox height="16px" width="85%" />
                </Box>

                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
                  gap: 1.5,
                  mt: 2,
                }}>
                  {Array.from({ length: 4 }, (_, i) => (
                    <Box key={i} sx={{
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
                  ))}
                </Box>
              </CardContent>
            </Box>
          </LoadingCard>
        </Fade>
      </Grid>
    ));
  };

  // Render grant-specific content
  const renderGrantContent = (grant) => {
    const daysUntilDeadline = grant.close_date ? getDaysUntilDeadline(grant.close_date) : null;
    const deadlineIcon = daysUntilDeadline ? getDeadlineIcon(daysUntilDeadline) : null;

    return (
      <>
        {/* Header Section */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box sx={{ flex: 1, mr: 2 }}>
            <Typography
              variant="h6"
              gutterBottom
              className="grant-title"
              sx={{
                fontWeight: 600,
                lineHeight: 1.3,
                color: theme.palette.text.primary,
              }}
            >
              {grant.title}
            </Typography>
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
              label={grant.agency_code || 'Government'}
              size="small"
              color="info"
            />
            <StatusChip
              label={grant.is_closed ? 'Closed' : 'Active'}
              active={!grant.is_closed}
              icon={grant.is_closed ? <CancelIcon /> : <CheckCircleIcon />}
              size="small"
            />
            {grant.funding_instrument_type && grant.funding_instrument_type !== 'N/A' && (
              <Chip
                icon={<FontAwesomeIcon icon={faTag} style={{ color: 'white' }} />}
                label={grant.funding_instrument_type}
                size="small"
                sx={{
                  borderRadius: '20px',
                  backgroundColor: theme.palette.secondary.main,
                  color: 'white',
                  fontWeight: 600,
                }}
              />
            )}
            {grant.category_of_funding_activity && grant.category_of_funding_activity !== 'N/A' && (
              <Chip
                icon={<FontAwesomeIcon icon={faTag} style={{ color: 'white' }} />}
                label={grant.category_of_funding_activity}
                size="small"
                sx={{
                  borderRadius: '20px',
                  backgroundColor: theme.palette.warning.main,
                  color: 'white',
                  fontWeight: 600,
                }}
              />
            )}
            {grant.cfda_numbers && (
              <Chip
                icon={<FontAwesomeIcon icon={faIndustry} style={{ color: 'white' }} />}
                label={`CFDA: ${grant.cfda_numbers}`}
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
            {grant.catholic_social_teaching_compliance && (
              <Tooltip title={`Catholic Social Teaching Compliance: ${getCatholicComplianceIcon(grant.catholic_social_teaching_compliance).label}`} arrow>
                <Chip
                  icon={<FontAwesomeIcon icon={getCatholicComplianceIcon(grant.catholic_social_teaching_compliance).icon} />}
                  label={getCatholicComplianceIcon(grant.catholic_social_teaching_compliance).label}
                  color={getCatholicComplianceIcon(grant.catholic_social_teaching_compliance).color.split('.')[0]}
                  size="small"
                  sx={{
                    borderRadius: '20px',
                    backgroundColor: theme.palette[getCatholicComplianceIcon(grant.catholic_social_teaching_compliance).color.split('.')[0]].main,
                    color: 'white',
                    fontWeight: 600,
                  }}
                />
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Description */}
        {grant.description && (
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
              {grant.description}
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
          {grant.agency_name && (
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
                  {grant.agency_name}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Financial Card */}
          {(grant.award_floor || grant.award_ceiling || grant.estimated_total_program_funding) && (
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
                  {grant.award_floor && grant.award_ceiling 
                    ? `${formatCurrency(grant.award_floor)} - ${formatCurrency(grant.award_ceiling)}`
                    : grant.estimated_total_program_funding 
                      ? formatCurrency(grant.estimated_total_program_funding)
                      : grant.award_floor 
                        ? `From ${formatCurrency(grant.award_floor)}`
                        : grant.award_ceiling 
                          ? `Up to ${formatCurrency(grant.award_ceiling)}`
                          : 'N/A'}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Deadline Card */}
          {grant.close_date && (
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
                  {formatDate(grant.close_date)}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Contact Email Card */}
          {grant.grantor_contact_email && (
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
                  {grant.grantor_contact_email}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Additional Information URL Card */}
          {grant.additional_information_url && (
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
                onClick={() => window.open(grant.additional_information_url, '_blank')}
                >
                  View Details
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </>
    );
  };

  // Render profile-specific content
  const renderProfileContent = (profile) => {
    return (
      <>
        {/* Header Section */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box sx={{ flex: 1, mr: 2 }}>
            <Typography
              variant="h6"
              gutterBottom
              className="profile-name"
              sx={{
                fontWeight: 600,
                lineHeight: 1.3,
                color: theme.palette.text.primary,
              }}
            >
              {profile.name}
            </Typography>
            {profile.position && (
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 500,
                  color: theme.palette.text.secondary,
                  fontSize: '0.9rem',
                }}
              >
                {profile.position}
              </Typography>
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
            {profile.department && (
              <Chip
                label={profile.department}
                size="small"
                color="primary"
              />
            )}
            {profile.school && (
              <Chip
                label={profile.school}
                size="small"
                color="secondary"
              />
            )}
            {profile.expertise && Array.isArray(profile.expertise) && profile.expertise.length > 0 && (
              <Chip
                icon={<FontAwesomeIcon icon={faFlask} style={{ color: 'white' }} />}
                label={`${profile.expertise.length} expertise areas`}
                size="small"
                sx={{
                  borderRadius: '20px',
                  backgroundColor: theme.palette.info.main,
                  color: 'white',
                  fontWeight: 600,
                }}
              />
            )}
          </Box>
        </Box>

        {/* Bio */}
        {profile.bio && (
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
              {profile.bio}
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
          {/* Department Card */}
          {profile.department && (
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
                  Department
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
                  {profile.department}
                </Typography>
              </Box>
            </Box>
          )}

          {/* School Card */}
          {profile.school && (
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
                <FontAwesomeIcon icon={faUniversity} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  School
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
                  {profile.school}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Email Card */}
          {profile.email && (
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
                <FontAwesomeIcon icon={faEnvelope} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Email
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
                  {profile.email}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Expertise Card */}
          {profile.expertise && Array.isArray(profile.expertise) && profile.expertise.length > 0 && (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1.5,
              backgroundColor: alpha(theme.palette.warning.main, 0.05),
              borderRadius: '12px',
              border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
              transition: 'all 0.3s ease',
              minWidth: 0,
              width: '100%',
              maxWidth: '100%',
              overflow: 'hidden',
              '&:hover': {
                backgroundColor: alpha(theme.palette.warning.main, 0.08),
                boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.15)}`,
              }
            }}>
              <Box sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                backgroundColor: theme.palette.warning.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}>
                <FontAwesomeIcon icon={faFlask} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Expertise
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
                  {profile.expertise.slice(0, 2).join(', ')}
                  {profile.expertise.length > 2 && ` +${profile.expertise.length - 2} more`}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        {/* Expertise Details */}
        {profile.expertise && Array.isArray(profile.expertise) && profile.expertise.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              mb: 1.5, 
              color: theme.palette.text.primary,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <FontAwesomeIcon icon={faFlask} />
              Research Expertise
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {profile.expertise.map((expertise, index) => (
                <Chip
                  key={index}
                  label={expertise}
                  size="small"
                  sx={{
                    borderRadius: '20px',
                    backgroundColor: alpha(theme.palette.warning.main, 0.1),
                    color: theme.palette.warning.main,
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                    fontWeight: 500,
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Education Details */}
        {profile.education && Array.isArray(profile.education) && profile.education.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              mb: 1.5, 
              color: theme.palette.text.primary,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <FontAwesomeIcon icon={faGraduationCap} />
              Education
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {profile.education.map((edu, index) => (
                <Box key={index} sx={{ 
                  p: 1.5, 
                  backgroundColor: alpha(theme.palette.info.main, 0.05), 
                  borderRadius: '8px', 
                  border: `1px solid ${alpha(theme.palette.info.main, 0.1)}` 
                }}>
                  <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                    {edu}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </>
    );
  };

  return (
    <StyledContainer elevation={3}>
      <HeaderSection>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Box>
            <HeaderTitle>
              {resultType === 'grants' ? 'Grant Opportunities' : 'Researcher Profiles'}
            </HeaderTitle>
            <HeaderSubtitle>
              {isLoading
                ? `Searching for ${resultType}...`
                : `Found ${results.length} ${resultType}${query ? ` for "${query}"` : ''}`
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
            displayedResults.map((result, index) => {
              const isSelected = currentIndex === index;

              return (
                <Grid item xs={12} key={`${result.id || result.email}-${index}`}>
                  <Fade in timeout={300} style={{ transitionDelay: `${index * 50}ms` }}>
                    <StyledCard
                      selected={isSelected}
                      onClick={() => onSelectResult && onSelectResult(result, index)}
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
                          {resultType === 'grants' ? renderGrantContent(result) : renderProfileContent(result)}
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

      {showList && showFooter && displayCount < results.length && (
        <Box sx={{
          p: 2,
          textAlign: 'center',
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          backgroundColor: alpha(theme.palette.background.default, 0.5),
        }}>
          <FooterButton variant="outlined" onClick={handleLoadMore}>
            See more results ({results.length - displayCount} remaining)
          </FooterButton>
        </Box>
      )}
    </StyledContainer>
  );
};

export default SearchResultsWrapper;
