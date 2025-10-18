import json
import os
from datetime import datetime
from decimal import Decimal

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.dateparse import parse_date

from api.models import Grant, ResearcherProfile


class Command(BaseCommand):
    help = 'Load grant opportunities and researcher profiles from JSON files'

    def add_arguments(self, parser):
        parser.add_argument(
            '--grants-file',
            type=str,
            default='data/grant_opportunities.json',
            help='Path to the grants JSON file'
        )
        parser.add_argument(
            '--profiles-file',
            type=str,
            default='data/profiles_cua.json',
            help='Path to the profiles JSON file'
        )
        parser.add_argument(
            '--clear-existing',
            action='store_true',
            help='Clear existing data before loading new data'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting data loading process...'))
        
        # Get the base directory (backend)
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        
        grants_file = os.path.join(base_dir, options['grants_file'])
        profiles_file = os.path.join(base_dir, options['profiles_file'])
        
        if options['clear_existing']:
            self.clear_existing_data()
        
        # Load grants data
        if os.path.exists(grants_file):
            self.load_grants(grants_file)
        else:
            self.stdout.write(self.style.WARNING(f'Grants file not found: {grants_file}'))
        
        # Load profiles data
        if os.path.exists(profiles_file):
            self.load_profiles(profiles_file)
        else:
            self.stdout.write(self.style.WARNING(f'Profiles file not found: {profiles_file}'))
        
        self.stdout.write(self.style.SUCCESS('Data loading completed!'))

    def clear_existing_data(self):
        """Clear existing data from both models"""
        self.stdout.write('Clearing existing data...')
        Grant.objects.all().delete()
        ResearcherProfile.objects.all().delete()
        self.stdout.write(self.style.SUCCESS('Existing data cleared.'))

    def load_grants(self, file_path):
        """Load grants from JSON file"""
        self.stdout.write(f'Loading grants from {file_path}...')
        
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                grants_data = json.load(file)
        except Exception as e:
            raise CommandError(f'Error reading grants file: {e}')
        
        created_count = 0
        updated_count = 0
        skipped_count = 0
        
        with transaction.atomic():
            for grant_data in grants_data:
                try:
                    # Check for duplicates based on title and post_date
                    post_date = self.parse_date(grant_data.get('post_date'))
                    
                    existing_grant = Grant.objects.filter(
                        title=grant_data.get('title'),
                        post_date=post_date
                    ).first()
                    
                    if existing_grant:
                        # Update existing grant
                        self.update_grant_fields(existing_grant, grant_data)
                        existing_grant.save()
                        updated_count += 1
                    else:
                        # Create new grant
                        grant = self.create_grant_from_data(grant_data)
                        grant.save()
                        created_count += 1
                        
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'Error processing grant {grant_data.get("title", "Unknown")}: {e}')
                    )
                    skipped_count += 1
                    continue
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Grants loaded: {created_count} created, {updated_count} updated, {skipped_count} skipped'
            )
        )

    def load_profiles(self, file_path):
        """Load researcher profiles from JSON file"""
        self.stdout.write(f'Loading profiles from {file_path}...')
        
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                profiles_data = json.load(file)
        except Exception as e:
            raise CommandError(f'Error reading profiles file: {e}')
        
        created_count = 0
        updated_count = 0
        skipped_count = 0
        
        with transaction.atomic():
            for profile_data in profiles_data:
                try:
                    email = profile_data.get('email')
                    if not email:
                        self.stdout.write(
                            self.style.WARNING(f'Skipping profile without email: {profile_data.get("name", "Unknown")}')
                        )
                        skipped_count += 1
                        continue
                    
                    existing_profile = ResearcherProfile.objects.filter(email=email).first()
                    
                    if existing_profile:
                        # Update existing profile
                        self.update_profile_fields(existing_profile, profile_data)
                        existing_profile.save()
                        updated_count += 1
                    else:
                        # Create new profile
                        profile = self.create_profile_from_data(profile_data)
                        profile.save()
                        created_count += 1
                        
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'Error processing profile {profile_data.get("name", "Unknown")}: {e}')
                    )
                    skipped_count += 1
                    continue
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Profiles loaded: {created_count} created, {updated_count} updated, {skipped_count} skipped'
            )
        )

    def create_grant_from_data(self, data):
        """Create a new Grant instance from JSON data"""
        grant = Grant()
        return self.update_grant_fields(grant, data)

    def update_grant_fields(self, grant, data):
        """Update grant fields from JSON data"""
        # Basic information
        grant.title = data.get('title', '')
        grant.opportunity_id = data.get('opportunity_id')
        grant.opportunity_number = data.get('opportunity_number')
        grant.description = data.get('description')
        
        # Agency information
        grant.agency_code = data.get('agency_code')
        grant.agency_name = data.get('agency_name')
        
        # Financial information
        grant.award_floor = self.parse_decimal(data.get('award_floor'))
        grant.award_ceiling = self.parse_decimal(data.get('award_ceiling'))
        grant.estimated_total_program_funding = self.parse_decimal(data.get('estimated_total_program_funding'))
        grant.expected_number_of_awards = data.get('expected_number_of_awards')
        
        # Dates
        grant.post_date = self.parse_date(data.get('post_date'))
        grant.close_date = self.parse_date(data.get('close_date'))
        grant.close_date_explanation = data.get('close_date_explanation')
        grant.last_updated_date = self.parse_date(data.get('last_updated_date'))
        grant.archive_date = self.parse_date(data.get('archive_date'))
        
        # Categorization
        grant.opportunity_category = data.get('opportunity_category')
        grant.opportunity_category_explanation = data.get('opportunity_category_explanation')
        grant.funding_instrument_type = data.get('funding_instrument_type')
        grant.category_of_funding_activity = data.get('category_of_funding_activity')
        grant.category_explanation = data.get('category_explanation')
        grant.cfda_numbers = data.get('cfda_numbers')
        
        # Eligibility and requirements
        grant.eligible_applicants = data.get('eligible_applicants')
        grant.additional_information_on_eligibility = data.get('additional_information_on_eligibility')
        grant.cost_sharing_or_matching_requirement = data.get('cost_sharing_or_matching_requirement')
        
        # Additional information
        grant.additional_information_text = data.get('additional_information_text')
        grant.additional_information_url = data.get('additional_information_url')
        grant.grantor_contact_text = data.get('grantor_contact_text')
        grant.grantor_contact_email = data.get('grantor_contact_email')
        grant.grantor_contact_email_description = data.get('grantor_contact_email_description')
        grant.grantor_contact_name = data.get('grantor_contact_name')
        grant.grantor_contact_phone_number = data.get('grantor_contact_phone_number')
        grant.version = data.get('version')
        
        return grant

    def create_profile_from_data(self, data):
        """Create a new ResearcherProfile instance from JSON data"""
        profile = ResearcherProfile()
        return self.update_profile_fields(profile, data)

    def update_profile_fields(self, profile, data):
        """Update profile fields from JSON data"""
        # Basic information
        profile.email = data.get('email', '')
        profile.name = data.get('name', '')
        profile.position = data.get('position')
        
        # Institutional information
        profile.department = data.get('department')
        profile.school = data.get('school')
        
        # Professional information
        profile.expertise = data.get('expertise', [])
        profile.education = data.get('education', [])
        profile.bio = data.get('bio')
        profile.publications = data.get('publications', [])
        
        # Contact information
        profile.contact = data.get('contact', {})
        
        # Source information
        profile.source_url = data.get('source_url')
        
        return profile

    def parse_date(self, date_string):
        """Parse date string to date object"""
        if not date_string:
            return None
        try:
            return parse_date(date_string)
        except (ValueError, TypeError):
            return None

    def parse_decimal(self, value):
        """Parse value to Decimal"""
        if not value:
            return None
        try:
            if isinstance(value, str):
                # Remove commas and convert to Decimal
                clean_value = value.replace(',', '')
                return Decimal(clean_value)
            return Decimal(str(value))
        except (ValueError, TypeError):
            return None
