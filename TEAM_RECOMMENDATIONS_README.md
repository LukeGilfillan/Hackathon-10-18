# Team Recommendations API

This document describes the new Team Recommendations feature that combines grant opportunities with professor teams and generates collaboration pitches.

## Overview

The Team Recommendations system finds grant opportunities and suggests collections of professors that would work well together, then generates AI-powered collaboration pitches explaining how the team would approach the grant.

## API Endpoints

### 1. Get Team Recommendations

**Endpoint:** `GET /api/team-recommendations/`

**Description:** Get team-based grant recommendations with collaboration pitches.

**Parameters:**
- `q` (optional): Search query for grants
- `grant_id` (optional): Specific grant ID to focus on
- `team_size` (optional): Number of professors per team (2-6, default: 3)
- `limit` (optional): Maximum number of recommendations (default: 10, max: 20)
- `include_diversity` (optional): Ensure team diversity (default: true)

**Example Request:**
```
GET /api/team-recommendations/?q=artificial intelligence&team_size=4&limit=5
```

**Example Response:**
```json
{
  "team_recommendations": [
    {
      "grant": {
        "id": 123,
        "title": "NSF AI Research Grant",
        "description": "Funding for AI research...",
        "agency_name": "National Science Foundation",
        "award_ceiling": 500000.00,
        "close_date": "2024-12-31"
      },
      "team": [
        {
          "id": 1,
          "name": "Dr. Jane Smith",
          "email": "jane.smith@university.edu",
          "department": "Computer Science",
          "research_areas": ["Machine Learning", "AI"],
          "expertise_keywords": ["Deep Learning", "Neural Networks"]
        },
        {
          "id": 2,
          "name": "Dr. John Doe",
          "email": "john.doe@university.edu",
          "department": "Mathematics",
          "research_areas": ["Statistics", "Data Science"],
          "expertise_keywords": ["Statistical Modeling", "Optimization"]
        }
      ],
      "team_size": 3,
      "collaboration_pitch": "Our interdisciplinary team brings together expertise in Machine Learning, AI, and Statistics...",
      "team_synergy_score": 85.5,
      "grant_team_fit_score": 92.3,
      "overall_score": 89.4,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 1,
  "parameters": {
    "query": "artificial intelligence",
    "grant_id": null,
    "team_size": 4,
    "include_diversity": true
  },
  "message": "Found 1 team recommendations"
}
```

### 2. Get Team Suggestions for Specific Grant

**Endpoint:** `GET /api/grants/{grant_id}/team-suggestions/`

**Description:** Get team suggestions for a specific grant opportunity.

**Parameters:**
- `team_size` (optional): Number of professors per team (2-6, default: 3)
- `limit` (optional): Maximum number of suggestions (default: 5)
- `include_diversity` (optional): Ensure team diversity (default: true)

**Example Request:**
```
GET /api/grants/123/team-suggestions/?team_size=3&limit=3
```

### 3. Generate Custom Team Pitch

**Endpoint:** `POST /api/team-pitch/generate/`

**Description:** Generate a custom collaboration pitch for a specific grant and team.

**Request Body:**
```json
{
  "grant_id": 123,
  "professor_emails": [
    "jane.smith@university.edu",
    "john.doe@university.edu",
    "alice.johnson@university.edu"
  ],
  "custom_message": "Optional custom message to include in the pitch"
}
```

**Example Response:**
```json
{
  "grant": {
    "id": 123,
    "title": "NSF AI Research Grant",
    "description": "Funding for AI research...",
    "agency_name": "National Science Foundation"
  },
  "team": [
    {
      "id": 1,
      "name": "Dr. Jane Smith",
      "email": "jane.smith@university.edu",
      "department": "Computer Science"
    }
  ],
  "collaboration_pitch": "Our interdisciplinary team brings together expertise...",
  "team_synergy_score": 85.5,
  "grant_team_fit_score": 92.3,
  "message": "Custom team pitch generated successfully"
}
```

## How It Works

### 1. Grant Selection
- If a specific `grant_id` is provided, that grant is used
- If a search query is provided, grants matching the query are found
- If neither is provided, recent active grants are selected

### 2. Professor Matching
- All active professors are scored based on their fit with the grant
- Scoring considers:
  - Research area alignment
  - Expertise keyword matching
  - Department/field alignment
  - Agency preferences
  - Award amount preferences

### 3. Team Formation
- Teams are formed with diversity considerations:
  - Department diversity
  - School diversity
  - University diversity
  - Research area complementarity
- Multiple teams are generated when possible

### 4. Scoring System
- **Team Synergy Score**: How well team members work together (0-100)
- **Grant-Team Fit Score**: How well the team fits the grant (0-100)
- **Overall Score**: Weighted combination (40% synergy + 60% fit)

### 5. Pitch Generation
- AI-powered pitch generation using Gemini API (if available)
- Fallback to template-based pitches
- Includes:
  - Team composition and expertise
  - Grant alignment explanation
  - Collaboration benefits
  - Research approach

## Features

### Diversity Considerations
- Ensures teams have diverse departments, schools, and universities
- Balances expertise areas for comprehensive coverage
- Promotes interdisciplinary collaboration

### AI Integration
- Uses Google Gemini API for intelligent pitch generation
- Fallback to template-based pitches when AI is unavailable
- Context-aware content generation

### Scoring Algorithm
- Multi-factor scoring system
- Considers both individual fit and team synergy
- Weighted scoring for optimal recommendations

### Flexible Parameters
- Configurable team sizes (2-6 professors)
- Adjustable diversity requirements
- Customizable result limits

## Use Cases

1. **Grant Discovery**: Find grants that match your research interests and get team suggestions
2. **Team Building**: Identify potential collaborators for specific grant opportunities
3. **Proposal Development**: Generate compelling collaboration pitches for grant applications
4. **Research Planning**: Explore interdisciplinary research opportunities

## Error Handling

The API includes comprehensive error handling for:
- Invalid parameters
- Missing grants or professors
- AI service unavailability
- Database connection issues

All errors return appropriate HTTP status codes and descriptive error messages.

## Performance Considerations

- Results are limited to prevent performance issues
- Team generation is optimized for reasonable response times
- AI pitch generation may take longer but includes fallbacks
- Database queries are optimized with proper indexing
