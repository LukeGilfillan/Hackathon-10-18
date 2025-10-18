import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import RecommendationsListWrapper from './RecommendationsListWrapper';

const API_BASE_URL = 'http://localhost:8000/api';

const GrantRecommendations = ({ currentUser, onError }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showList, setShowList] = useState(true);

  const fetchRecommendations = async () => {
    if (!currentUser) {
      setError('Please sign in to get personalized recommendations');
      return;
    }
    
    if (!currentUser?.professor_profile) {
      setError('Please complete your professor profile to get recommendations');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const sessionToken = localStorage.getItem('session_token');
      const response = await fetch(`${API_BASE_URL}/professors/recommendations/?email=${currentUser.email}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch recommendations');
      }
      
      const data = await response.json();
      setRecommendations(data.results || []);
    } catch (err) {
      setError(err.message);
      if (onError) onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.professor_profile) {
      fetchRecommendations();
    } else if (currentUser === null) {
      setError('Please sign in to get personalized recommendations');
    } else if (currentUser && !currentUser.professor_profile) {
      setError('Please complete your professor profile to get recommendations');
    }
  }, [currentUser]);

  const handleRecommendationAction = async (recommendation, action) => {
    try {
      const sessionToken = localStorage.getItem('session_token');
      const response = await fetch(`${API_BASE_URL}/professors/recommendations/interaction/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          professor_email: currentUser.email,
          grant_id: recommendation.grant.id,
          interaction_type: action
        }),
      });

      if (response.ok) {
        // Update local state
        setRecommendations(prev => 
          prev.map(rec => 
            rec.id === recommendation.id 
              ? { ...rec, [`is_${action}`]: true, [`${action}_at`]: new Date().toISOString() }
              : rec
          )
        );
      }
    } catch (err) {
      console.error(`Error updating ${action}:`, err);
    }
  };

  const handleSelectOpportunity = (opportunity, index) => {
    setSelectedIndex(index);
    // You can add additional logic here for when an opportunity is selected
    console.log('Selected opportunity:', opportunity);
  };

  const handleToggleList = () => {
    setShowList(!showList);
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


  // Transform recommendations data to match the expected format
  const transformedOpportunities = recommendations.map((recommendation) => ({
    id: recommendation.id,
    title: recommendation.grant.title,
    description: recommendation.grant.description,
    ai_two_sentence_overview: recommendation.grant.description?.substring(0, 200) + '...',
    organizationName: recommendation.grant.agency_name,
    awardAmount: recommendation.grant.award_floor,
    awardCeiling: recommendation.grant.award_ceiling,
    ai_estimated_total_award: {
      amount: formatCurrency(recommendation.grant.award_floor)
    },
    responseDeadline: recommendation.grant.close_date,
    active: true,
    source: 'grants.gov',
    type: recommendation.grant.category_of_funding_activity,
    setAside: 'None',
    naicsCode: recommendation.grant.naics_code,
    popCity: recommendation.grant.pop_city,
    popState: recommendation.grant.pop_state,
    contactEmail: recommendation.grant.contact_email,
    contactPhone: recommendation.grant.contact_phone,
    contactPhoneNumber: recommendation.grant.contact_phone_number,
    recommendation_score: recommendation.recommendation_score,
    is_saved: recommendation.is_saved,
    is_dismissed: recommendation.is_dismissed,
    is_applied: recommendation.is_applied,
  }));

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <RecommendationsListWrapper
          opportunities={[]}
          isLoading={true}
          showList={true}
        />
      </ThemeProvider>
    );
  }

  if (error) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
            border: '1px solid #f5c6cb',
            borderRadius: '10px',
            color: '#721c24',
            padding: '20px',
            marginBottom: '20px',
          }}>
            ❌ {error}
          </div>
          <button 
            onClick={fetchRecommendations}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '25px',
              background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            🔄 Try Again
          </button>
        </div>
      </ThemeProvider>
    );
  }

  if (recommendations.length === 0) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🎯</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '10px', color: '#212529' }}>
            No Recommendations Yet
          </div>
          <div style={{ fontSize: '1rem', lineHeight: '1.5', color: '#6c757d', marginBottom: '20px' }}>
            We're working on finding the perfect grants for you!<br />
            Make sure your professor profile is complete with research areas and preferences.
          </div>
          <button 
            onClick={fetchRecommendations}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '25px',
              background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            🔄 Refresh Recommendations
          </button>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <button 
          onClick={fetchRecommendations}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderRadius: '25px',
            background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
            color: 'white',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            marginBottom: '20px',
          }}
        >
          🔄 Refresh Recommendations
        </button>
      </div>
      
      <RecommendationsListWrapper
        opportunities={transformedOpportunities}
        onSelectOpportunity={handleSelectOpportunity}
        currentIndex={selectedIndex}
        showList={showList}
        onToggleList={handleToggleList}
        isLoading={loading}
      />
    </ThemeProvider>
  );
};

export default GrantRecommendations;