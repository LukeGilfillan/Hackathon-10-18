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
import GroupIcon from '@mui/icons-material/Group';
import EmailIcon from '@mui/icons-material/Email';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { faHourglassHalf } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { alpha } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  borderRadius: '16px',
  '&:hover': {
    boxShadow: theme.shadows[8],
    transform: 'translateY(-2px)',
  },
}));


const StatusChip = styled(Chip)(({ theme, $color }) => {
  const color = $color || theme.palette.grey[500]; // Fallback color
  return {
    background: `linear-gradient(45deg, ${color} 30%, ${alpha(color, 0.8)} 90%)`,
  color: '#FFFFFF',
  fontWeight: 'medium',
  transition: 'all 0.2s ease-in-out',
    boxShadow: `0 2px 4px ${alpha(color, 0.3)}`,
  '&:hover': {
    transform: 'scale(1.05)',
      background: `linear-gradient(45deg, ${alpha(color, 0.8)} 30%, ${color} 90%)`,
      boxShadow: `0 3px 6px ${alpha(color, 0.4)}`,
  },
  '& .MuiChip-label': {
    padding: '0 12px',
    color: '#FFFFFF',
    },
  };
});

const StageHeader = styled(Box)(({ theme, color, order }) => ({
  padding: theme.spacing(1.5),
  background: `linear-gradient(45deg, ${color} 30%, ${alpha(color, 0.8)} 90%)`,
  borderRadius: '8px 8px 0 0',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  color: '#FFFFFF',
  marginBottom: theme.spacing(1),
  position: 'relative',
  boxShadow: `0 2px 4px 1px ${alpha(color, 0.3)}`,
  transition: 'all 0.3s ease-in-out',
  minHeight: '48px',
  '&:hover': {
    background: `linear-gradient(45deg, ${alpha(color, 0.8)} 30%, ${color} 90%)`,
    boxShadow: `0 3px 6px 2px ${alpha(color, 0.4)}`,
  },
  '& .MuiTypography-root': {
    color: '#FFFFFF',
    fontSize: '0.875rem',
    fontWeight: 'bold',
  },
  '& .MuiChip-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: '#FFFFFF',
    height: '24px',
    fontSize: '0.75rem',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
  },
  '&::before': {
    content: `"${order + 1}"`,
    position: 'absolute',
    left: '-10px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: theme.palette.background.paper,
    color: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    boxShadow: theme.shadows[2],
  },
}));

