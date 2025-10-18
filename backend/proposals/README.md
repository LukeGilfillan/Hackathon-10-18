# Proposals App - Grant Draft Management System

The Proposals app provides a comprehensive backend system for creating, managing, and improving grant application drafts using AI-powered generation and enhancement.

## Features

- **AI-Powered Draft Generation**: Automatically generate comprehensive grant application drafts using Google's Gemini AI
- **Section-Specific Improvements**: Use AI to improve individual sections of existing drafts
- **Draft Suggestions**: Get AI-powered suggestions for improving draft quality
- **Version Control**: Create and manage multiple versions of drafts
- **Full CRUD Operations**: Create, read, update, and delete grant drafts
- **Professor-Grant Integration**: Seamlessly integrate with existing professor profiles and grant opportunities

## Models

### GrantDraft

The main model for storing grant application drafts with the following key features:

- **Content Sections**: Project summary, research objectives, methodology, expected outcomes, budget justification, timeline, team description, institutional support, and broader impacts
- **AI Metadata**: Tracks AI generation details including model used, confidence score, and generation prompt
- **Version Control**: Supports creating new versions of existing drafts
- **User Customization**: Allows custom sections and user notes
- **Status Tracking**: Tracks draft status from draft to awarded

## API Endpoints

All endpoints are prefixed with `/api/proposals/`

### Draft Management

#### List Grant Drafts
```
GET /api/proposals/drafts/
```
**Query Parameters:**
- `email` (required): Professor email address
- `status` (optional): Filter by draft status
- `grant_id` (optional): Filter by specific grant ID

**Response:** Paginated list of grant drafts

#### Get Specific Draft
```
GET /api/proposals/drafts/{draft_id}/
```
**Response:** Complete draft details including all content sections

#### Create New Draft
```
POST /api/proposals/drafts/create/
```
**Request Body:**
```json
{
    "professor_id": 1,
    "grant_id": 123,
    "custom_instructions": "Focus on machine learning applications",
    "title": "Optional custom title"
}
```
**Response:** Created draft with AI-generated content

#### Update Draft
```
PUT /api/proposals/drafts/{draft_id}/update/
PATCH /api/proposals/drafts/{draft_id}/update/
```
**Request Body:** Any combination of draft fields to update

#### Delete Draft
```
DELETE /api/proposals/drafts/{draft_id}/delete/
```

### AI-Powered Features

#### Improve Draft Section
```
POST /api/proposals/drafts/{draft_id}/improve/
```
**Request Body:**
```json
{
    "section_name": "methodology",
    "improvement_instructions": "Make it more specific to deep learning techniques"
}
```
**Valid Section Names:**
- `project_summary`
- `research_objectives`
- `methodology`
- `expected_outcomes`
- `budget_justification`
- `timeline`
- `team_description`
- `institutional_support`
- `broader_impacts`

#### Get Draft Suggestions
```
GET /api/proposals/drafts/{draft_id}/suggestions/
```
**Response:** AI-generated suggestions for improving each section

#### Create New Version
```
POST /api/proposals/drafts/{draft_id}/version/
```
**Response:** New draft version with incremented version number

## Usage Examples

### Creating a Grant Draft

```python
import requests

# Create a new AI-generated draft
response = requests.post('http://localhost:8000/api/proposals/drafts/create/', json={
    'professor_id': 1,
    'grant_id': 123,
    'custom_instructions': 'Emphasize interdisciplinary collaboration and student training'
})

draft = response.json()
print(f"Created draft: {draft['title']}")
```

### Improving a Draft Section

```python
# Improve the methodology section
response = requests.post(f'http://localhost:8000/api/proposals/drafts/{draft_id}/improve/', json={
    'section_name': 'methodology',
    'improvement_instructions': 'Add more details about data collection methods and statistical analysis'
})

improved_draft = response.json()['draft']
```

### Getting Suggestions

```python
# Get AI suggestions for improving the draft
response = requests.get(f'http://localhost:8000/api/proposals/drafts/{draft_id}/suggestions/')
suggestions = response.json()['suggestions']

for section, section_suggestions in suggestions.items():
    print(f"{section}: {section_suggestions}")
```

## AI Integration

The system uses Google's Gemini AI (gemini-2.0-flash) for:

1. **Initial Draft Generation**: Creates comprehensive grant applications based on professor profiles and grant requirements
2. **Section Improvement**: Enhances specific sections based on user instructions
3. **Quality Suggestions**: Provides actionable feedback for improving draft quality

### AI Configuration

The system requires a `GEMINI_API_KEY` in Django settings. If the API key is not available, the system falls back to creating basic draft templates.

## Database Schema

The GrantDraft model includes:

- **Relationships**: Links to Professor and Grant models
- **Content Fields**: Text fields for each section of the grant application
- **Metadata**: AI generation details, version control, timestamps
- **Customization**: User notes and custom sections (JSON field)

## Admin Interface

The Django admin interface provides:

- **List View**: Filterable and searchable list of all drafts
- **Detail View**: Organized fieldsets for easy editing
- **Bulk Operations**: Select multiple drafts for bulk actions
- **Optimized Queries**: Uses select_related for efficient database queries

## Error Handling

The API includes comprehensive error handling:

- **Validation Errors**: Detailed field-level validation messages
- **Not Found Errors**: Clear messages for missing resources
- **AI Service Errors**: Graceful fallbacks when AI services are unavailable
- **Conflict Errors**: Handles duplicate draft creation attempts

## Performance Considerations

- **Pagination**: All list endpoints are paginated (20 items per page)
- **Database Indexes**: Optimized indexes on frequently queried fields
- **Select Related**: Efficient queries with related model data
- **AI Caching**: Consider implementing caching for AI-generated content

## Future Enhancements

Potential improvements for the proposals system:

1. **Template System**: Pre-defined templates for different grant types
2. **Collaboration Features**: Multi-user editing and commenting
3. **Export Formats**: PDF, Word, and other format exports
4. **Review Workflow**: Peer review and approval processes
5. **Analytics**: Track success rates and improvement metrics
6. **Integration**: Connect with external grant submission systems
