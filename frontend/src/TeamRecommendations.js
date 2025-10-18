import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  useTheme,
  alpha,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Avatar,
  AvatarGroup,
  Divider,
  IconButton,
  Collapse,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Fade,
  Paper
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Group as GroupIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  TrendingUp as TrendingUpIcon,
  AutoAwesome as AutoAwesomeIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const API_BASE_URL = 'http://localhost:8000/api';

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: '20px',
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.1)}`,
  transition: 'all 0.3s ease',
  marginBottom: '24px',
  '&:hover': {
    boxShadow: `0 25px 50px ${alpha(theme.palette.primary.main, 0.15)}`,
    transform: 'translateY(-4px)',
  },
}));

const StyledSearchBox = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  maxWidth: '800px',
  margin: '0 auto 24px',
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

const StyledSearchButton = styled(Button)(({ theme, $isLoading }) => ({
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
}));

const TeamRecommendations = ({ currentUser, onError }) => {
  const theme = useTheme();
  const [teamRecommendations, setTeamRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [teamSize, setTeamSize] = useState(3);
  const [includeDiversity, setIncludeDiversity] = useState(true);
  const [expandedCards, setExpandedCards] = useState({});

  const fetchTeamRecommendations = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      params.append('team_size', teamSize.toString());
      params.append('limit', '10');
      params.append('include_diversity', includeDiversity.toString());
      
      const response = await fetch(`${API_BASE_URL}/team-recommendations/?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch team recommendations');
      }
      
      const data = await response.json();
      console.log('Team recommendations data:', data);
      setTeamRecommendations(data.team_recommendations || []);
    } catch (err) {
      setError(err.message);
      if (onError) onError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, teamSize, includeDiversity, onError]);

  const handleSearch = () => {
    fetchTeamRecommendations();
  };

  const handleCardExpand = (index) => {
    setExpandedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'TBD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getScoreColor = (score) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Fair';
  };

  // Auto-fetch on component mount
  useEffect(() => {
    fetchTeamRecommendations();
  }, []);

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', padding: '40px' }}>
        <Alert severity="error" sx={{ marginBottom: '20px', borderRadius: '15px' }}>
          ❌ {error}
        </Alert>
        <Button 
          onClick={fetchTeamRecommendations}
          variant="contained"
          startIcon={<RefreshIcon />}
          sx={{
            borderRadius: '25px',
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
            }
          }}
        >
          🔄 Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', marginBottom: '40px' }}>
        <Typography variant="h3" sx={{ 
          fontWeight: '700', 
          marginBottom: '10px',
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          🤝 Team Recommendations
        </Typography>
        <Typography variant="h6" sx={{ color: 'text.secondary', marginBottom: '20px' }}>
          Discover grant opportunities with AI-suggested professor teams and collaboration pitches
        </Typography>
      </Box>

      {/* Search and Filters */}
      <StyledSearchBox>
        <Paper sx={{ 
          padding: '24px', 
          borderRadius: '20px',
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }}>
          <Box sx={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search for grants in natural language... (e.g., 'AI research grants', 'renewable energy funding')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              sx={{
                flex: '1',
                minWidth: '300px',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '25px',
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                },
              }}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />,
              }}
            />
            <StyledSearchButton
              onClick={handleSearch}
              disabled={loading}
              $isLoading={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
            >
              {loading ? 'AI Searching...' : 'Find Teams'}
            </StyledSearchButton>
          </Box>

          <Box sx={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: '120px' }}>
              <InputLabel>Team Size</InputLabel>
              <Select
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                label="Team Size"
                sx={{ borderRadius: '15px' }}
              >
                <MenuItem value={2}>2 Members</MenuItem>
                <MenuItem value={3}>3 Members</MenuItem>
                <MenuItem value={4}>4 Members</MenuItem>
                <MenuItem value={5}>5 Members</MenuItem>
                <MenuItem value={6}>6 Members</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: '150px' }}>
              <InputLabel>Diversity</InputLabel>
              <Select
                value={includeDiversity}
                onChange={(e) => setIncludeDiversity(e.target.value)}
                label="Diversity"
                sx={{ borderRadius: '15px' }}
              >
                <MenuItem value={true}>Include Diversity</MenuItem>
                <MenuItem value={false}>Any Team</MenuItem>
              </Select>
            </FormControl>

            <Chip
              icon={<FilterListIcon />}
              label={`${teamRecommendations.length} Recommendations`}
              color="primary"
              variant="outlined"
              sx={{ borderRadius: '20px' }}
            />
          </Box>
        </Paper>
      </StyledSearchBox>

      {/* Results */}
      {loading && (
        <Box sx={{ textAlign: 'center', padding: '60px' }}>
          <CircularProgress size={60} sx={{ color: theme.palette.primary.main, marginBottom: '20px' }} />
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>
            🤖 AI is finding the perfect team combinations...
          </Typography>
        </Box>
      )}

      {!loading && teamRecommendations.length === 0 && (
        <Box sx={{ textAlign: 'center', padding: '60px' }}>
          <Typography variant="h2" sx={{ marginBottom: '20px' }}>🤝</Typography>
          <Typography variant="h5" sx={{ fontWeight: '600', marginBottom: '10px', color: 'text.primary' }}>
            No Team Recommendations Found
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', marginBottom: '20px' }}>
            Try adjusting your search query or team size parameters.
          </Typography>
          <Button 
            onClick={fetchTeamRecommendations}
            variant="contained"
            startIcon={<RefreshIcon />}
            sx={{
              borderRadius: '25px',
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            }}
          >
            🔄 Refresh Recommendations
          </Button>
        </Box>
      )}

      {!loading && teamRecommendations.length > 0 && (
        <Fade in timeout={1000}>
          <Box>
            {teamRecommendations.map((recommendation, index) => (
              <StyledCard key={index}>
                <CardContent sx={{ padding: '24px' }}>
                  {/* Grant Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h5" sx={{ fontWeight: '600', marginBottom: '8px', color: 'text.primary' }}>
                        {recommendation.grant.title}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                        <Chip 
                          label={recommendation.grant.agency_name || 'Unknown Agency'} 
                          color="primary" 
                          variant="outlined"
                          size="small"
                        />
                        <Chip 
                          label={formatCurrency(recommendation.grant.award_ceiling)} 
                          color="success" 
                          variant="outlined"
                          size="small"
                        />
                        <Chip 
                          label={`Due: ${formatDate(recommendation.grant.close_date)}`} 
                          color="warning" 
                          variant="outlined"
                          size="small"
                        />
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" sx={{ 
                        color: getScoreColor(recommendation.overall_score),
                        fontWeight: '700'
                      }}>
                        {recommendation.overall_score.toFixed(1)}%
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {getScoreLabel(recommendation.overall_score)} Match
                      </Typography>
                    </Box>
                  </Box>

                  {/* Team Section */}
                  <Box sx={{ marginBottom: '20px' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                      <GroupIcon sx={{ color: theme.palette.primary.main, marginRight: '8px' }} />
                      <Typography variant="h6" sx={{ fontWeight: '600' }}>
                        Recommended Team ({recommendation.team_size} members)
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
                      {recommendation.team.map((professor, profIndex) => (
                        <Card key={profIndex} sx={{ 
                          flex: '1', 
                          minWidth: '200px',
                          borderRadius: '15px',
                          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                        }}>
                          <CardContent sx={{ padding: '16px' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                              <Avatar sx={{ 
                                width: '40px', 
                                height: '40px', 
                                marginRight: '12px',
                                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
                              }}>
                                {professor.name?.charAt(0) || 'P'}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: '600', lineHeight: 1.2 }}>
                                  {profIndex === 0 ? '👑 ' : '👤 '}{professor.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {profIndex === 0 ? 'Principal Investigator' : `Co-Investigator ${profIndex}`}
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                              <SchoolIcon sx={{ fontSize: '16px', color: 'text.secondary', marginRight: '4px' }} />
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {professor.department} • {professor.university}
                              </Typography>
                            </Box>
                            {professor.research_areas && professor.research_areas.length > 0 && (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {professor.research_areas.slice(0, 2).map((area, areaIndex) => (
                                  <Chip 
                                    key={areaIndex}
                                    label={area} 
                                    size="small" 
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem', height: '20px' }}
                                  />
                                ))}
                                {professor.research_areas.length > 2 && (
                                  <Chip 
                                    label={`+${professor.research_areas.length - 2}`} 
                                    size="small" 
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem', height: '20px' }}
                                  />
                                )}
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </Box>

                    {/* Team Scores */}
                    <Box sx={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                      <Chip
                        icon={<TrendingUpIcon />}
                        label={`Team Synergy: ${recommendation.team_synergy_score.toFixed(1)}%`}
                        color="info"
                        variant="outlined"
                        sx={{ borderRadius: '20px' }}
                      />
                      <Chip
                        icon={<WorkIcon />}
                        label={`Grant Fit: ${recommendation.grant_team_fit_score.toFixed(1)}%`}
                        color="secondary"
                        variant="outlined"
                        sx={{ borderRadius: '20px' }}
                      />
                    </Box>
                  </Box>

                  {/* Collaboration Pitch */}
                  <Box>
                    <Button
                      onClick={() => handleCardExpand(index)}
                      endIcon={expandedCards[index] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      sx={{ 
                        marginBottom: '12px',
                        color: theme.palette.primary.main,
                        fontWeight: '600'
                      }}
                    >
                      {expandedCards[index] ? 'Hide' : 'Show'} Collaboration Pitch
                    </Button>
                    
                    <Collapse in={expandedCards[index]}>
                      <Paper sx={{ 
                        padding: '20px', 
                        borderRadius: '15px',
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      }}>
                        <Typography variant="body1" sx={{ 
                          lineHeight: 1.6, 
                          color: 'text.primary',
                          whiteSpace: 'pre-line'
                        }}>
                          {recommendation.collaboration_pitch}
                        </Typography>
                      </Paper>
                    </Collapse>
                  </Box>
                </CardContent>

                <CardActions sx={{ padding: '0 24px 24px' }}>
                  <Button
                    variant="contained"
                    startIcon={<AutoAwesomeIcon />}
                    sx={{
                      borderRadius: '25px',
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                      }
                    }}
                  >
                    Save Team Recommendation
                  </Button>
                  <Button
                    variant="outlined"
                    sx={{ borderRadius: '25px' }}
                  >
                    View Grant Details
                  </Button>
                </CardActions>
              </StyledCard>
            ))}
          </Box>
        </Fade>
      )}
    </Box>
  );
};

export default TeamRecommendations;
