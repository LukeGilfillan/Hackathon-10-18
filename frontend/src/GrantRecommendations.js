import React, { useState, useEffect, useCallback } from 'react';
import RecommendationsListWrapper from './RecommendationsListWrapper';
import SavedGrantsSummary from './SavedGrantsSummary';

const API_BASE_URL = 'http://localhost:8000/api';

const GrantRecommendations = ({ currentUser, onError }) => {
  console.log('GrantRecommendations component rendering with currentUser:', currentUser?.email);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showList, setShowList] = useState(true);

  const fetchRecommendations = useCallback(async () => {
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
          'Authorization': `Token ${sessionToken}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch recommendations');
      }
      
      const data = await response.json();
      console.log('Raw recommendations data:', data);
      console.log('Number of recommendations:', data.results?.length || 0);
      setRecommendations(data.results || []);
    } catch (err) {
      setError(err.message);
      if (onError) onError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser, onError]);

  useEffect(() => {
    console.log('useEffect triggered with currentUser:', currentUser?.email);
    if (currentUser?.professor_profile) {
      console.log('Fetching recommendations for user:', currentUser.email);
      fetchRecommendations();
    } else if (currentUser === null) {
      setError('Please sign in to get personalized recommendations');
    } else if (currentUser && !currentUser.professor_profile) {
      setError('Please complete your professor profile to get recommendations');
    }
  }, [currentUser, fetchRecommendations]);


  const handleSelectOpportunity = (opportunity, index) => {
    setSelectedIndex(index);
    // You can add additional logic here for when an opportunity is selected
    console.log('Selected opportunity:', opportunity);
  };

  const handleToggleList = () => {
    setShowList(!showList);
  };



  // Transform recommendations data to match the expected format
  console.log('Transforming recommendations:', recommendations.length, 'recommendations');
  const transformedOpportunities = recommendations.map((recommendation) => ({
    // Basic information
    id: recommendation.grant.id,
    title: recommendation.grant.title,
    opportunity_id: recommendation.grant.opportunity_id,
    opportunity_number: recommendation.grant.opportunity_number,
    description: recommendation.grant.description,
    
    // Agency information
    agency_code: recommendation.grant.agency_code,
    agency_name: recommendation.grant.agency_name,
    
    // Financial information
    award_floor: recommendation.grant.award_floor,
    award_ceiling: recommendation.grant.award_ceiling,
    estimated_total_program_funding: recommendation.grant.estimated_total_program_funding,
    expected_number_of_awards: recommendation.grant.expected_number_of_awards,
    
    // Dates and deadlines
    post_date: recommendation.grant.post_date,
    close_date: recommendation.grant.close_date,
    close_date_explanation: recommendation.grant.close_date_explanation,
    last_updated_date: recommendation.grant.last_updated_date,
    archive_date: recommendation.grant.archive_date,
    
    // Categorization
    opportunity_category: recommendation.grant.opportunity_category,
    opportunity_category_explanation: recommendation.grant.opportunity_category_explanation,
    funding_instrument_type: recommendation.grant.funding_instrument_type,
    category_of_funding_activity: recommendation.grant.category_of_funding_activity,
    category_explanation: recommendation.grant.category_explanation,
    cfda_numbers: recommendation.grant.cfda_numbers,
    
    // Eligibility and requirements
    eligible_applicants: recommendation.grant.eligible_applicants,
    additional_information_on_eligibility: recommendation.grant.additional_information_on_eligibility,
    cost_sharing_or_matching_requirement: recommendation.grant.cost_sharing_or_matching_requirement,
    
    // Additional information
    additional_information_text: recommendation.grant.additional_information_text,
    additional_information_url: recommendation.grant.additional_information_url,
    grantor_contact_text: recommendation.grant.grantor_contact_text,
    grantor_contact_email: recommendation.grant.grantor_contact_email,
    grantor_contact_email_description: recommendation.grant.grantor_contact_email_description,
    grantor_contact_name: recommendation.grant.grantor_contact_name,
    grantor_contact_phone_number: recommendation.grant.grantor_contact_phone_number,
    version: recommendation.grant.version,
    
    // Catholic Social Teaching Compliance
    catholic_social_teaching_compliance: recommendation.grant.catholic_social_teaching_compliance,
    catholic_social_teaching_notes: recommendation.grant.catholic_social_teaching_notes,
    catholic_social_teaching_reviewed_at: recommendation.grant.catholic_social_teaching_reviewed_at,
    
    // Metadata
    created_at: recommendation.grant.created_at,
    updated_at: recommendation.grant.updated_at,
    is_closed: recommendation.grant.is_closed,
    days_until_close: recommendation.grant.days_until_close,
    
    // Recommendation specific data
    recommendation_score: recommendation.recommendation_score,
    is_saved: recommendation.is_saved,
    is_dismissed: recommendation.is_dismissed,
    is_applied: recommendation.is_applied,
  }));
  
  console.log('Transformed opportunities:', transformedOpportunities.length, 'opportunities');
  console.log('First opportunity title:', transformedOpportunities[0]?.title);

  if (loading) {
    return (
      <RecommendationsListWrapper
        opportunities={[]}
        isLoading={true}
        showList={true}
      />
    );
  }

  if (error) {
    return (
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
    );
  }

  if (recommendations.length === 0) {
    return (
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
    );
  }

  return (
    <div>
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
      
      <SavedGrantsSummary 
        onNavigateToSavedGrants={() => {
          // Navigate to saved grants tab
          window.location.hash = '#saved';
        }}
      />
      
      <RecommendationsListWrapper
        opportunities={transformedOpportunities}
        onSelectOpportunity={handleSelectOpportunity}
        currentIndex={selectedIndex}
        showList={showList}
        onToggleList={handleToggleList}
        isLoading={loading}
      />
    </div>
  );
};

export default GrantRecommendations;