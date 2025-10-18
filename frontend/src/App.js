import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = 'http://localhost:8000/api';

// Inline styles
const styles = {
  app: {
    minHeight: '100vh',
    padding: '20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  appHeader: {
    textAlign: 'center',
    color: 'white',
    marginBottom: '40px',
  },
  appTitle: {
    fontSize: '3rem',
    fontWeight: '700',
    marginBottom: '10px',
    textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
  },
  appSubtitle: {
    fontSize: '1.2rem',
    opacity: 0.9,
  },
  searchContainer: {
    maxWidth: '1200px',
    margin: '0 auto 40px',
    background: 'white',
    borderRadius: '20px',
    padding: '30px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
  },
  tabButtons: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
    justifyContent: 'center',
  },
  tabButton: {
    padding: '15px 30px',
    border: 'none',
    borderRadius: '50px',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    background: '#f8f9fa',
    color: '#6c757d',
  },
  tabButtonActive: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    transform: 'translateY(-2px)',
    boxShadow: '0 10px 20px rgba(102, 126, 234, 0.3)',
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
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
    background: '#f8d7da',
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
    color: 'white',
    textAlign: 'center',
    marginBottom: '30px',
    fontSize: '2rem',
    textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
  },
  noResults: {
    textAlign: 'center',
    color: 'white',
    fontSize: '1.2rem',
    opacity: 0.8,
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
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
    border: '1px solid #f0f0f0',
  },
  profileCard: {
    background: 'white',
    borderRadius: '15px',
    padding: '25px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
    border: '1px solid #f0f0f0',
  },
  cardTitle: {
    color: '#2c3e50',
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
    background: '#e3f2fd',
    color: '#1976d2',
  },
  closeDateTag: {
    background: '#fff3e0',
    color: '#f57c00',
  },
  grantAmounts: {
    marginBottom: '15px',
  },
  amountTag: {
    background: '#e8f5e8',
    color: '#2e7d32',
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
    background: '#f3e5f5',
    color: '#7b1fa2',
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
    background: '#e8f5e8',
    color: '#2e7d32',
    padding: '10px 15px',
    borderRadius: '10px',
    marginBottom: '15px',
    fontSize: '0.95rem',
  },
  profileContact: {
    color: '#667eea',
    fontWeight: '500',
    fontSize: '0.95rem',
  },
};

function App() {
  const [activeTab, setActiveTab] = useState('grants');
  const [grants, setGrants] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [agencyFilter, setAgencyFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  const searchGrants = async (sync = false) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (agencyFilter) params.append('agency_code', agencyFilter);
      params.append('limit', '20');
      if (sync) params.append('sync', 'true');
      
      const response = await fetch(`${API_BASE_URL}/grants/?${params}`);
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
      if (departmentFilter) params.append('department', departmentFilter);
      params.append('limit', '20');
      if (sync) params.append('sync', 'true');
      
      const response = await fetch(`${API_BASE_URL}/profiles/?${params}`);
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
    } else {
      searchProfiles();
    }
  };

  const handleSync = () => {
    if (activeTab === 'grants') {
      searchGrants(true);
    } else {
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
        <h1 style={styles.appTitle}>🕊️ Cardinal Concordia</h1>
        <p style={styles.appSubtitle}>AI-Powered Research Discovery Platform</p>
      </header>

      <div style={styles.searchContainer}>
        <div style={styles.tabButtons}>
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
        </div>

        <div style={styles.searchForm}>
          <input
            type="text"
            placeholder={activeTab === 'grants' ? 'Search grants by keyword...' : 'Search researchers by expertise...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            style={styles.searchInput}
          />
          
          {activeTab === 'grants' && (
            <select 
              value={agencyFilter} 
              onChange={(e) => setAgencyFilter(e.target.value)}
              style={styles.searchSelect}
            >
              <option value="">All Agencies</option>
              <option value="NSF">NSF</option>
              <option value="NIH">NIH</option>
              <option value="ED">Department of Education</option>
              <option value="DOE">Department of Energy</option>
            </select>
          )}
          
          {activeTab === 'profiles' && (
            <select 
              value={departmentFilter} 
              onChange={(e) => setDepartmentFilter(e.target.value)}
              style={styles.searchSelect}
            >
              <option value="">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Engineering">Engineering</option>
              <option value="Physics">Physics</option>
              <option value="Mathematics">Mathematics</option>
            </select>
          )}
          
          <button 
            onClick={handleSearch} 
            disabled={loading}
            style={loading ? {...styles.searchButton, ...styles.searchButtonDisabled} : styles.searchButton}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
          
          <button 
            onClick={handleSync} 
            disabled={loading}
            style={loading ? {...styles.searchButton, ...styles.searchButtonDisabled} : {...styles.searchButton, background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'}}
          >
            {loading ? 'Syncing...' : '🔄 Sync from IgniteHub'}
          </button>
        </div>
      </div>

      {error && (
        <div style={styles.errorMessage}>
          ❌ {error}
        </div>
      )}

      <div style={styles.resultsContainer}>
        {activeTab === 'grants' && (
          <div>
            <h2 style={styles.resultsTitle}>Grant Opportunities ({grants.length})</h2>
            {grants.length === 0 && !loading && (
              <p style={styles.noResults}>No grants found. Try adjusting your search criteria.</p>
            )}
            <div style={styles.grantsGrid}>
              {grants.map((grant) => (
                <div key={grant.id} style={styles.grantCard}>
                  <h3 style={styles.cardTitle}>{grant.title}</h3>
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
                  <h3 style={styles.cardTitle}>{profile.name}</h3>
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
      </div>
    </div>
  );
}

export default App;
