import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import RecommendationsListWrapper from './RecommendationsListWrapper';

// Test data
const testOpportunities = [
  {
    id: 1,
    title: "Test Grant Opportunity 1",
    description: "This is a test grant opportunity for research in computer science.",
    ai_two_sentence_overview: "This grant supports innovative research in artificial intelligence and machine learning applications.",
    organizationName: "National Science Foundation",
    awardAmount: 500000,
    ai_estimated_total_award: {
      amount: "$500,000"
    },
    responseDeadline: "2024-12-31",
    active: true,
    source: "nsf",
    type: "Research",
    setAside: "None",
    naicsCode: "541511",
    popCity: "Washington",
    popState: "DC",
    contactEmail: "contact@nsf.gov",
    contactPhone: "(703) 292-5111",
  },
  {
    id: 2,
    title: "Test Grant Opportunity 2",
    description: "Another test grant opportunity for biomedical research.",
    ai_two_sentence_overview: "This grant focuses on biomedical research and healthcare innovation.",
    organizationName: "National Institutes of Health",
    awardAmount: 750000,
    ai_estimated_total_award: {
      amount: "$750,000"
    },
    responseDeadline: "2024-11-15",
    active: true,
    source: "nih",
    type: "Biomedical Research",
    setAside: "Small Business",
    naicsCode: "541711",
    popCity: "Bethesda",
    popState: "MD",
    contactEmail: "grants@nih.gov",
    contactPhone: "(301) 496-3405",
  }
];

const TestComponent = () => {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [showList, setShowList] = React.useState(true);

  const handleSelectOpportunity = (opportunity, index) => {
    setSelectedIndex(index);
    console.log('Selected opportunity:', opportunity);
  };

  const handleToggleList = () => {
    setShowList(!showList);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ padding: '20px' }}>
        <h1>Test Component</h1>
        <RecommendationsListWrapper
          opportunities={testOpportunities}
          onSelectOpportunity={handleSelectOpportunity}
          currentIndex={selectedIndex}
          showList={showList}
          onToggleList={handleToggleList}
          isLoading={false}
        />
      </div>
    </ThemeProvider>
  );
};

export default TestComponent;
