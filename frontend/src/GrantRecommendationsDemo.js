import React, { useState } from 'react';
import GrantRecommendations from './GrantRecommendations';

// Mock data for demonstration
const mockGrants = [
  {
    id: 1,
    title: "Advanced Machine Learning for Healthcare Applications",
    agency_name: "National Science Foundation",
    description: "This grant supports research in developing advanced machine learning algorithms specifically designed for healthcare applications, including medical imaging, drug discovery, and patient care optimization.",
    award_floor: 500000,
    award_ceiling: 2000000,
    close_date: "2024-12-15",
    category_of_funding_activity: "Science and Technology"
  },
  {
    id: 2,
    title: "Sustainable Energy Solutions for Rural Communities",
    agency_name: "Department of Energy",
    description: "Research funding for developing sustainable energy solutions that can be implemented in rural and underserved communities, focusing on renewable energy technologies and energy storage systems.",
    award_floor: 750000,
    award_ceiling: 3000000,
    close_date: "2024-11-30",
    category_of_funding_activity: "Energy and Environment"
  },
  {
    id: 3,
    title: "Cybersecurity Research for Critical Infrastructure",
    agency_name: "Department of Homeland Security",
    description: "Funding for research into cybersecurity measures and technologies to protect critical infrastructure from cyber threats, including power grids, transportation systems, and communication networks.",
    award_floor: 1000000,
    award_ceiling: 5000000,
    close_date: "2024-10-20",
    category_of_funding_activity: "Security and Defense"
  },
  {
    id: 4,
    title: "Educational Technology Innovation",
    agency_name: "Department of Education",
    description: "Support for developing innovative educational technologies that can improve learning outcomes, particularly for students with disabilities and those in underserved communities.",
    award_floor: 300000,
    award_ceiling: 1500000,
    close_date: "2024-09-15",
    category_of_funding_activity: "Education and Training"
  },
  {
    id: 5,
    title: "Climate Change Adaptation Research",
    agency_name: "Environmental Protection Agency",
    description: "Research funding for developing strategies and technologies to help communities adapt to climate change, including flood management, drought resistance, and sustainable agriculture.",
    award_floor: 400000,
    award_ceiling: 1800000,
    close_date: "2024-08-10",
    category_of_funding_activity: "Environment and Climate"
  }
];

const GrantRecommendationsDemo = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showList, setShowList] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectGrant = (grant, index) => {
    console.log('Selected grant:', grant);
    setSelectedIndex(index);
  };

  const handleToggleList = () => {
    setShowList(!showList);
  };

  const handleLoadMore = () => {
    console.log('Load more clicked');
    // In a real app, this would fetch more data
  };

  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
        Grant Recommendations Component Demo
      </h1>
      
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <button 
          onClick={simulateLoading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Simulate Loading
        </button>
        <button 
          onClick={() => setShowList(!showList)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Toggle List
        </button>
      </div>

      <GrantRecommendations
        grants={mockGrants}
        onSelectGrant={handleSelectGrant}
        currentIndex={selectedIndex}
        showList={showList}
        onToggleList={handleToggleList}
        isLoading={isLoading}
        showFooter={true}
        onLoadMore={handleLoadMore}
        hasMore={false}
      />

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: 'white', borderRadius: '8px' }}>
        <h3>Selected Grant Information:</h3>
        {mockGrants[selectedIndex] && (
          <div>
            <p><strong>Title:</strong> {mockGrants[selectedIndex].title}</p>
            <p><strong>Agency:</strong> {mockGrants[selectedIndex].agency_name}</p>
            <p><strong>Amount:</strong> ${mockGrants[selectedIndex].award_floor?.toLocaleString()} - ${mockGrants[selectedIndex].award_ceiling?.toLocaleString()}</p>
            <p><strong>Deadline:</strong> {new Date(mockGrants[selectedIndex].close_date).toLocaleDateString()}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GrantRecommendationsDemo;
