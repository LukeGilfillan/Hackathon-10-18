from django.core.management.base import BaseCommand
from api.models import Forum, Topic, Post, ProfessorUser
from django.utils import timezone
import random

class Command(BaseCommand):
    help = 'Create sample forum data for testing'

    def handle(self, *args, **options):
        # Create forums
        forums_data = [
            {
                'name': 'General Discussion',
                'description': 'General discussions about research, grants, and academic life',
                'slug': 'general',
                'order': 1
            },
            {
                'name': 'Grant Opportunities',
                'description': 'Share and discuss grant opportunities, deadlines, and application tips',
                'slug': 'grants',
                'order': 2
            },
            {
                'name': 'Research Collaboration',
                'description': 'Find collaborators, discuss research projects, and share expertise',
                'slug': 'collaboration',
                'order': 3
            },
            {
                'name': 'NSF Grants',
                'description': 'Specific discussions about NSF funding opportunities and requirements',
                'slug': 'nsf',
                'order': 4
            },
            {
                'name': 'NIH Grants',
                'description': 'NIH funding discussions, R01 tips, and health research grants',
                'slug': 'nih',
                'order': 5
            }
        ]

        forums = []
        for forum_data in forums_data:
            forum, created = Forum.objects.get_or_create(
                slug=forum_data['slug'],
                defaults=forum_data
            )
            forums.append(forum)
            if created:
                self.stdout.write(f'Created forum: {forum.name}')

        # Get some professor users to create topics and posts
        professors = ProfessorUser.objects.filter(is_authenticated=True)[:5]
        
        if not professors:
            self.stdout.write('No authenticated professors found. Please create some professor users first.')
            return

        # Create sample topics
        topics_data = [
            {
                'title': 'Welcome to the Research Forum!',
                'content': 'Welcome everyone! This is a place for researchers to connect, share ideas, and collaborate on grants. Feel free to introduce yourself and your research interests.',
                'forum': forums[0]  # General Discussion
            },
            {
                'title': 'NSF CAREER Award Application Tips',
                'content': 'I recently received an NSF CAREER award and wanted to share some tips that helped me succeed. The key is to clearly articulate your research vision and its broader impacts.',
                'forum': forums[3]  # NSF Grants
            },
            {
                'title': 'Looking for Collaborators in Machine Learning',
                'content': 'I\'m working on a project involving machine learning applications in healthcare. Looking for collaborators with expertise in deep learning and medical imaging.',
                'forum': forums[2]  # Research Collaboration
            },
            {
                'title': 'NIH R01 vs R21 - Which to Choose?',
                'content': 'I\'m planning to apply for NIH funding but unsure whether to go for an R01 or R21. What are the key differences and when should I choose each?',
                'forum': forums[4]  # NIH Grants
            },
            {
                'title': 'Grant Writing Workshop Resources',
                'content': 'Does anyone have recommendations for good grant writing workshops or online courses? I\'m particularly interested in NSF and NIH proposal writing.',
                'forum': forums[1]  # Grant Opportunities
            }
        ]

        topics = []
        for topic_data in topics_data:
            author = random.choice(professors)
            topic = Topic.objects.create(
                title=topic_data['title'],
                content=topic_data['content'],
                forum=topic_data['forum'],
                author=author
            )
            topics.append(topic)
            self.stdout.write(f'Created topic: {topic.title}')

        # Create sample posts/replies
        posts_data = [
            {
                'content': 'Thanks for sharing! I\'m also interested in ML applications in healthcare. I work primarily with computer vision for medical diagnosis.',
                'topic': topics[2]  # ML collaboration topic
            },
            {
                'content': 'Great question! R01s are for established research programs, while R21s are for exploratory/developmental research. If you\'re testing a new hypothesis, R21 might be better.',
                'topic': topics[3]  # NIH R01 vs R21 topic
            },
            {
                'content': 'I found the NSF Grant Writing Workshop very helpful. They have both in-person and online options.',
                'topic': topics[4]  # Grant writing workshop topic
            },
            {
                'content': 'Welcome! I\'m Dr. Smith from the Computer Science department. My research focuses on AI and robotics.',
                'topic': topics[0]  # Welcome topic
            },
            {
                'content': 'The broader impacts section is crucial for CAREER awards. Make sure to include specific plans for education and outreach.',
                'topic': topics[1]  # NSF CAREER tips topic
            }
        ]

        for post_data in posts_data:
            author = random.choice(professors)
            post = Post(
                content=post_data['content'],
                topic=post_data['topic'],
                author=author
            )
            post.save()

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {len(forums)} forums, {len(topics)} topics, and {len(posts_data)} posts'
            )
        )
