# Team Recommendations Frontend Component

This document describes the frontend implementation of the Team Recommendations feature.

## Overview

The `TeamRecommendations` component provides a user-friendly interface for discovering grant opportunities with AI-suggested professor teams and collaboration pitches.

## Component Features

### 🎯 **Core Functionality**
- **Automatic Grant Discovery**: AI automatically finds grant opportunities
- **Team Configuration**: Adjustable team size (2-6 members) and diversity settings
- **AI-Powered Matching**: Displays team recommendations with collaboration pitches
- **Interactive Cards**: Expandable cards showing detailed team information and pitches

### 🎨 **UI Components**

#### Team Configuration
- **Team Size Selector**: Dropdown to choose team size (2-6 members)
- **Diversity Toggle**: Option to include/exclude diversity considerations
- **Find Teams Button**: Triggers AI to find grant-team matches
- **Results Counter**: Shows number of recommendations found

#### Team Recommendation Cards
- **Grant Information**: Title, agency, funding amount, deadline
- **Overall Score**: Visual score indicator with color coding
- **Team Composition**: Individual professor cards with:
  - Name and role (PI/Co-Investigator)
  - Department and university
  - Research areas (with overflow handling)
  - Avatar with initials
- **Team Metrics**: Synergy and grant-fit scores
- **Collaboration Pitch**: Expandable AI-generated pitch
- **Action Buttons**: Save recommendation and view grant details

### 🎨 **Design Features**

#### Visual Design
- **Gradient Backgrounds**: Modern gradient styling throughout
- **Glass Morphism**: Backdrop blur effects for modern look
- **Card Animations**: Hover effects and smooth transitions
- **Color-Coded Scores**: Green (excellent), orange (good), red (fair)
- **Responsive Layout**: Works on desktop and mobile devices

#### Typography and Icons
- **Material-UI Icons**: Consistent iconography
- **Hierarchical Typography**: Clear information hierarchy
- **Emoji Integration**: Fun emojis for visual appeal
- **Status Indicators**: Visual feedback for different states

### 🔧 **Technical Implementation**

#### State Management
```javascript
const [teamRecommendations, setTeamRecommendations] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
const [searchQuery, setSearchQuery] = useState('');
const [teamSize, setTeamSize] = useState(3);
const [includeDiversity, setIncludeDiversity] = useState(true);
const [expandedCards, setExpandedCards] = useState({});
```

#### API Integration
- **Endpoint**: `/api/team-recommendations/`
- **Parameters**: Query, team size, diversity settings, limit
- **Error Handling**: Comprehensive error states and retry functionality
- **Loading States**: Visual feedback during API calls

#### Styled Components
- **StyledCard**: Custom card styling with hover effects
- **StyledSearchBox**: Search container with gradient background
- **StyledSearchButton**: Animated search button with loading states

### 📱 **User Experience**

#### Discovery Flow
1. **Configure Team**: Select team size and diversity preferences
2. **Find Matches**: Click button to trigger AI grant-team matching
3. **AI Processing**: System automatically finds grants and generates teams
4. **View Results**: Browse team recommendations with scores
5. **Explore Details**: Expand cards to see collaboration pitches
6. **Take Action**: Save recommendations or view grant details

#### Interactive Elements
- **Expandable Cards**: Click to show/hide collaboration pitches
- **Hover Effects**: Visual feedback on interactive elements
- **Loading Animations**: Smooth loading states
- **Error Recovery**: Retry buttons for failed requests

### 🎯 **Key Features**

#### Team Display
- **Role Assignment**: Principal Investigator and Co-Investigators
- **Diversity Indicators**: Visual representation of team diversity
- **Expertise Tags**: Research areas with overflow handling
- **Institution Info**: Department and university display

#### Scoring System
- **Overall Score**: Combined team synergy and grant fit
- **Individual Metrics**: Separate synergy and fit scores
- **Color Coding**: Visual score representation
- **Score Labels**: "Excellent", "Good", "Fair" labels

#### Collaboration Pitches
- **AI-Generated**: Intelligent pitch creation
- **Expandable**: Click to show/hide full pitch
- **Formatted Text**: Proper line breaks and formatting
- **Contextual**: Specific to grant and team combination

### 🔄 **Integration**

#### App.js Integration
- **New Tab**: Added "🤝 Team Recommendations" tab
- **Navigation**: Seamless integration with existing tabs
- **State Management**: Uses existing user authentication
- **Error Handling**: Integrates with app-level error handling

#### Props Interface
```javascript
<TeamRecommendations
  currentUser={currentUser}
  onError={setError}
/>
```

### 🎨 **Styling**

#### Theme Integration
- **Material-UI Theme**: Uses app's theme system
- **Color Palette**: Consistent with app's color scheme
- **Typography**: Matches app's typography scale
- **Spacing**: Consistent spacing with app layout

#### Responsive Design
- **Mobile-First**: Optimized for mobile devices
- **Flexible Layout**: Adapts to different screen sizes
- **Touch-Friendly**: Large touch targets for mobile
- **Readable Text**: Appropriate font sizes for all devices

### 🚀 **Performance**

#### Optimization
- **Lazy Loading**: Components load as needed
- **Memoization**: Prevents unnecessary re-renders
- **Efficient API Calls**: Optimized request parameters
- **Smooth Animations**: Hardware-accelerated transitions

#### Error Handling
- **Network Errors**: Graceful handling of API failures
- **Empty States**: Helpful messages when no results found
- **Retry Logic**: Easy retry functionality
- **User Feedback**: Clear error messages and recovery options

## Usage

### Basic Usage
```javascript
import TeamRecommendations from './TeamRecommendations';

function App() {
  return (
    <TeamRecommendations
      currentUser={currentUser}
      onError={(error) => console.error(error)}
    />
  );
}
```

### Navigation
The component is accessible via the "🤝 Team Recommendations" tab in the main navigation.

### How It Works
The system automatically:
- Finds recent active grant opportunities
- Matches them with suitable professor teams
- Generates collaboration pitches
- Ranks results by team synergy and grant fit

## Future Enhancements

### Planned Features
- **Team Customization**: Allow users to modify suggested teams
- **Collaboration Tools**: Direct messaging between team members
- **Proposal Templates**: Generate proposal outlines
- **Progress Tracking**: Track team formation progress
- **Notifications**: Alerts for new matching opportunities

### Technical Improvements
- **Caching**: Cache API responses for better performance
- **Offline Support**: Basic offline functionality
- **Advanced Filters**: More granular filtering options
- **Export Features**: Export team recommendations
- **Analytics**: Track user interaction patterns
