import React from 'react';
import {
  Box
} from '@mui/material';
import GrantRecommendations from './GrantRecommendations';

const ProfessorOverview = ({ currentUser, onNavigateToSavedGrants }) => {


  return (
    <Box sx={{ p: 3 }}>
      {/* AI Recommendations Section */}
      <Box mt={4}>
        <GrantRecommendations
          currentUser={currentUser}
          onError={(error) => console.error('Recommendations error:', error)}
        />
      </Box>
    </Box>
  );
};

export default ProfessorOverview;
