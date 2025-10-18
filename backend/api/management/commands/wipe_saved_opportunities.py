"""
Management command to wipe saved opportunities for professors.

Usage examples:
    # Wipe all saved opportunities for all professors (with confirmation)
    python manage.py wipe_saved_opportunities

    # Wipe saved opportunities for a specific professor
    python manage.py wipe_saved_opportunities --professor-email widmer@cua.edu

    # Dry run to see what would be deleted without actually deleting
    python manage.py wipe_saved_opportunities --dry-run

    # Skip confirmation prompt (use with caution)
    python manage.py wipe_saved_opportunities --confirm

This command removes:
- SavedGrant entries (grants saved by users)
- GrantPipelineEntry entries (grants in professor pipelines)
- Sets is_saved=False on GrantRecommendation entries
- Clears grants from pipeline stages
"""

import json
import os
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from api.models import (
    Professor, ProfessorUser, SavedGrant, GrantPipelineEntry, 
    GrantRecommendation, GrantPipelineStage
)


class Command(BaseCommand):
    help = 'Wipe all saved opportunities for professors or a specific professor'

    def add_arguments(self, parser):
        parser.add_argument(
            '--professor-email',
            type=str,
            help='Email of specific professor to wipe saved opportunities for (if not provided, wipes for all professors)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting anything'
        )
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Skip confirmation prompt (use with caution)'
        )

    def handle(self, *args, **options):
        professor_email = options.get('professor_email')
        dry_run = options.get('dry_run', False)
        confirm = options.get('confirm', False)
        
        if professor_email:
            # Wipe for specific professor
            self.wipe_professor_saved_opportunities(professor_email, dry_run, confirm)
        else:
            # Wipe for all professors
            self.wipe_all_saved_opportunities(dry_run, confirm)

    def wipe_professor_saved_opportunities(self, professor_email, dry_run, confirm):
        """Wipe saved opportunities for a specific professor"""
        try:
            professor = Professor.objects.get(email=professor_email)
        except Professor.DoesNotExist:
            raise CommandError(f'Professor with email {professor_email} not found')
        
        self.stdout.write(f'Found professor: {professor.name} ({professor.email})')
        
        # Get counts of what will be deleted
        saved_grants_count = SavedGrant.objects.filter(user__professor_profile=professor).count()
        pipeline_entries_count = GrantPipelineEntry.objects.filter(professor=professor).count()
        saved_recommendations_count = GrantRecommendation.objects.filter(
            professor=professor, is_saved=True
        ).count()
        
        total_count = saved_grants_count + pipeline_entries_count + saved_recommendations_count
        
        if total_count == 0:
            self.stdout.write(self.style.SUCCESS('No saved opportunities found for this professor.'))
            return
        
        self.stdout.write(f'Found saved opportunities for {professor.name}:')
        self.stdout.write(f'  - SavedGrant entries: {saved_grants_count}')
        self.stdout.write(f'  - Pipeline entries: {pipeline_entries_count}')
        self.stdout.write(f'  - Saved recommendations: {saved_recommendations_count}')
        self.stdout.write(f'  - Total entries to delete: {total_count}')
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN: No data was actually deleted.'))
            return
        
        if not confirm:
            response = input(f'Are you sure you want to delete all saved opportunities for {professor.name}? (yes/no): ')
            if response.lower() != 'yes':
                self.stdout.write('Operation cancelled.')
                return
        
        # Delete the data
        with transaction.atomic():
            deleted_saved_grants = SavedGrant.objects.filter(user__professor_profile=professor).delete()
            deleted_pipeline_entries = GrantPipelineEntry.objects.filter(professor=professor).delete()
            deleted_recommendations = GrantRecommendation.objects.filter(
                professor=professor, is_saved=True
            ).update(is_saved=False, saved_at=None)
            
            # Also clear the grants from pipeline stages
            pipeline_stages = GrantPipelineStage.objects.filter(professor=professor)
            for stage in pipeline_stages:
                stage.grants.clear()
        
        self.stdout.write(self.style.SUCCESS(
            f'Successfully wiped saved opportunities for {professor.name}:'
        ))
        self.stdout.write(f'  - Deleted {deleted_saved_grants[0]} SavedGrant entries')
        self.stdout.write(f'  - Deleted {deleted_pipeline_entries[0]} Pipeline entries')
        self.stdout.write(f'  - Updated {deleted_recommendations} recommendations (unsaved)')
        self.stdout.write(f'  - Cleared grants from {pipeline_stages.count()} pipeline stages')

    def wipe_all_saved_opportunities(self, dry_run, confirm):
        """Wipe saved opportunities for all professors"""
        # Get counts of what will be deleted
        saved_grants_count = SavedGrant.objects.count()
        pipeline_entries_count = GrantPipelineEntry.objects.count()
        saved_recommendations_count = GrantRecommendation.objects.filter(is_saved=True).count()
        professors_count = Professor.objects.count()
        
        total_count = saved_grants_count + pipeline_entries_count + saved_recommendations_count
        
        if total_count == 0:
            self.stdout.write(self.style.SUCCESS('No saved opportunities found for any professor.'))
            return
        
        self.stdout.write(f'Found saved opportunities across {professors_count} professors:')
        self.stdout.write(f'  - SavedGrant entries: {saved_grants_count}')
        self.stdout.write(f'  - Pipeline entries: {pipeline_entries_count}')
        self.stdout.write(f'  - Saved recommendations: {saved_recommendations_count}')
        self.stdout.write(f'  - Total entries to delete: {total_count}')
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN: No data was actually deleted.'))
            return
        
        if not confirm:
            response = input('Are you sure you want to delete ALL saved opportunities for ALL professors? (yes/no): ')
            if response.lower() != 'yes':
                self.stdout.write('Operation cancelled.')
                return
        
        # Delete the data
        with transaction.atomic():
            deleted_saved_grants = SavedGrant.objects.all().delete()
            deleted_pipeline_entries = GrantPipelineEntry.objects.all().delete()
            deleted_recommendations = GrantRecommendation.objects.filter(is_saved=True).update(
                is_saved=False, saved_at=None
            )
            
            # Clear all grants from all pipeline stages
            pipeline_stages = GrantPipelineStage.objects.all()
            for stage in pipeline_stages:
                stage.grants.clear()
        
        self.stdout.write(self.style.SUCCESS('Successfully wiped all saved opportunities:'))
        self.stdout.write(f'  - Deleted {deleted_saved_grants[0]} SavedGrant entries')
        self.stdout.write(f'  - Deleted {deleted_pipeline_entries[0]} Pipeline entries')
        self.stdout.write(f'  - Updated {deleted_recommendations} recommendations (unsaved)')
        self.stdout.write(f'  - Cleared grants from {pipeline_stages.count()} pipeline stages')

    def get_professor_stats(self, professor):
        """Get statistics about a professor's saved opportunities"""
        saved_grants = SavedGrant.objects.filter(user__professor_profile=professor)
        pipeline_entries = GrantPipelineEntry.objects.filter(professor=professor)
        saved_recommendations = GrantRecommendation.objects.filter(professor=professor, is_saved=True)
        
        return {
            'saved_grants_count': saved_grants.count(),
            'pipeline_entries_count': pipeline_entries.count(),
            'saved_recommendations_count': saved_recommendations.count(),
            'saved_grants': saved_grants,
            'pipeline_entries': pipeline_entries,
            'saved_recommendations': saved_recommendations
        }
