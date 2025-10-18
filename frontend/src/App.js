import React, { useState, useEffect } from 'react';
import './App.css';
import { 
  TextField, 
  Button, 
  IconButton, 
  InputAdornment, 
  CircularProgress,
  Box,
  Typography,
  Fade
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import { alpha, styled } from '@mui/material/styles';
import AuthComponent from './AuthComponent';
import ProfessorGetStartedDialog from './ProfessorGetStartedDialog';
import SavedGrants from './SavedGrants';
import ProfessorOverview from './ProfessorOverview';
import SearchResultsWrapper from './SearchResultsWrapper';
import Forum from './Forum';

const API_BASE_URL = 'http://localhost:8000/api';

// Styled components
const AnimatedSearchIcon = styled(SearchIcon)(({ theme }) => ({
  animation: 'pulse 2s infinite',
  '@keyframes pulse': {
    '0%': {
      transform: 'scale(1)',
      opacity: 1,
    },
    '50%': {
      transform: 'scale(1.1)',
      opacity: 0.7,
    },
    '100%': {
      transform: 'scale(1)',
      opacity: 1,
    },
  },
}));

const StyledSearchButton = styled(Button)(({ theme, $isLoading }) => ({
  borderRadius: '25px',
  padding: '12px 24px',
  minWidth: '120px',
  height: '48px',
  background: $isLoading 
    ? `linear-gradient(135deg, ${alpha('#dc3545', 0.7)} 0%, ${alpha('#c82333', 0.7)} 100%)`
    : `linear-gradient(135deg, #dc3545 0%, #c82333 100%)`,
  color: 'white',
  fontWeight: 600,
  fontSize: '1rem',
  textTransform: 'none',
  boxShadow: `0 4px 15px ${alpha('#dc3545', 0.3)}`,
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    background: `linear-gradient(135deg, #c82333 0%, #dc3545 100%)`,
    boxShadow: `0 6px 20px ${alpha('#dc3545', 0.4)}`,
    transform: 'translateY(-2px)',
  },
  '&:disabled': {
    background: `linear-gradient(135deg, ${alpha('#6c757d', 0.7)} 0%, ${alpha('#495057', 0.7)} 100%)`,
    color: alpha('#ffffff', 0.7),
    boxShadow: 'none',
    transform: 'none',
  },
  '& .button-text': {
    transition: 'opacity 0.3s ease',
    opacity: $isLoading ? 0 : 1,
  },
}));