const CompactGrantCard = styled(Card)(({ theme }) => ({
  width: '100%',
  maxWidth: '280px',
  margin: '0 auto',
  position: 'relative',
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[2],
  borderRadius: '8px',
  padding: '8px 10px',
  transition: 'box-shadow 0.3s ease-in-out',
  '&:hover': {
    boxShadow: theme.shadows[3],
  },
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  marginBottom: '6px',
  '&:last-child': {
    marginBottom: 0,
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
    'pending': theme.palette.info.main, // pending should use the same color as saved
    'applying': theme.palette.warning.main,
    'submitted': theme.palette.primary.main,
    'awarded': theme.palette.success.main,
    'rejected': theme.palette.error.main
  };

  // Hardcoded pipeline stages with error gradient colors (reduced to 4 stages to fit in one row)
  const pipelineStages = [
    {
      id: 1,
      name: 'Saved Grants',
      color: theme.palette.info.main,
      order: 0
    },
    {
      id: 2,
      name: 'Research & Planning',
      color: theme.palette.warning.main,
      order: 1
    },
    {
      id: 3,
      name: 'Application Submitted',
      color: theme.palette.primary.main,
      order: 2
    },
    {
      id: 4,
      name: 'Awarded',
      color: theme.palette.success.main,
      order: 3
    }
  ];

  const statusIcons = {
    'saved': <FolderIcon sx={{ color: 'white' }} />,
    'pending': <FolderIcon sx={{ color: 'white' }} />, // pending should use the same icon as saved
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

   // Get stage icons based on stage name
   const getStageIcon = (stageName) => {
     const iconMap = {
       'saved': <FolderIcon sx={{ color: 'white' }} />,
       'pending': <FolderIcon sx={{ color: 'white' }} />,
       'saved_grants': <FolderIcon sx={{ color: 'white' }} />,
       'research': <ScienceIcon sx={{ color: 'white' }} />,
       'proposal': <DescriptionIcon sx={{ color: 'white' }} />,
       'submitted': <SendIcon sx={{ color: 'white' }} />,
       'awarded': <EmojiEventsIcon sx={{ color: 'white' }} />,
       'not_won': <BlockIcon sx={{ color: 'white' }} />
     };

     // Try to match based on stage name
     const stageKey = stageName.toLowerCase().replace(/\s+/g, '_');
     return iconMap[stageKey] || <AssessmentIcon sx={{ color: 'white' }} />;
   };

   // Render compact grant card for pipeline stages
   const renderCompactGrantCard = (grant) => {
     const daysLeft = grant.application_deadline ? getDaysUntilDeadline(grant.application_deadline) : 0;
    const deadlineColor = getDeadlineColor(daysLeft);

    return (
       <CompactGrantCard key={grant.id}>
        <Box>
           <Tooltip title={grant.title} placement="top">
              <Typography
               variant="subtitle2"
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
                 fontSize: '0.8rem',
                 mb: 0.5,
                 minWidth: 0,
                 lineHeight: 1.2,
                }}
                onClick={() => handleOpenDetailsDialog(grant)}
              >
               {grant.title}
              </Typography>
            </Tooltip>

           <Box display="flex" flexWrap="wrap" gap={0.3} mb={0.5}>
            <Chip
               label={grant.agency}
              size="small"
              variant="outlined"
              sx={{
                 height: '18px',
                 fontSize: '0.65rem',
                backgroundColor: 'transparent',
                borderColor: theme.palette.text.secondary,
                color: theme.palette.text.secondary,
              }}
            />
              <Chip
               label={grant.status}
                size="small"
                sx={{
                 height: '18px',
                 fontSize: '0.65rem',
                 backgroundColor: statusColors[grant.status] || theme.palette.grey[500],
                 color: 'white',
               }}
             />
           </Box>
          </Box>

         <Box sx={{ mt: 0.5 }}>
           <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="caption" sx={{
              display: 'flex',
              alignItems: 'center',
              color: theme.palette.text.secondary,
               fontSize: '0.7rem',
            }}>
               <FontAwesomeIcon icon={faHourglassHalf} style={{ marginRight: 3, fontSize: '0.65rem' }} />
               {grant.application_deadline ? new Date(grant.application_deadline).toLocaleDateString() : 'No deadline'}
            </Typography>
             {grant.application_deadline && (
            <Chip
                 label={`${daysLeft}d`}
              color={deadlineColor}
              size="small"
                 sx={{
                   height: '18px',
                   fontSize: '0.65rem',
                   fontWeight: 'bold',
                 }}
               />
             )}
          </Box>

          {grant.notes && (
            <Typography
               variant="caption"
              color="textSecondary"
              sx={{
                 mt: 0.3,
                 fontSize: '0.65rem',
                 lineHeight: 1.2,
                display: '-webkit-box',
                 WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {grant.notes}
            </Typography>
          )}
        </Box>

         {/* Compact action icons */}
        <Box sx={{
          display: 'flex',
           justifyContent: 'flex-end',
          alignItems: 'center',
           gap: 0.3,
           mt: 0.3,
        }}>
            <Tooltip title="View Details">
              <IconButton
                size="small"
                onClick={() => handleOpenDetailsDialog(grant)}
                sx={{
                 p: 0.3,
                  color: theme.palette.info.main,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.info.main, 0.1),
                  }
                }}
              >
               <InfoIcon sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit Grant">
              <IconButton
                size="small"
                onClick={() => handleOpenEditDialog(grant)}
                sx={{
                 p: 0.3,
                  color: theme.palette.warning.main,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.warning.main, 0.1),
                  }
                }}
              >
               <EditIcon sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Tooltip>
          </Box>
       </CompactGrantCard>
     );
   };

  const pieChartData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    color: statusColors[status] || theme.palette.grey[500]
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


  const renderTabContent = () => {
    switch (currentTab) {
      case 0: // Saved Grants
        return (
          <Box>
            {/* Summary Cards */}
            <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} mb={4} sx={{ width: '100%' }}>
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

            {/* Pipeline Stages Overview */}
            <Paper sx={{ 
              mb: 3, 
              p: { xs: 2, sm: 3, md: 4 },
              width: '100%',
              maxWidth: '100%'
            }}>
              <Typography variant="h5" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssessmentIcon color="primary" />
                Grant Pipeline Stages
              </Typography>
              
              <Grid container spacing={{ xs: 1, sm: 1.5, md: 2 }} sx={{ width: '100%' }}>
                {pipelineStages.map((stage, index) => {
                  const stageGrants = savedGrants.filter(grant => {
                    // Map grant status to pipeline stage
                    const statusMap = {
                      'saved': 'Saved Grants',
                      'pending': 'Saved Grants', // pending grants should be in saved grants stage
                      'applying': 'Research & Planning',
                      'submitted': 'Application Submitted',
                      'awarded': 'Awarded',
                      'rejected': 'Awarded' // map rejected to awarded stage for now
                    };
                    return statusMap[grant.status] === stage.name;
                  });

                  return (
                    <Grid item xs={12} sm={6} md={3} key={stage.id} sx={{ minWidth: 0 }}>
                      <Box sx={{ 
                        width: '100%',
                        maxWidth: '100%',
                        overflow: 'hidden'
                      }}>
                        <StageHeader color={stage.color} order={index}>
                          {getStageIcon(stage.name)}
                          <Typography variant="subtitle2" fontWeight="bold" sx={{ 
                            flex: 1,
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {stage.name}
                          </Typography>
                          <Chip
                            label={stageGrants.length}
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(255, 255, 255, 0.2)',
                              color: 'white',
                              fontWeight: 'bold',
                              minWidth: '24px',
                              height: '24px',
                              fontSize: '0.75rem',
                            }}
                          />
                        </StageHeader>
                        
                        <Box sx={{ 
                          minHeight: '100px',
                          p: 1.5,
                          backgroundColor: theme.palette.background.default,
                          borderRadius: '0 0 8px 8px',
                          border: `1px solid ${alpha(stage.color, 0.2)}`,
                          borderTop: 'none',
                          maxHeight: '300px',
                          overflowY: 'auto',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center'
                        }}>
                          {stageGrants.length > 0 ? (
                            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              {stageGrants.map((grant) => renderCompactGrantCard(grant))}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="textSecondary" sx={{ 
                              textAlign: 'center', 
                              mt: 2,
                              fontSize: '0.8rem'
                            }}>
                              No grants in this stage
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </Paper>
          </Box>
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
                        <Avatar sx={{ bgcolor: statusColors[invite.status] || theme.palette.grey[500] }}>
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
    <Box sx={{ 
      width: '100%',
      maxWidth: '100%',
      p: { xs: 2, sm: 3, md: 4 },
      mx: 0,
      px: { xs: 1, sm: 2, md: 3 }
    }}>
      {/* Tabs */}
      <Paper sx={{ 
        mb: 3,
        width: '100%',
        maxWidth: '100%'
      }}>
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
      <Box sx={{ 
        width: '100%',
        maxWidth: '100%',
        p: { xs: 1, sm: 2, md: 3 }
      }}>
        {renderTabContent()}
      </Box>


      {/* Grant Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={handleCloseDetailsDialog} maxWidth="md" fullWidth>
        <DialogTitle>Grant Details</DialogTitle>
        <DialogContent>
          {selectedGrant && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedGrant.title}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="primary">Agency</Typography>
                  <Typography variant="body2">{selectedGrant.agency}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="primary">Application Deadline</Typography>
                  <Typography variant="body2">
                    {selectedGrant.application_deadline ? new Date(selectedGrant.application_deadline).toLocaleDateString() : 'Not specified'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="primary">Status</Typography>
                  <StatusChip
                    label={selectedGrant.status}
                    $color={statusColors[selectedGrant.status] || theme.palette.grey[500]}
                    size="small"
                    icon={statusIcons[selectedGrant.status] || <FolderIcon sx={{ color: 'white' }} />}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="primary">Priority</Typography>
                  <Typography variant="body2">{selectedGrant.priority || 'Medium'}</Typography>
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
