import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamationTriangle,
  faCheckCircle,
  faClock,
  faHourglassHalf,
  faArrowRight,
  faEye
} from '@fortawesome/free-solid-svg-icons';
import FolderIcon from '@mui/icons-material/Folder';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import ScienceIcon from '@mui/icons-material/Science';
import CancelIcon from '@mui/icons-material/Cancel';
import GrantRecommendations from './GrantRecommendations';

const API_BASE_URL = 'http://localhost:8000/api';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const StatCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  borderRadius: '16px',
  padding: '20px',
  textAlign: 'center',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.15)} 100%)`,
    transform: 'translateY(-2px)',
  },
}));


const ProfessorOverview = ({ currentUser, onNavigateToSavedGrants }) => {
  const [savedGrants, setSavedGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalGrants: 0,
    statusCounts: {},
    upcomingDeadlines: 0,
    recentActivity: 0
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
    'saved': <FolderIcon sx={{ color: 'white', fontSize: 16 }} />,
    'applying': <ScienceIcon sx={{ color: 'white', fontSize: 16 }} />,
    'submitted': <TrendingUpIcon sx={{ color: 'white', fontSize: 16 }} />,
    'awarded': <AssessmentIcon sx={{ color: 'white', fontSize: 16 }} />,
    'rejected': <CancelIcon sx={{ color: 'white', fontSize: 16 }} />
  };

  const fetchSavedGrants = async () => {
    try {
      const sessionToken = localStorage.getItem('session_token');
      if (!sessionToken) {
        setError('Please sign in to view saved grants');
        return;
      }

      console.log('Fetching saved grants with token:', sessionToken);
      const response = await fetch(`${API_BASE_URL}/saved-grants/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${sessionToken}`,
        },
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Saved grants data:', data);
        const grants = data.saved_grants || [];
        setSavedGrants(grants);
        
        // Calculate statistics
        const statusCounts = grants.reduce((acc, grant) => {
          acc[grant.status] = (acc[grant.status] || 0) + 1;
          return acc;
        }, {});
        
        const now = new Date();
        const upcomingDeadlines = grants.filter(grant => {
          const deadline = new Date(grant.grant.close_date);
          const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
          return daysUntilDeadline > 0 && daysUntilDeadline <= 30;
        }).length;
        
        const recentActivity = grants.filter(grant => {
          const savedDate = new Date(grant.saved_at);
          const daysSinceSaved = Math.ceil((now - savedDate) / (1000 * 60 * 60 * 24));
          return daysSinceSaved <= 7;
        }).length;
        
        setStats({
          totalGrants: grants.length,
          statusCounts,
          upcomingDeadlines,
          recentActivity
        });
      } else {
        console.log('Response not ok, status:', response.status);
        const responseText = await response.text();
        console.log('Response text:', responseText);
        
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (parseErr) {
          console.log('Failed to parse JSON:', parseErr);
          errorData = { error: responseText || 'Failed to fetch saved grants' };
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch saved grants`);
      }
    } catch (err) {
      console.error('Error fetching saved grants:', err);
      setError(err.message || 'Failed to load saved grants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchSavedGrants();
    }
  }, [currentUser]);

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

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const recentGrants = savedGrants.slice(0, 5);
  const upcomingGrants = savedGrants
    .filter(grant => getDaysUntilDeadline(grant.grant.close_date) > 0 && getDaysUntilDeadline(grant.grant.close_date) <= 30)
    .sort((a, b) => getDaysUntilDeadline(a.grant.close_date) - getDaysUntilDeadline(b.grant.close_date))
    .slice(0, 3);

  return (
    <Box sx={{ p: 3 }}>
      {/* AI Recommendations Section */}
      <Box mt={4}>
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" fontWeight="bold" mb={2} sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: theme.palette.primary.main,
          }}>
            🎯 AI-Powered Grant Recommendations
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Personalized grant opportunities based on your research profile and preferences
          </Typography>
          <GrantRecommendations
            currentUser={currentUser}
            onError={(error) => console.error('Recommendations error:', error)}
          />
        </Paper>
      </Box>
    </Box>
  );
};

export default ProfessorOverview;
