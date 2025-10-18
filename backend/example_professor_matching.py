#!/usr/bin/env python
"""
Example script demonstrating the Professor-Grant Matching System

This script shows how to:
1. Create a professor profile
2. Get grant recommendations
3. Update recommendation interactions
"""

import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append('/Users/lukep/Hackathon-10-18/backend')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'grantmatch.settings')
django.setup()

from api.models import Professor, Grant, GrantRecommendation
from api.professor_matching_service import ProfessorGrantMatchingService
from api.professor_llm_service import ProfessorLLMService


def create_sample_professor():
    """Create a sample professor profile for testing"""
    
    professor_data = {
        'email': 'john.doe@university.edu',
        'name': 'Dr. John Doe',
        'title': 'Associate Professor',
        'department': 'Computer Science',
        'school': 'School of Engineering',
        'university': 'Example University',
        'research_areas': [
            'Machine Learning',
            'Artificial Intelligence',
            'Natural Language Processing',
            'Computer Vision'
        ],
        'expertise_keywords': [
            'deep learning',
            'neural networks',
            'data science',
            'algorithm design',
            'statistical modeling'
        ],
        'research_interests': 'My research focuses on developing novel machine learning algorithms for natural language understanding and computer vision applications. I am particularly interested in transformer architectures and their applications in multimodal learning.',
        'current_projects': 'Currently working on a project to develop AI systems for automated medical diagnosis using computer vision and natural language processing techniques.',
        'preferred_agencies': ['NSF', 'NIH', 'DOE'],
        'preferred_funding_types': ['Research', 'Equipment'],
        'preferred_award_ranges': {'min': 100000, 'max': 1000000},
        'preferred_duration': {'min': 12, 'max': 36},
        'collaboration_style': 'small_team',
        'travel_willingness': 'moderate',
        'max_applications_per_year': 8,
        'preferred_application_deadline_lead_time': 45
    }
    
    # Create or update the professor
    professor, created = Professor.objects.update_or_create(
        email=professor_data['email'],
        defaults=professor_data
    )
    
    if created:
        print(f"✅ Created new professor profile: {professor.name}")
    else:
        print(f"✅ Updated existing professor profile: {professor.name}")
    
    return professor


def get_sample_recommendations(professor):
    """Get grant recommendations for the professor"""
    
    print(f"\n🔍 Getting grant recommendations for {professor.name}...")
    
    # Get recommendations using the matching service
    scored_grants = ProfessorGrantMatchingService.get_recommended_grants(
        professor=professor,
        limit=10,
        include_dismissed=False
    )
    
    if not scored_grants:
        print("❌ No grant recommendations found")
        return []
    
    print(f"✅ Found {len(scored_grants)} grant recommendations")
    
    # Display top recommendations
    print("\n📋 Top Grant Recommendations:")
    print("-" * 80)
    
    for i, (grant, score) in enumerate(scored_grants[:5], 1):
        print(f"\n{i}. {grant.title}")
        print(f"   Agency: {grant.agency_name} ({grant.agency_code})")
        print(f"   Score: {score:.2f}")
        print(f"   Deadline: {grant.close_date}")
        print(f"   Award Range: ${grant.award_floor or 'N/A'} - ${grant.award_ceiling or 'N/A'}")
        if grant.description:
            description_preview = grant.description[:200] + "..." if len(grant.description) > 200 else grant.description
            print(f"   Description: {description_preview}")
    
    return scored_grants


def demonstrate_llm_analysis(professor, scored_grants):
    """Demonstrate LLM-based relevance analysis"""
    
    if not scored_grants:
        print("\n❌ No grants available for LLM analysis")
        return
    
    print(f"\n🤖 Applying LLM relevance analysis to top 3 grants...")
    
    # Apply LLM analysis to top 3 grants
    top_grants = scored_grants[:3]
    
    try:
        analyzed_grants = ProfessorLLMService.apply_llm_relevance_analysis(
            top_grants, professor
        )
        
        print("✅ LLM analysis completed successfully")
        print("\n🧠 LLM Analysis Results:")
        print("-" * 80)
        
        for i, (grant, adjusted_score) in enumerate(analyzed_grants, 1):
            original_score = next(score for g, score in top_grants if g.id == grant.id)
            print(f"\n{i}. {grant.title}")
            print(f"   Original Score: {original_score:.2f}")
            print(f"   Adjusted Score: {adjusted_score:.2f}")
            print(f"   LLM Multiplier: {adjusted_score/original_score:.2f}x")
            
    except Exception as e:
        print(f"❌ LLM analysis failed: {str(e)}")
        print("   (This is expected if GEMINI_API_KEY is not configured)")


def demonstrate_interactions(professor, grants):
    """Demonstrate recommendation interactions"""
    
    if not grants:
        print("\n❌ No grants available for interaction demonstration")
        return
    
    print(f"\n📝 Demonstrating recommendation interactions...")
    
    # Create recommendations in the database
    ProfessorGrantMatchingService.create_recommendations(professor, grants[:3])
    
    # Demonstrate different interaction types
    grant = grants[0][0]  # Get the first grant
    
    interactions = [
        ('viewed', 'Professor viewed the grant details'),
        ('saved', 'Professor saved the grant for later review'),
        ('dismissed', 'Professor dismissed the grant as not relevant')
    ]
    
    for interaction_type, description in interactions:
        try:
            ProfessorGrantMatchingService.update_recommendation_interaction(
                professor, grant, interaction_type
            )
            print(f"✅ {description}")
        except Exception as e:
            print(f"❌ Failed to update {interaction_type}: {str(e)}")


def main():
    """Main demonstration function"""
    
    print("🎓 Professor-Grant Matching System Demo")
    print("=" * 50)
    
    # Check if we have any grants in the database
    grant_count = Grant.objects.count()
    print(f"📊 Database contains {grant_count} grants")
    
    if grant_count == 0:
        print("⚠️  No grants found in database. Please load grant data first.")
        print("   You can use the existing grant loading functionality.")
        return
    
    # Create a sample professor
    professor = create_sample_professor()
    
    # Get recommendations
    scored_grants = get_sample_recommendations(professor)
    
    # Demonstrate LLM analysis
    demonstrate_llm_analysis(professor, scored_grants)
    
    # Demonstrate interactions
    demonstrate_interactions(professor, scored_grants)
    
    print(f"\n🎉 Demo completed successfully!")
    print(f"   Professor: {professor.name}")
    print(f"   Recommendations: {len(scored_grants)}")
    print(f"   Database records created for tracking interactions")


if __name__ == '__main__':
    main()
