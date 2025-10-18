import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  Button,
  CircularProgress,
  useTheme,
  alpha,
  Grid,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFolder,
  faCalendarAlt,
  faExclamationTriangle,
  faCheckCircle,
  faArrowRight
} from '@fortawesome/free-solid-svg-icons';
import FolderIcon from '@mui/icons-material/Folder';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ScienceIcon from '@mui/icons-material/Science';

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: '12px',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
  },
}));

const StatCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  borderRadius: '12px',
  padding: '16px',
  textAlign: 'center',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.15)} 100%)`,
    transform: 'translateY(-2px)',
  },
}));

const SavedGrantsSummary = ({ onNavigateToSavedGrants }) => {
  const [savedGrants, setSavedGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();

  const statusColors = {
    'saved': theme.palette.info.main,
    'applying': theme.palette.warning.main,
    'submitted': theme.palette.primary.main,
    'awarded': theme.palette.success.main,
    'rejected': theme.palette.error.main
  };

  const statusIcons = {
    'saved': <FolderIcon sx={{ color: 'white', fontSize: 16 }} />,
    'applying': <ScienceIcon sx={{ color: 'white', fontSize: 16 }} />,
    'submitted': <TrendingUpIcon sx={{ color: 'white', fontSize: 16 }} />,
    'awarded': <AssessmentIcon sx={{ color: 'white', fontSize: 16 }} />,
    'rejected': <AssessmentIcon sx={{ color: 'white', fontSize: 16 }} />
  };

  const fetchSavedGrants = async () => {
    try {
      const response = await fetch('/api/saved-grants/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSavedGrants(data.saved_grants || []);
      } else {
        throw new Error('Failed to fetch saved grants');
      }
    } catch (err) {
      console.error('Error fetching saved grants:', err);
      setError('Failed to load saved grants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedGrants();
  }, []);

  const getDaysUntilDeadline = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getDeadlineColor = (daysLeft) => {
    if (daysLeft <= 7) return 'error';
    if (daysLeft <= 14) return 'warning';
    return 'success';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const totalGrants = savedGrants.length;
  const statusCounts = savedGrants.reduce((acc, grant) => {
    acc[grant.status] = (acc[grant.status] || 0) + 1;
    return acc;
  }, {});

  const upcomingDeadlines = savedGrants.filter(grant => {
    const daysLeft = getDaysUntilDeadline(grant.grant.close_date);
    return daysLeft > 0 && daysLeft <= 30;
  }).length;

  const recentGrants = savedGrants.slice(0, 3);

  return (
    <Box sx={{ mb: 3 }}>
      <StyledCard>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold" color="primary">
              Your Saved Grants
            </Typography>
            <Button
              size="small"
              endIcon={<FontAwesomeIcon icon={faArrowRight} />}
              onClick={onNavigateToSavedGrants}
            >
              View All
            </Button>
          </Box>

          {totalGrants > 0 ? (
            <>
              {/* Statistics */}
              <Grid container spacing={2} mb={2}>
                <Grid item xs={4}>
                  <StatCard>
                    <Typography variant="h5" color="primary" fontWeight="bold">
                      {totalGrants}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total Saved
                    </Typography>
                  </StatCard>
                </Grid>
                <Grid item xs={4}>
                  <StatCard>
                    <Typography variant="h5" color="warning.main" fontWeight="bold">
                      {upcomingDeadlines}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Upcoming
                    </Typography>
                  </StatCard>
                </Grid>
                <Grid item xs={4}>
                  <StatCard>
                    <Typography variant="h5" color="success.main" fontWeight="bold">
                      {statusCounts.submitted || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Submitted
                    </Typography>
                  </StatCard>
                </Grid>
              </Grid>

              {/* Recent Grants */}
              <Typography variant="subtitle2" color="text.secondary" mb={1}>
                Recent Activity
              </Typography>
              <List>
                {recentGrants.map((grant, index) => {
                  const daysLeft = getDaysUntilDeadline(grant.grant.close_date);
                  const deadlineColor = getDeadlineColor(daysLeft);
                  
                  return (
                    <React.Fragment key={grant.id}>
                      <ListItem sx={{ px: 0, py: 1 }}>
                        <ListItemIcon>
                          <Avatar sx={{ 
                            bgcolor: statusColors[grant.status], 
                            width: 28, 
                            height: 28 
                          }}>
                            {statusIcons[grant.status]}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontWeight="medium" sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}>
                              {grant.grant.title}
                            </Typography>
                          }
                          secondary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Chip
                                label={grant.status_display}
                                size="small"
                                sx={{
                                  bgcolor: statusColors[grant.status],
                                  color: 'white',
                                  fontSize: '0.7rem',
                                  height: 18
                                }}
                              />
                              {daysLeft > 0 && daysLeft <= 30 && (
                                <Chip
                                  label={`${daysLeft}d left`}
                                  size="small"
                                  color={deadlineColor}
                                  sx={{ fontSize: '0.7rem', height: 18 }}
                                />
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < recentGrants.length - 1 && <Divider />}
                    </React.Fragment>
                  );
                })}
              </List>
            </>
          ) : (
            <Box textAlign="center" py={3}>
              <FolderIcon sx={{ fontSize: 48, color: theme.palette.text.secondary, mb: 2 }} />
              <Typography variant="body2" color="text.secondary" mb={2}>
                No saved grants yet. Start by saving grants from your recommendations!
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={onNavigateToSavedGrants}
              >
                View All Grants
              </Button>
            </Box>
          )}
        </CardContent>
      </StyledCard>
    </Box>
  );
};

export default SavedGrantsSummary;
