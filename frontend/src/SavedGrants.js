import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  CircularProgress,
  Button,
  Card,
  CardContent,
  Tooltip,
  useTheme,
  IconButton,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Tabs,
  Tab,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Divider,
  Badge
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import AssessmentIcon from '@mui/icons-material/Assessment';
import FolderIcon from '@mui/icons-material/Folder';
import ScienceIcon from '@mui/icons-material/Science';
import DescriptionIcon from '@mui/icons-material/Description';
import SendIcon from '@mui/icons-material/Send';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import BlockIcon from '@mui/icons-material/Block';
import InfoIcon from '@mui/icons-material/Info';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import GroupIcon from '@mui/icons-material/Group';
import EmailIcon from '@mui/icons-material/Email';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { faCalendarAlt, faHourglassHalf } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { alpha } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    boxShadow: theme.shadows[8],
  },
}));

const GrantCard = styled(Card)(({ theme }) => ({
  width: '100%',
  margin: '0 auto',
  position: 'relative',
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[3],
  borderRadius: '16px',
  padding: '16px',
  transition: 'transform 0.3s ease-in-out',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  marginBottom: '16px',
}));

const StatusChip = styled(Chip)(({ theme, $color }) => ({
  background: `linear-gradient(45deg, ${$color} 30%, ${alpha($color, 0.8)} 90%)`,
  color: '#FFFFFF',
  fontWeight: 'medium',
  transition: 'all 0.2s ease-in-out',
  boxShadow: `0 2px 4px ${alpha($color, 0.3)}`,
  '&:hover': {
    transform: 'scale(1.05)',
    background: `linear-gradient(45deg, ${alpha($color, 0.8)} 30%, ${$color} 90%)`,
    boxShadow: `0 3px 6px ${alpha($color, 0.4)}`,
  },
  '& .MuiChip-label': {
    padding: '0 12px',
    color: '#FFFFFF',
  },
}));

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const SavedGrants = ({ onClose }) => {
  const [savedGrants, setSavedGrants] = useState([]);
  const [collaborationInvites, setCollaborationInvites] = useState([]);
  const [activeCollaborations, setActiveCollaborations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGrant, setSelectedGrant] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [inviteResponseDialogOpen, setInviteResponseDialogOpen] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [inviteForm, setInviteForm] = useState({
    invitee_email: '',
    invitee_name: '',
    message: '',
    role: 'collaborator'
  });
  const [editForm, setEditForm] = useState({
    notes: '',
    status: 'saved',
    is_public: false,
    allow_collaboration: true
  });
  const theme = useTheme();

  const statusColors = {
    'saved': theme.palette.info.main,
    'applying': theme.palette.warning.main,
    'submitted': theme.palette.primary.main,
    'awarded': theme.palette.success.main,
    'rejected': theme.palette.error.main
  };

  const statusIcons = {
    'saved': <FolderIcon sx={{ color: 'white' }} />,
    'applying': <ScienceIcon sx={{ color: 'white' }} />,
    'submitted': <SendIcon sx={{ color: 'white' }} />,
    'awarded': <EmojiEventsIcon sx={{ color: 'white' }} />,
    'rejected': <BlockIcon sx={{ color: 'white' }} />
  };

  const fetchSavedGrants = async () => {
    try {
      const sessionToken = localStorage.getItem('session_token');
      if (!sessionToken) return;
      
      const response = await fetch('http://localhost:8000/api/grant-pipeline/', {
        headers: {
          'Authorization': `Token ${sessionToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Transform pipeline entries to saved grants format
        const grants = data.pipeline_entries?.map(entry => ({
          id: entry.grant.id, // Grant ID for display
          pipeline_entry_id: entry.id, // Pipeline entry ID for API calls
          title: entry.grant.title,
          agency: entry.grant.agency_code,
          status: entry.decision_status || 'saved',
          notes: entry.notes || '',
          priority: entry.priority || 'medium',
          application_deadline: entry.application_deadline,
          application_submitted_date: entry.application_submitted_date,
          decision_date: entry.decision_date,
          is_public: false, // Default values for compatibility
          allow_collaboration: false
        })) || [];
        setSavedGrants(grants);
      } else {
        throw new Error('Failed to fetch saved grants');
      }
    } catch (err) {
      console.error('Error fetching saved grants:', err);
      setError('Failed to load saved grants');
    }
  };

  const fetchCollaborationInvites = async () => {
    // Collaboration features disabled for now
    setCollaborationInvites([]);
  };

  const fetchActiveCollaborations = async () => {
    // Collaboration features disabled for now
    setActiveCollaborations([]);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchSavedGrants(),
        fetchCollaborationInvites(), // Disabled but still called to set empty arrays
        fetchActiveCollaborations() // Disabled but still called to set empty arrays
      ]);
      setLoading(false);
    };
    
    fetchData();
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

  const handleOpenDetailsDialog = (grant) => {
    setSelectedGrant(grant);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetailsDialog = () => {
    setDetailsDialogOpen(false);
    setSelectedGrant(null);
  };

  const handleOpenInviteDialog = (grant) => {
    setSelectedGrant(grant);
    setInviteForm({
      invitee_email: '',
      invitee_name: '',
      message: '',
      role: 'collaborator'
    });
    setInviteDialogOpen(true);
  };

  const handleCloseInviteDialog = () => {
    setInviteDialogOpen(false);
    setSelectedGrant(null);
  };

  const handleOpenEditDialog = (grant) => {
    setSelectedGrant(grant);
    setEditForm({
      notes: grant.notes || '',
      status: grant.status,
      is_public: grant.is_public,
      allow_collaboration: grant.allow_collaboration
    });
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedGrant(null);
  };

  const handleOpenInviteResponseDialog = (invite) => {
    setSelectedInvite(invite);
    setInviteResponseDialogOpen(true);
  };

  const handleCloseInviteResponseDialog = () => {
    setInviteResponseDialogOpen(false);
    setSelectedInvite(null);
  };

  const handleSendInvite = async () => {
    try {
      const response = await fetch('/api/collaboration-invites/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          saved_grant_id: selectedGrant.id,
          ...inviteForm
        })
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Collaboration invite sent successfully',
          severity: 'success'
        });
        handleCloseInviteDialog();
        fetchCollaborationInvites();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send invite');
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message,
        severity: 'error'
      });
    }
  };

  const handleUpdateGrant = async () => {
    try {
      const sessionToken = localStorage.getItem('session_token');
      if (!sessionToken) return;
      
      // Find the pipeline entry for this grant
      const pipelineEntry = savedGrants.find(grant => grant.id === selectedGrant.id);
      if (!pipelineEntry || !pipelineEntry.pipeline_entry_id) return;
      
      const response = await fetch(`http://localhost:8000/api/grant-pipeline/entry/${pipelineEntry.pipeline_entry_id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Token ${sessionToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notes: editForm.notes,
          priority: editForm.priority || 'medium',
          decision_status: editForm.status
        })
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Grant updated successfully',
          severity: 'success'
        });
        handleCloseEditDialog();
        fetchSavedGrants();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update grant');
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message,
        severity: 'error'
      });
    }
  };

  const handleDeleteGrant = async (grantId) => {
    if (!window.confirm('Are you sure you want to delete this saved grant?')) {
      return;
    }

    try {
      const sessionToken = localStorage.getItem('session_token');
      if (!sessionToken) return;
      
      // Find the pipeline entry for this grant
      const pipelineEntry = savedGrants.find(grant => grant.id === grantId);
      if (!pipelineEntry || !pipelineEntry.pipeline_entry_id) return;
      
      const response = await fetch(`http://localhost:8000/api/grant-pipeline/entry/${pipelineEntry.pipeline_entry_id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${sessionToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Grant deleted successfully',
          severity: 'success'
        });
        fetchSavedGrants();
      } else {
        throw new Error('Failed to delete grant');
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message,
        severity: 'error'
      });
    }
  };

  const handleInviteResponse = async (response) => {
    try {
      const apiResponse = await fetch(`/api/collaboration-invites/${selectedInvite.id}/respond/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ response })
      });

      if (apiResponse.ok) {
        setSnackbar({
          open: true,
          message: `Invitation ${response}d successfully`,
          severity: 'success'
        });
        handleCloseInviteResponseDialog();
        fetchCollaborationInvites();
        fetchActiveCollaborations();
      } else {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || 'Failed to respond to invitation');
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message,
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Calculate statistics
  const totalGrants = savedGrants.length;
  const statusCounts = savedGrants.reduce((acc, grant) => {
    acc[grant.status] = (acc[grant.status] || 0) + 1;
    return acc;
  }, {});

  const pieChartData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    color: statusColors[status]
  }));

  const pendingInvites = collaborationInvites.filter(invite => invite.status === 'pending').length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const renderGrantCard = (grant) => {
    const daysLeft = getDaysUntilDeadline(grant.grant.close_date);
    const deadlineColor = getDeadlineColor(daysLeft);

    return (
      <GrantCard key={grant.id}>
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Tooltip title={grant.grant.title} placement="top">
              <Typography
                variant="h6"
                component="div"
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontWeight: 'bold',
                  color: theme.palette.primary.main,
                  cursor: 'pointer',
                  flex: 1,
                  mr: 2,
                }}
                onClick={() => handleOpenDetailsDialog(grant)}
              >
                {grant.grant.title}
              </Typography>
            </Tooltip>
            <StatusChip
              label={grant.status_display}
              $color={statusColors[grant.status]}
              size="small"
              icon={statusIcons[grant.status]}
            />
          </Box>

          <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
            <Chip
              label={grant.grant.agency_name}
              size="small"
              variant="outlined"
              sx={{
                backgroundColor: 'transparent',
                borderColor: theme.palette.text.secondary,
                color: theme.palette.text.secondary,
              }}
            />
            {grant.grant.award_ceiling && (
              <Chip
                label={`Up to $${parseInt(grant.grant.award_ceiling).toLocaleString()}`}
                size="small"
                variant="outlined"
                sx={{
                  backgroundColor: 'transparent',
                  borderColor: theme.palette.success.main,
                  color: theme.palette.success.main,
                }}
              />
            )}
          </Box>

          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="caption" sx={{
              display: 'flex',
              alignItems: 'center',
              color: theme.palette.text.secondary,
            }}>
              <FontAwesomeIcon icon={faHourglassHalf} style={{ marginRight: 6 }} />
              {new Date(grant.grant.close_date).toLocaleDateString()}
            </Typography>
            <Chip
              label={`${daysLeft}d left`}
              color={deadlineColor}
              size="small"
              sx={{ fontWeight: 'bold' }}
            />
          </Box>

          {grant.notes && (
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                mb: 2,
              }}
            >
              {grant.notes}
            </Typography>
          )}
        </Box>

        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1,
        }}>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="View Details">
              <IconButton
                size="small"
                onClick={() => handleOpenDetailsDialog(grant)}
                sx={{
                  color: theme.palette.info.main,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.info.main, 0.1),
                  }
                }}
              >
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit Grant">
              <IconButton
                size="small"
                onClick={() => handleOpenEditDialog(grant)}
                sx={{
                  color: theme.palette.warning.main,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.warning.main, 0.1),
                  }
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {grant.allow_collaboration && (
              <Tooltip title="Invite Collaborator">
                <IconButton
                  size="small"
                  onClick={() => handleOpenInviteDialog(grant)}
                  sx={{
                    color: theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    }
                  }}
                >
                  <PersonAddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          <Tooltip title="Delete Grant">
            <IconButton
              size="small"
              onClick={() => handleDeleteGrant(grant.id)}
              sx={{
                color: theme.palette.error.main,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.error.main, 0.1),
                }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </GrantCard>
    );
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 0: // Saved Grants
        return (
          <Grid container spacing={3}>
            {savedGrants.length > 0 ? (
              savedGrants.map(grant => (
                <Grid item xs={12} md={6} lg={4} key={grant.id}>
                  {renderGrantCard(grant)}
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Box p={4} textAlign="center">
                  <FolderIcon sx={{ fontSize: 64, color: theme.palette.text.secondary, mb: 2 }} />
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    No Saved Grants
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Start by saving grants from the search results to track your applications.
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        );
      
      case 1: // Collaboration Invites
        return (
          <Box>
            {collaborationInvites.length > 0 ? (
              <List>
                {collaborationInvites.map((invite, index) => (
                  <React.Fragment key={invite.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: statusColors[invite.status] }}>
                          <EmailIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={invite.grant_title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              From: {invite.inviter_email}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Role: {invite.role_display}
                            </Typography>
                            {invite.message && (
                              <Typography variant="body2" color="textSecondary">
                                Message: {invite.message}
                              </Typography>
                            )}
                            <Chip
                              label={invite.status_display}
                              size="small"
                              color={invite.status === 'pending' ? 'warning' : invite.status === 'accepted' ? 'success' : 'error'}
                              sx={{ mt: 1 }}
                            />
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        {invite.status === 'pending' && (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<CheckCircleIcon />}
                              onClick={() => handleOpenInviteResponseDialog(invite)}
                            >
                              Accept
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<CancelIcon />}
                              onClick={() => handleInviteResponse('decline')}
                            >
                              Decline
                            </Button>
                          </Box>
                        )}
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < collaborationInvites.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box p={4} textAlign="center">
                <EmailIcon sx={{ fontSize: 64, color: theme.palette.text.secondary, mb: 2 }} />
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  No Collaboration Invites
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  You haven't received any collaboration invitations yet.
                </Typography>
              </Box>
            )}
          </Box>
        );
      
      case 2: // Active Collaborations
        return (
          <Box>
            {activeCollaborations.length > 0 ? (
              <List>
                {activeCollaborations.map((collaboration, index) => (
                  <React.Fragment key={collaboration.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: theme.palette.success.main }}>
                          <GroupIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={collaboration.grant_title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              Role: {collaboration.role_display}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Joined: {new Date(collaboration.joined_at).toLocaleDateString()}
                            </Typography>
                            {collaboration.contribution_notes && (
                              <Typography variant="body2" color="textSecondary">
                                Notes: {collaboration.contribution_notes}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < activeCollaborations.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box p={4} textAlign="center">
                <GroupIcon sx={{ fontSize: 64, color: theme.palette.text.secondary, mb: 2 }} />
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  No Active Collaborations
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  You're not currently collaborating on any grants.
                </Typography>
              </Box>
            )}
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <StyledCard elevation={3}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: theme.palette.primary.main,
              }}>
                <FolderIcon color="primary" />
                Saved Grants
              </Typography>
              <Typography variant="h3" color="primary" gutterBottom sx={{
                fontWeight: 'bold',
                textAlign: 'center',
                my: 2,
              }}>
                {totalGrants}
              </Typography>
              <Typography variant="body1" sx={{
                textAlign: 'center',
                color: theme.palette.text.secondary,
                mb: 2,
              }}>
                Total Saved Grants
              </Typography>
            </CardContent>
          </StyledCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <StyledCard elevation={3}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Status Distribution
              </Typography>
              {totalGrants > 0 ? (
                <Box height={300} display="flex" justifyContent="center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={100}
                        innerRadius={40}
                        fill="#8884d8"
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend />
                      <RechartsTooltip formatter={(value, name) => [`${value} grants`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box height={300} display="flex" justifyContent="center" alignItems="center">
                  <Typography variant="body1" color="textSecondary">
                    No grants saved yet
                  </Typography>
                </Box>
              )}
            </CardContent>
          </StyledCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <StyledCard elevation={3}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}>
                <GroupIcon color="primary" />
                Collaborations
              </Typography>
              <Box display="flex" justifyContent="space-around" mt={2}>
                <Box textAlign="center">
                  <Typography variant="h4" color="warning.main" fontWeight="bold">
                    {pendingInvites}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Pending Invites
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    {activeCollaborations.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Active Collaborations
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(e, newValue) => setCurrentTab(newValue)}
          variant="fullWidth"
        >
          <Tab
            label={
              <Badge badgeContent={totalGrants} color="primary">
                Saved Grants
              </Badge>
            }
            icon={<FolderIcon />}
          />
          <Tab
            label={
              <Badge badgeContent={pendingInvites} color="warning">
                Invites
              </Badge>
            }
            icon={<EmailIcon />}
          />
          <Tab
            label={
              <Badge badgeContent={activeCollaborations.length} color="success">
                Collaborations
              </Badge>
            }
            icon={<GroupIcon />}
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Grant Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={handleCloseDetailsDialog} maxWidth="md" fullWidth>
        <DialogTitle>Grant Details</DialogTitle>
        <DialogContent>
          {selectedGrant && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedGrant.grant.title}
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                {selectedGrant.grant.description}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="primary">Agency</Typography>
                  <Typography variant="body2">{selectedGrant.grant.agency_name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="primary">Award Ceiling</Typography>
                  <Typography variant="body2">
                    {selectedGrant.grant.award_ceiling ? `$${parseInt(selectedGrant.grant.award_ceiling).toLocaleString()}` : 'Not specified'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="primary">Close Date</Typography>
                  <Typography variant="body2">
                    {new Date(selectedGrant.grant.close_date).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="primary">Status</Typography>
                  <StatusChip
                    label={selectedGrant.status_display}
                    $color={statusColors[selectedGrant.status]}
                    size="small"
                    icon={statusIcons[selectedGrant.status]}
                  />
                </Grid>
              </Grid>
              {selectedGrant.notes && (
                <Box mt={2}>
                  <Typography variant="subtitle2" color="primary">Notes</Typography>
                  <Typography variant="body2">{selectedGrant.notes}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailsDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Invite Collaborator Dialog */}
      <Dialog open={inviteDialogOpen} onClose={handleCloseInviteDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Invite Collaborator</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Email Address"
              value={inviteForm.invitee_email}
              onChange={(e) => setInviteForm({ ...inviteForm, invitee_email: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Name (Optional)"
              value={inviteForm.invitee_name}
              onChange={(e) => setInviteForm({ ...inviteForm, invitee_name: e.target.value })}
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Role</InputLabel>
              <Select
                value={inviteForm.role}
                onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                label="Role"
              >
                <MenuItem value="collaborator">Collaborator</MenuItem>
                <MenuItem value="co_pi">Co-Principal Investigator</MenuItem>
                <MenuItem value="advisor">Advisor</MenuItem>
                <MenuItem value="consultant">Consultant</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Message (Optional)"
              value={inviteForm.message}
              onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
              margin="normal"
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInviteDialog}>Cancel</Button>
          <Button
            onClick={handleSendInvite}
            variant="contained"
            disabled={!inviteForm.invitee_email}
          >
            Send Invite
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Grant Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Saved Grant</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                label="Status"
              >
                <MenuItem value="saved">Saved</MenuItem>
                <MenuItem value="applying">Applying</MenuItem>
                <MenuItem value="submitted">Submitted</MenuItem>
                <MenuItem value="awarded">Awarded</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Notes"
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              margin="normal"
              multiline
              rows={3}
            />
            <Box sx={{ mt: 2 }}>
              <FormControl component="fieldset">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type="checkbox"
                    checked={editForm.is_public}
                    onChange={(e) => setEditForm({ ...editForm, is_public: e.target.checked })}
                  />
                  <Typography variant="body2">Make this grant public</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <input
                    type="checkbox"
                    checked={editForm.allow_collaboration}
                    onChange={(e) => setEditForm({ ...editForm, allow_collaboration: e.target.checked })}
                  />
                  <Typography variant="body2">Allow collaboration invitations</Typography>
                </Box>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleUpdateGrant} variant="contained">
            Update Grant
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invite Response Dialog */}
      <Dialog open={inviteResponseDialogOpen} onClose={handleCloseInviteResponseDialog}>
        <DialogTitle>Respond to Invitation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to accept this collaboration invitation for "{selectedInvite?.grant_title}"?
          </DialogContentText>
          {selectedInvite?.message && (
            <Box mt={2}>
              <Typography variant="subtitle2" color="primary">Message from inviter:</Typography>
              <Typography variant="body2">{selectedInvite.message}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInviteResponseDialog}>Cancel</Button>
          <Button
            onClick={() => handleInviteResponse('accept')}
            variant="contained"
            color="success"
          >
            Accept
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SavedGrants;
