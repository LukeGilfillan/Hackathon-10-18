# Professor-Grant Matching System

A comprehensive recommendation system that matches professors with relevant grant opportunities using content similarity analysis, preference matching, and LLM-based relevance scoring.

## Features

### 🎯 Intelligent Matching
- **Content Similarity Analysis**: Uses TF-IDF vectorization and cosine similarity to match professor research areas with grant descriptions
- **Preference-Based Scoring**: Considers agency preferences, award ranges, deadlines, and collaboration styles
- **LLM Relevance Analysis**: Uses Google's Gemini AI for qualitative assessment of research fit and strategic alignment

### 📊 Comprehensive Professor Profiles
- Research areas and expertise keywords
- Professional information (education, publications, awards)
- Grant preferences (agencies, funding types, award ranges)
- Collaboration and travel preferences
- Application preferences and constraints

### 🔄 Recommendation Tracking
- Track professor interactions (viewed, saved, dismissed, applied)
- Maintain recommendation scores and metadata
- Support for pagination and filtering

## API Endpoints

### Professor Management
- `GET /api/professors/{email}/` - Get professor profile
- `POST /api/professors/` - Create new professor profile
- `PUT /api/professors/{email}/update/` - Update professor profile

### Grant Recommendations
- `GET /api/professors/recommendations/?email={email}` - Get grant recommendations
- `POST /api/professors/recommendations/interaction/` - Update recommendation interaction

### Parameters for Recommendations
- `email` (required): Professor's email address
- `limit` (optional): Maximum number of recommendations (default: 25)
- `include_dismissed` (optional): Include previously dismissed grants (default: false)
- `page` (optional): Page number for pagination

## Usage Examples

### 1. Create a Professor Profile

```python
from api.models import Professor

professor_data = {
    'email': 'john.doe@university.edu',
    'name': 'Dr. John Doe',
    'title': 'Associate Professor',
    'department': 'Computer Science',
    'research_areas': ['Machine Learning', 'AI', 'NLP'],
    'expertise_keywords': ['deep learning', 'neural networks'],
    'preferred_agencies': ['NSF', 'NIH'],
    'preferred_award_ranges': {'min': 100000, 'max': 500000}
}

professor = Professor.objects.create(**professor_data)
```

### 2. Get Grant Recommendations

```python
from api.professor_matching_service import ProfessorGrantMatchingService

# Get recommendations
scored_grants = ProfessorGrantMatchingService.get_recommended_grants(
    professor=professor,
    limit=25,
    include_dismissed=False
)

# Display results
for grant, score in scored_grants:
    print(f"{grant.title}: {score:.2f}")
```

### 3. Apply LLM Analysis

```python
from api.professor_llm_service import ProfessorLLMService

# Apply LLM relevance analysis
analyzed_grants = ProfessorLLMService.apply_llm_relevance_analysis(
    scored_grants, professor
)
```

### 4. Track Interactions

```python
# Update recommendation status
ProfessorGrantMatchingService.update_recommendation_interaction(
    professor, grant, 'viewed'
)
```

## Scoring Algorithm

The recommendation system uses a multi-factor scoring approach:

### Content Similarity (30 points)
- TF-IDF vectorization of professor research areas and grant descriptions
- Cosine similarity between professor profile and grant content

### Agency Preference (25 points)
- Bonus for grants from preferred funding agencies

### Award Amount (20 points)
- Scoring based on preferred award ranges
- Penalties for grants outside preferred ranges

### Deadline Urgency (15 points)
- Bonus for grants closing in 7-30 days
- Penalty for grants closing very soon (< 7 days)

### Research Area Matching (15 points)
- Keyword matching between research areas and grant content

### Expertise Matching (10 points)
- Keyword matching between expertise and grant content

### Department Alignment (12 points)
- Matching between professor's department and grant categories

### Eligibility (8 points)
- Bonus for grants where universities are eligible applicants

### Cost Sharing (5 points)
- Bonus for grants with no cost sharing requirements

## LLM Analysis

The system uses Google's Gemini AI to provide qualitative relevance analysis focusing on:

- **Research Alignment**: Does the grant align with the professor's research trajectory?
- **Methodological Fit**: Does the professor have the required expertise?
- **Career Development**: Will this advance the professor's career goals?
- **Institutional Alignment**: Does it fit with department/university priorities?
- **Collaboration Potential**: Does it facilitate valuable collaborations?
- **Feasibility Assessment**: Is the timeline and scope realistic?

## Configuration

### Required Settings

Add to your Django settings:

```python
# For LLM analysis (optional)
GEMINI_API_KEY = 'your-gemini-api-key-here'
```

### Dependencies

The system requires these Python packages:
- `scikit-learn` - For content similarity analysis
- `numpy` - For numerical operations
- `google-generativeai` - For LLM analysis (optional)

Install with:
```bash
pip install scikit-learn numpy google-generativeai
```

## Database Models

### Professor Model
- Basic information (name, email, title, department)
- Research areas and expertise keywords
- Grant preferences and constraints
- Collaboration and travel preferences

### GrantRecommendation Model
- Links professors to grants
- Tracks recommendation scores and metadata
- Records user interactions and timestamps

## Example Usage Script

Run the example script to see the system in action:

```bash
cd backend
python example_professor_matching.py
```

This script demonstrates:
1. Creating a sample professor profile
2. Getting grant recommendations
3. Applying LLM analysis
4. Tracking recommendation interactions

## Performance Considerations

- **Batch Processing**: Content similarity is calculated in batches for efficiency
- **LLM Analysis**: Applied to top 50-100 grants in batches to manage API costs
- **Caching**: Recommendations are stored in the database to avoid recalculation
- **Pagination**: Results are paginated to handle large datasets

## Error Handling

The system includes comprehensive error handling:
- Graceful fallback when LLM analysis fails
- Validation of professor profiles and preferences
- Proper handling of missing or invalid data
- Detailed logging for debugging

## Future Enhancements

Potential improvements include:
- Machine learning models for personalized scoring
- Integration with external research databases
- Advanced filtering and search capabilities
- Recommendation explanation and reasoning
- Collaborative filtering based on similar professors
- Real-time notification system for new matching grants

## Support

For questions or issues with the professor-grant matching system, please refer to the code documentation or create an issue in the project repository.


