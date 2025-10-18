import React, { useState, useEffect } from 'react';
import './App.css';
import AuthComponent from './AuthComponent';
import ProfessorGetStartedDialog from './ProfessorGetStartedDialog';
import SavedGrants from './SavedGrants';
import ProfessorOverview from './ProfessorOverview';

const API_BASE_URL = 'http://localhost:8000/api';

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
  const [useNaturalLanguage, setUseNaturalLanguage] = useState(true);
  
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

  const searchGrants = async (sync = false) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      params.append('limit', '20');
      if (sync) params.append('sync', 'true');
      
      // Use natural language search only when there's a search query
      // Otherwise use the regular search endpoint for initial loading
      const endpoint = searchQuery 
        ? `${API_BASE_URL}/search/grants/nlp/`
        : `${API_BASE_URL}/grants/`;
      
      const response = await fetch(`${endpoint}?${params}`);
      if (!response.ok) throw new Error('Failed to fetch grants');
      
      const data = await response.json();
      setGrants(data.grants || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const searchProfiles = async (sync = false) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      params.append('limit', '20');
      if (sync) params.append('sync', 'true');
      
      // Use natural language search only when there's a search query
      // Otherwise use the regular search endpoint for initial loading
      const endpoint = searchQuery 
        ? `${API_BASE_URL}/search/profiles/nlp/`
        : `${API_BASE_URL}/profiles/`;
      
      const response = await fetch(`${endpoint}?${params}`);
      if (!response.ok) throw new Error('Failed to fetch profiles');
      
      const data = await response.json();
      setProfiles(data.profiles || []);
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

  const handleSync = () => {
    if (activeTab === 'grants') {
      searchGrants(true);
    } else if (activeTab === 'profiles') {
      searchProfiles(true);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
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
        </div>

        <div style={styles.searchForm}>
          <input
            type="text"
            placeholder={activeTab === 'overview' ? 'Welcome to your grant application dashboard...' : activeTab === 'grants' ? 'Ask about grants in natural language...' : activeTab === 'profiles' ? 'Ask about researchers in natural language...' : activeTab === 'saved' ? 'Manage your saved grants and collaborations...' : 'Search...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            style={styles.searchInput}
          />
          
          
          
          
          <button 
            onClick={handleSearch} 
            disabled={loading}
            style={loading ? {...styles.searchButton, ...styles.searchButtonDisabled} : styles.searchButton}
          >
            {loading ? 'AI Searching...' : '🤖 AI Search'}
          </button>
          
          <button 
            onClick={handleSync} 
            disabled={loading}
            style={loading ? {...styles.searchButton, ...styles.searchButtonDisabled} : {...styles.searchButton, background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)'}}
          >
            {loading ? 'Syncing...' : '🔄 Sync from IgniteHub'}
          </button>
        </div>
        
        {/* Natural Language Search Helper */}
        {(activeTab === 'grants' || activeTab === 'profiles') && (
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto 20px',
            background: '#f8f9fa',
            padding: '15px 20px',
            borderRadius: '10px',
            border: '1px solid #e9ecef',
            fontSize: '0.9rem',
            color: '#495057',
          }}>
            <strong>💡 AI Search Examples:</strong>
            {activeTab === 'grants' ? (
              <span> "I'm looking for grants in artificial intelligence and machine learning", "NSF funding for renewable energy research", "Grants for early career researchers in biology"</span>
            ) : (
              <span> "Researchers working on climate change and sustainability", "Machine learning experts at top universities", "Professors specializing in renewable energy"</span>
            )}
          </div>
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
          <div>
            <h2 style={styles.resultsTitle}>Grant Opportunities ({grants.length})</h2>
            {grants.length === 0 && !loading && (
              <p style={styles.noResults}>No grants found. Try adjusting your search criteria.</p>
            )}
            <div style={styles.grantsGrid}>
              {grants.map((grant) => (
                <div key={grant.id} style={styles.grantCard}>
                  {grant.relevance_score && (
                    <div style={{
                      position: 'absolute',
                      top: '15px',
                      right: '15px',
                      background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                      color: 'white',
                      padding: '5px 12px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                    }}>
                      {Math.round(grant.relevance_score * 100)}% match
                    </div>
                  )}
                  <h3 style={{
                    ...styles.cardTitle,
                    paddingRight: grant.relevance_score ? '80px' : '0px'
                  }}>{grant.title}</h3>
                  <div style={styles.grantMeta}>
                    <span style={{...styles.metaTag, ...styles.agencyTag}}>{grant.agency_name}</span>
                    <span style={{...styles.metaTag, ...styles.closeDateTag}}>Closes: {formatDate(grant.close_date)}</span>
                  </div>
                  <div style={styles.grantAmounts}>
                    <span style={styles.amountTag}>Amount: {formatCurrency(grant.award_floor)} - {formatCurrency(grant.award_ceiling)}</span>
                  </div>
                  <p style={styles.grantDescription}>
                    {grant.description ? grant.description.substring(0, 200) + '...' : 'No description available'}
                  </p>
                  <div style={styles.grantCategory}>
                    Category: {grant.category_of_funding_activity || 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'profiles' && (
          <div>
            <h2 style={styles.resultsTitle}>Researcher Profiles ({profiles.length})</h2>
            {profiles.length === 0 && !loading && (
              <p style={styles.noResults}>No researchers found. Try adjusting your search criteria.</p>
            )}
            <div style={styles.profilesGrid}>
              {profiles.map((profile) => (
                <div key={profile.email} style={styles.profileCard}>
                  {profile.relevance_score && (
                    <div style={{
                      position: 'absolute',
                      top: '15px',
                      right: '15px',
                      background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                      color: 'white',
                      padding: '5px 12px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                    }}>
                      {Math.round(profile.relevance_score * 100)}% match
                    </div>
                  )}
                  <h3 style={{
                    ...styles.cardTitle,
                    paddingRight: profile.relevance_score ? '80px' : '0px'
                  }}>{profile.name}</h3>
                  <div style={styles.profileMeta}>
                    <span style={styles.metaTag}>{profile.position}</span>
                    <span style={styles.metaTag}>{profile.department}</span>
                  </div>
                  <div style={styles.profileSchool}>
                    {profile.school}
                  </div>
                  {profile.expertise && profile.expertise.length > 0 && (
                    <div style={styles.profileExpertise}>
                      <strong>Expertise:</strong> {profile.expertise.join(', ')}
                    </div>
                  )}
                  <div style={styles.profileContact}>
                    📧 {profile.email}
                  </div>
                  {profile.bio && (
                    <p style={styles.profileBio}>
                      {profile.bio.substring(0, 150) + '...'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}


        {activeTab === 'saved' && (
          <SavedGrants
            onClose={() => setActiveTab('grants')}
          />
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