// Inline styles
const styles = {
  app: {
    minHeight: '100vh',
    padding: '20px',
    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #e9ecef 100%)',
  },
  appHeader: {
    textAlign: 'center',
    color: '#212529',
    marginBottom: '40px',
  },
  appTitle: {
    fontSize: '3rem',
    fontWeight: '700',
    marginBottom: '10px',
    textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
    background: 'linear-gradient(135deg, #212529 0%, #495057 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  appSubtitle: {
    fontSize: '1.2rem',
    color: '#6c757d',
  },
  searchContainer: {
    maxWidth: '1200px',
    margin: '0 auto 40px',
    background: 'white',
    borderRadius: '20px',
    padding: '30px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
    border: '1px solid #e9ecef',
  },
  tabButtons: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
    justifyContent: 'center',
  },
  tabButton: {
    padding: '15px 30px',
    border: '2px solid #e9ecef',
    borderRadius: '50px',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    background: 'white',
    color: '#6c757d',
  },
  tabButtonActive: {
    background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
    color: 'white',
    border: '2px solid #dc3545',
    transform: 'translateY(-2px)',
    boxShadow: '0 10px 20px rgba(220, 53, 69, 0.3)',
  },
  searchForm: {
    display: 'flex',
    gap: '15px',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    padding: '15px 20px',
    border: '2px solid #e9ecef',
    borderRadius: '50px',
    fontSize: '1rem',
    outline: 'none',
    transition: 'all 0.3s ease',
    minWidth: '250px',
    background: 'white',
  },
  searchSelect: {
    padding: '15px 20px',
    border: '2px solid #e9ecef',
    borderRadius: '50px',
    fontSize: '1rem',
    outline: 'none',
    transition: 'all 0.3s ease',
    minWidth: '250px',
    background: 'white',
  },
  searchButton: {
    padding: '15px 30px',
    background: 'linear-gradient(135deg, #212529 0%, #495057 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    minWidth: '120px',
  },
  searchButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  errorMessage: {
    maxWidth: '1200px',
    margin: '0 auto 20px',
    background: 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
    color: '#721c24',
    padding: '15px 20px',
    borderRadius: '10px',
    border: '1px solid #f5c6cb',
    textAlign: 'center',
  },
  resultsContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  resultsTitle: {
    color: '#212529',
    textAlign: 'center',
    marginBottom: '30px',
    fontSize: '2rem',
    textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
  },
  noResults: {
    textAlign: 'center',
    color: '#6c757d',
    fontSize: '1.2rem',
    margin: '40px 0',
  },
  grantsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '25px',
    marginBottom: '40px',
  },
  profilesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '25px',
    marginBottom: '40px',
  },
  grantCard: {
    background: 'white',
    borderRadius: '15px',
    padding: '25px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
    transition: 'all 0.3s ease',
    border: '1px solid #e9ecef',
  },
  profileCard: {
    background: 'white',
    borderRadius: '15px',
    padding: '25px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
    transition: 'all 0.3s ease',
    border: '1px solid #e9ecef',
  },
  cardTitle: {
    color: '#212529',
    marginBottom: '15px',
    fontSize: '1.3rem',
    lineHeight: 1.4,
  },
  grantMeta: {
    display: 'flex',
    gap: '15px',
    marginBottom: '15px',
    flexWrap: 'wrap',
  },
  profileMeta: {
    display: 'flex',
    gap: '15px',
    marginBottom: '15px',
    flexWrap: 'wrap',
  },
  metaTag: {
    background: '#f8f9fa',
    padding: '5px 12px',
    borderRadius: '20px',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  agencyTag: {
    background: 'linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%)',
    color: '#495057',
  },
  closeDateTag: {
    background: 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
    color: '#721c24',
  },
  grantAmounts: {
    marginBottom: '15px',
  },
  amountTag: {
    background: 'linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%)',
    color: '#495057',
    padding: '8px 15px',
    borderRadius: '20px',
    fontWeight: '600',
    fontSize: '0.95rem',
  },
  grantDescription: {
    color: '#6c757d',
    lineHeight: 1.6,
    marginBottom: '15px',
  },
  profileBio: {
    color: '#6c757d',
    lineHeight: 1.6,
    marginBottom: '15px',
  },
  grantCategory: {
    background: 'linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%)',
    color: '#495057',
    padding: '8px 15px',
    borderRadius: '20px',
    fontSize: '0.9rem',
    fontWeight: '500',
    display: 'inline-block',
  },
  profileSchool: {
    color: '#495057',
    fontWeight: '500',
    marginBottom: '15px',
    fontSize: '1rem',
  },
  profileExpertise: {
    background: 'linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%)',
    color: '#495057',
    padding: '10px 15px',
    borderRadius: '10px',
    marginBottom: '15px',
    fontSize: '0.95rem',
  },
  profileContact: {
    color: '#212529',
    fontWeight: '500',
    fontSize: '0.95rem',
  },
};

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [grants, setGrants] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  
  // Search results display state
  const [showGrantList, setShowGrantList] = useState(false);
  const [showProfileList, setShowProfileList] = useState(false);
  const [selectedGrantIndex, setSelectedGrantIndex] = useState(0);
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(0);
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showGetStarted, setShowGetStarted] = useState(false);

  // Check for existing session on component mount
  useEffect(() => {
    const sessionToken = localStorage.getItem('session_token');
    const userEmail = localStorage.getItem('user_email');
    const professorProfile = localStorage.getItem('professor_profile');
    
    if (sessionToken && userEmail && professorProfile) {
      // Verify session is still valid
      fetch(`${API_BASE_URL}/auth/current-user/?session_token=${sessionToken}`)
        .then(response => response.json())
        .then(data => {
          if (data.user) {
            setIsAuthenticated(true);
            setCurrentUser(data.user);
    // Always show dialog for professors to review/update their profile
    if (shouldShowGetStartedDialog(data.user)) {
      setShowGetStarted(true);
    }
          } else {
            // Session expired, clear localStorage and show auth
            localStorage.removeItem('session_token');
            localStorage.removeItem('user_email');
            localStorage.removeItem('professor_profile');
            setShowAuth(true);
          }
        })
        .catch(() => {
          // Session invalid, clear localStorage and show auth
          localStorage.removeItem('session_token');
          localStorage.removeItem('user_email');
          localStorage.removeItem('professor_profile');
          setShowAuth(true);
        });
    } else {
      // No session found, show auth dialog
      setShowAuth(true);
    }
  }, []);

  // Setup speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setSearchQuery(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognition);
    }
  }, []);


  // Helper function to check if professor profile is incomplete
  const isProfileIncomplete = (profile) => {
    if (!profile) return true;
    
    // Check for essential fields
    const hasBasicInfo = profile.name && profile.department && profile.university;
    const hasResearchInfo = profile.research_areas && profile.research_areas.length > 0;
    
    return !hasBasicInfo || !hasResearchInfo;
  };

  // Helper function to check if professor should see the get started dialog
  const shouldShowGetStartedDialog = (user) => {
    // Always show dialog for professors - they can review and update their profile
    return user && user.professor_profile;
  };

  // Helper function to check if this is a new profile (incomplete)
  const isNewProfile = (user) => {
    if (!user?.professor_profile) return true;
    return isProfileIncomplete(user.professor_profile);
  };

  // Authentication handlers
  const handleAuthSuccess = (user) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    setShowAuth(false);
    
    // Always show dialog for professors to review/update their profile
    if (shouldShowGetStartedDialog(user)) {
      setShowGetStarted(true);
    }
  };

  const handleProfileComplete = async () => {
    // Refresh user data to get updated profile
    const sessionToken = localStorage.getItem('session_token');
    if (sessionToken) {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/current-user/?session_token=${sessionToken}`);
        const data = await response.json();
        if (data.user) {
          setCurrentUser(data.user);
          localStorage.setItem('professor_profile', JSON.stringify(data.user.professor_profile));
        }
      } catch (err) {
        console.error('Error refreshing user data:', err);
      }
    }
    setShowGetStarted(false);
  };

  const handleSignOut = async () => {
    const sessionToken = localStorage.getItem('session_token');
    
    if (sessionToken) {
      try {
        await fetch(`${API_BASE_URL}/auth/signout/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ session_token: sessionToken }),
        });
      } catch (err) {
        console.error('Sign out error:', err);
      }
    }
    
    // Clear local storage and state
    localStorage.removeItem('session_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('professor_profile');
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const searchGrants = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      params.append('limit', '20');
      
      // Use natural language search only when there's a search query
      // Otherwise use the regular search endpoint for initial loading
      const endpoint = searchQuery 
        ? `${API_BASE_URL}/search/grants/nlp/`
        : `${API_BASE_URL}/grants/`;
      
      const response = await fetch(`${endpoint}?${params}`);
      if (!response.ok) throw new Error('Failed to fetch grants');
      
      const data = await response.json();
      setGrants(data.grants || []);
      
      // Auto-show list when results are loaded
      if (data.grants && data.grants.length > 0) {
        setShowGrantList(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const searchProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      params.append('limit', '20');
      
      // Use natural language search only when there's a search query
      // Otherwise use the regular search endpoint for initial loading
      const endpoint = searchQuery 
        ? `${API_BASE_URL}/search/profiles/nlp/`
        : `${API_BASE_URL}/profiles/`;
      
      const response = await fetch(`${endpoint}?${params}`);
      if (!response.ok) throw new Error('Failed to fetch profiles');
      
      const data = await response.json();
      setProfiles(data.profiles || []);
      
      // Auto-show list when results are loaded
      if (data.profiles && data.profiles.length > 0) {
        setShowProfileList(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  const handleSearch = () => {
    if (activeTab === 'grants') {
      searchGrants();
    } else if (activeTab === 'profiles') {
      searchProfiles();
    }
  };

  const toggleListening = () => {
    if (!recognition) return;

    try {
      if (isListening) {
        recognition.stop();
        setIsListening(false);
      } else {
        setIsListening(true);
        recognition.start();
      }
    } catch (error) {
      console.error('Error with speech recognition:', error);
      setIsListening(false);
    }
  };

  // Auto-search when switching to grants or profiles tabs
  useEffect(() => {
    if (activeTab === 'grants' && grants.length === 0 && !loading) {
      // Load initial grants without any search query
      searchGrants();
    } else if (activeTab === 'profiles' && profiles.length === 0 && !loading) {
      // Load initial profiles without any search query
      searchProfiles();
    }
  }, [activeTab]);


  // Result selection handlers
  const handleGrantSelection = (grant, index) => {
    setSelectedGrantIndex(index);
    // You can add additional logic here for grant selection
    console.log('Selected grant:', grant);
  };

  const handleProfileSelection = (profile, index) => {
    setSelectedProfileIndex(index);
    // You can add additional logic here for profile selection
    console.log('Selected profile:', profile);
  };


  return (
    <div style={styles.app}>
      <header style={styles.appHeader}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <img 
              src="/images/ConcordiaLogo.png" 
              alt="Cardinal Concordia" 
              style={{
                height: '160px',
                width: 'auto',
                objectFit: 'contain'
              }}
            />
            <div>
              <p style={styles.appSubtitle}>AI-Powered Research Discovery Platform</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ textAlign: 'right', color: '#212529' }}>
                  <div style={{ fontSize: '1rem', fontWeight: '600' }}>
                    {currentUser?.professor_profile?.name || currentUser?.email}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                    {currentUser?.professor_profile?.department || 'Professor'}
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  style={{
                    padding: '10px 20px',
                    border: '2px solid #dc3545',
                    borderRadius: '25px',
                    background: 'transparent',
                    color: '#dc3545',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = '#dc3545';
                    e.target.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#dc3545';
                  }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                style={{
                  padding: '12px 25px',
                  border: '2px solid #dc3545',
                  borderRadius: '25px',
                  background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #c82333 0%, #bd2130 100%)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
                }}
              >
                👤 Sign In / Sign Up
              </button>
            )}
          </div>
        </div>
      </header>

      <div style={styles.searchContainer}>
        <div style={styles.tabButtons}>
          <button 
            style={activeTab === 'overview' ? {...styles.tabButton, ...styles.tabButtonActive} : styles.tabButton}
            onClick={() => setActiveTab('overview')}
          >
            🏠 Overview
          </button>
          <button 
            style={activeTab === 'grants' ? {...styles.tabButton, ...styles.tabButtonActive} : styles.tabButton}
            onClick={() => setActiveTab('grants')}
          >
            🔍 Search Grants
          </button>
          <button 
            style={activeTab === 'profiles' ? {...styles.tabButton, ...styles.tabButtonActive} : styles.tabButton}
            onClick={() => setActiveTab('profiles')}
          >
            👥 Find Researchers
          </button>
          <button 
            style={activeTab === 'saved' ? {...styles.tabButton, ...styles.tabButtonActive} : styles.tabButton}
            onClick={() => setActiveTab('saved')}
          >
            📁 My Saved Grants
          </button>
          <button 
            style={activeTab === 'forum' ? {...styles.tabButton, ...styles.tabButtonActive} : styles.tabButton}
            onClick={() => setActiveTab('forum')}
          >
            💬 Forum
          </button>
        </div>

        {/* Search Bar - Only show for grants and profiles tabs */}
        {(activeTab === 'grants' || activeTab === 'profiles') && (
          <Box sx={{ 
            display: 'flex', 
            gap: '15px', 
            flexWrap: 'wrap', 
            alignItems: 'center', 
            justifyContent: 'center',
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
              background: `linear-gradient(45deg, ${alpha('#dc3545', 0.1)}, ${alpha('#e74c3c', 0.1)})`,
              borderRadius: '30px',
              zIndex: -1,
              filter: 'blur(20px)',
            },
          }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder={activeTab === 'grants' ? 'Ask about grants in natural language...' : 'Ask about researchers in natural language...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '30px',
                  backgroundColor: alpha('#ffffff', 0.8),
                  backdropFilter: 'blur(10px)',
                  boxShadow: `0 4px 20px ${alpha('#dc3545', 0.1)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: `0 6px 25px ${alpha('#dc3545', 0.15)}`,
                  },
                  '&.Mui-focused': {
                    boxShadow: `0 8px 30px ${alpha('#dc3545', 0.2)}`,
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AnimatedSearchIcon sx={{ color: '#dc3545' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={toggleListening}
                      color={isListening ? "error" : "primary"}
                      disabled={loading}
                      sx={{
                        mr: 1,
                        transition: 'all 0.3s ease',
                        animation: isListening ? 'pulse 1.5s infinite' : 'none',
                        '@keyframes pulse': {
                          '0%': {
                            transform: 'scale(1)',
                            boxShadow: '0 0 0 0 rgba(255, 0, 0, 0.4)'
                          },
                          '70%': {
                            transform: 'scale(1.1)',
                            boxShadow: '0 0 0 10px rgba(255, 0, 0, 0)'
                          },
                          '100%': {
                            transform: 'scale(1)',
                            boxShadow: '0 0 0 0 rgba(255, 0, 0, 0)'
                          }
                        }
                      }}
                    >
                      {isListening ? <MicOffIcon /> : <MicIcon />}
                    </IconButton>
                    <StyledSearchButton
                      onClick={handleSearch}
                      disabled={loading || !searchQuery.trim()}
                      $isLoading={loading}
                    >
                      <span className="button-text">{loading ? 'AI Searching...' : '🤖 AI Search'}</span>
                      {loading && (
                        <CircularProgress
                          size={28}
                          thickness={4}
                          sx={{
                            color: '#e74c3c',
                            position: 'absolute',
                            right: '12px',
                            filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.2))'
                          }}
                        />
                      )}
                    </StyledSearchButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        )}
        
        {/* Natural Language Search Helper */}
        {(activeTab === 'grants' || activeTab === 'profiles') && (
          <Fade in timeout={1000}>
            <Box sx={{
              maxWidth: '1200px',
              margin: '0 auto 20px',
              background: alpha('#f8f9fa', 0.8),
              padding: '15px 20px',
              borderRadius: '10px',
              border: `1px solid ${alpha('#e9ecef', 0.5)}`,
              fontSize: '0.9rem',
              color: '#495057',
              backdropFilter: 'blur(10px)',
            }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                💡 AI Search Examples:
              </Typography>
              <Typography variant="body2">
                {activeTab === 'grants' ? (
                  "I'm looking for grants in artificial intelligence and machine learning", "NSF funding for renewable energy research", "Grants for early career researchers in biology"
                ) : (
                  "Researchers working on climate change and sustainability", "Machine learning experts at top universities", "Professors specializing in renewable energy"
                )}
              </Typography>
            </Box>
          </Fade>
        )}
      </div>

      {error && (
        <div style={styles.errorMessage}>
          ❌ {error}
        </div>
      )}

      <div style={styles.resultsContainer}>
        {activeTab === 'overview' && (
          <ProfessorOverview
            currentUser={currentUser}
            onNavigateToSavedGrants={() => setActiveTab('saved')}
          />
        )}

        {activeTab === 'grants' && (
          <SearchResultsWrapper
            results={grants}
            resultType="grants"
            onSelectResult={handleGrantSelection}
            currentIndex={selectedGrantIndex}
            showList={showGrantList}
            onToggleList={() => setShowGrantList(!showGrantList)}
            isLoading={loading}
            query={searchQuery}
            showFooter={true}
          />
        )}

        {activeTab === 'profiles' && (
          <SearchResultsWrapper
            results={profiles}
            resultType="profiles"
            onSelectResult={handleProfileSelection}
            currentIndex={selectedProfileIndex}
            showList={showProfileList}
            onToggleList={() => setShowProfileList(!showProfileList)}
            isLoading={loading}
            query={searchQuery}
            showFooter={true}
          />
        )}


        {activeTab === 'saved' && (
          <SavedGrants
            onClose={() => setActiveTab('grants')}
          />
        )}

        {activeTab === 'forum' && (
          <Forum />
        )}
      </div>

      {/* Authentication Modal */}
      {showAuth && (
        <AuthComponent
          onAuthSuccess={handleAuthSuccess}
          onClose={() => setShowAuth(false)}
          isRequired={!isAuthenticated}
        />
      )}

      {/* Professor Get Started Dialog */}
      {showGetStarted && (
        <ProfessorGetStartedDialog
          open={showGetStarted}
          onClose={() => setShowGetStarted(false)}
          currentUser={currentUser}
          onProfileComplete={handleProfileComplete}
          isNewProfile={isNewProfile(currentUser)}
        />
      )}
    </div>
  );
}

export default App;
