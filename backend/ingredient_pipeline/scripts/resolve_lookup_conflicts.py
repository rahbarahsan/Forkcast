#!/usr/bin/env python3
# /ingredient_pipeline/scripts/resolve_lookup_conflicts.py

import os
import csv
import json
import logging
from datetime import datetime
from dotenv import load_dotenv
import sys

# Add backend/ingredient_pipeline to the Python path
SCRIPT_DIR = os.path.dirname(__file__)
BACKEND_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, "..",".."))
sys.path.append(BACKEND_DIR)

# Import Supabase client and shared utilities
from ingredient_pipeline.supabase.supabase_client import get_supabase_client
from ingredient_pipeline.utils.ingredient_lookup import split_and_clean, join_set
from ingredient_pipeline.scripts.validate_lookup_table import LookupTableValidator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# --- Setup paths ---
ENV_PATH = os.path.join(SCRIPT_DIR, "..", "config", ".env")
CONFIG_PATH = os.path.join(SCRIPT_DIR, "..", "config", "pipeline_config.json")
LOGS_DIR = os.path.join(SCRIPT_DIR, "..", "logs")

# Load environment variables
load_dotenv(dotenv_path=ENV_PATH)

# Initialize Supabase client
supabase = get_supabase_client()

class ConflictResolver:
    def __init__(self, table_name):
        self.table_name = table_name
        self.validator = LookupTableValidator(table_name)
        self.fixes_applied = []
        self.backup_created = False
        
    def run_interactive_resolution(self):
        """Run interactive conflict resolution"""
        print("🔧 Interactive Lookup Table Conflict Resolution")
        print("=" * 50)
        
        # Fetch and validate data
        print("📥 Fetching lookup table data...")
        data = self.validator.fetch_data()
        if not data:
            print("❌ No data found in lookup table")
            return
        
        print("🔍 Running validation...")
        conflicts = self.validator.validate_all()
        
        if not conflicts:
            print("✅ No conflicts found! Your lookup table is clean.")
            return
        
        print(f"\n📊 Found {len(conflicts)} conflicts to resolve")
        
        # Create backup before making changes
        if not self.backup_created:
            self._create_backup()
        
        # Group conflicts by severity for better UX
        critical_conflicts = [c for c in conflicts if c['severity'] == 'critical']
        high_conflicts = [c for c in conflicts if c['severity'] == 'high']
        medium_conflicts = [c for c in conflicts if c['severity'] == 'medium']
        low_conflicts = [c for c in conflicts if c['severity'] == 'low']
        
        # Process conflicts by severity
        if critical_conflicts:
            print(f"\n🚨 CRITICAL CONFLICTS ({len(critical_conflicts)})")
            print("These must be resolved first:")
            self._process_conflicts(critical_conflicts)
        
        if high_conflicts:
            print(f"\n⚠️  HIGH PRIORITY CONFLICTS ({len(high_conflicts)})")
            if self._ask_continue("Process high priority conflicts?"):
                self._process_conflicts(high_conflicts)
        
        if medium_conflicts:
            print(f"\n📋 MEDIUM PRIORITY CONFLICTS ({len(medium_conflicts)})")
            if self._ask_continue("Process medium priority conflicts?"):
                self._process_conflicts(medium_conflicts)
        
        if low_conflicts:
            print(f"\n📝 LOW PRIORITY CONFLICTS ({len(low_conflicts)})")
            if self._ask_continue("Process low priority conflicts?"):
                self._process_conflicts(low_conflicts)
        
        # Summary
        self._show_summary()
    
    def _process_conflicts(self, conflicts):
        """Process a list of conflicts"""
        for i, conflict in enumerate(conflicts, 1):
            print(f"\n--- Conflict {i}/{len(conflicts)} ---")
            self._resolve_single_conflict(conflict)
    
    def _resolve_single_conflict(self, conflict):
        """Resolve a single conflict interactively"""
        conflict_type = conflict['type']
        
        print(f"Type: {conflict_type.replace('_', ' ').title()}")
        print(f"Severity: {conflict['severity'].upper()}")
        print(f"Issue: {conflict['issue']}")
        
        if conflict_type == 'internal_duplicate_synonyms':
            self._resolve_internal_duplicate_synonyms(conflict)
        elif conflict_type == 'internal_duplicate_plurals':
            self._resolve_internal_duplicate_plurals(conflict)
        elif conflict_type == 'canonical_in_synonyms':
            self._resolve_canonical_in_synonyms(conflict)
        elif conflict_type == 'canonical_in_plurals':
            self._resolve_canonical_in_plurals(conflict)
        elif conflict_type == 'synonym_in_multiple_entries':
            self._resolve_synonym_in_multiple_entries(conflict)
        elif conflict_type == 'canonical_plural_conflict':
            self._resolve_canonical_plural_conflict(conflict)
        elif conflict_type == 'canonical_synonym_conflict':
            self._resolve_canonical_synonym_conflict(conflict)
        elif conflict_type == 'duplicate_canonical':
            self._resolve_duplicate_canonical(conflict)
        elif conflict_type == 'invalid_category':
            self._resolve_invalid_category(conflict)
        elif conflict_type in ['whitespace_issues_synonyms', 'whitespace_issues_plurals']:
            self._resolve_whitespace_issues(conflict)
        else:
            print(f"⚠️  Unknown conflict type: {conflict_type}")
            self._ask_continue("Skip this conflict?", default=True)
    
    def _resolve_internal_duplicate_synonyms(self, conflict):
        """Resolve duplicate synonyms within an entry"""
        print(f"\nEntry: {conflict['canonical']}")
        print(f"Original synonyms: {conflict['original_synonyms']}")
        print(f"Duplicates found: {', '.join(conflict['duplicates'])}")
        print(f"Suggested fix: {conflict['suggested_fix']}")
        
        options = [
            "Apply suggested fix (remove duplicates)",
            "Edit manually",
            "Skip"
        ]
        
        choice = self._get_choice("How would you like to resolve this?", options)
        
        if choice == 1:
            self._apply_synonym_fix(conflict['entry_id'], conflict['suggested_fix'])
        elif choice == 2:
            new_synonyms = input("Enter corrected synonyms (comma-separated): ").strip()
            if new_synonyms:
                self._apply_synonym_fix(conflict['entry_id'], new_synonyms)
        # choice == 3: skip
    
    def _resolve_internal_duplicate_plurals(self, conflict):
        """Resolve duplicate plurals within an entry"""
        print(f"\nEntry: {conflict['canonical']}")
        print(f"Original plurals: {conflict['original_plurals']}")
        print(f"Duplicates found: {', '.join(conflict['duplicates'])}")
        print(f"Suggested fix: {conflict['suggested_fix']}")
        
        options = [
            "Apply suggested fix (remove duplicates)",
            "Edit manually",
            "Skip"
        ]
        
        choice = self._get_choice("How would you like to resolve this?", options)
        
        if choice == 1:
            self._apply_plural_fix(conflict['entry_id'], conflict['suggested_fix'])
        elif choice == 2:
            new_plurals = input("Enter corrected plurals (comma-separated): ").strip()
            if new_plurals:
                self._apply_plural_fix(conflict['entry_id'], new_plurals)
    
    def _resolve_canonical_in_synonyms(self, conflict):
        """Resolve canonical appearing in its own synonyms"""
        print(f"\nEntry: {conflict['canonical']}")
        print(f"Original synonyms: {conflict['original_synonyms']}")
        print(f"Suggested fix: {conflict['suggested_fix']}")
        
        options = [
            "Apply suggested fix (remove canonical from synonyms)",
            "Skip"
        ]
        
        choice = self._get_choice("How would you like to resolve this?", options)
        
        if choice == 1:
            self._apply_synonym_fix(conflict['entry_id'], conflict['suggested_fix'])
    
    def _resolve_canonical_in_plurals(self, conflict):
        """Resolve canonical appearing in its own plurals"""
        print(f"\nEntry: {conflict['canonical']}")
        print(f"Original plurals: {conflict['original_plurals']}")
        print(f"Suggested fix: {conflict['suggested_fix']}")
        
        options = [
            "Apply suggested fix (remove canonical from plurals)",
            "Skip"
        ]
        
        choice = self._get_choice("How would you like to resolve this?", options)
        
        if choice == 1:
            self._apply_plural_fix(conflict['entry_id'], conflict['suggested_fix'])
    
    def _resolve_synonym_in_multiple_entries(self, conflict):
        """Resolve synonym appearing in multiple entries"""
        print(f"\nSynonym '{conflict['synonym']}' appears in multiple entries:")
        for i, entry_info in enumerate(conflict['entries'], 1):
            print(f"  {i}. Canonical: {entry_info['canonical']} (ID: {entry_info['entry_id']})")
        
        options = [
            "Keep synonym in first entry only",
            "Keep synonym in last entry only",
            "Choose which entry to keep it in",
            "Remove from all entries",
            "Skip"
        ]
        
        choice = self._get_choice("How would you like to resolve this?", options)
        
        if choice == 1:
            # Keep in first entry, remove from others
            for entry_info in conflict['entries'][1:]:
                self._remove_synonym_from_entry(entry_info['entry_id'], conflict['synonym'])
        elif choice == 2:
            # Keep in last entry, remove from others
            for entry_info in conflict['entries'][:-1]:
                self._remove_synonym_from_entry(entry_info['entry_id'], conflict['synonym'])
        elif choice == 3:
            # Let user choose
            print("Which entry should keep this synonym?")
            for i, entry_info in enumerate(conflict['entries'], 1):
                print(f"  {i}. {entry_info['canonical']}")
            
            try:
                keep_choice = int(input("Enter number: ")) - 1
                if 0 <= keep_choice < len(conflict['entries']):
                    # Remove from all except chosen
                    for i, entry_info in enumerate(conflict['entries']):
                        if i != keep_choice:
                            self._remove_synonym_from_entry(entry_info['entry_id'], conflict['synonym'])
                else:
                    print("Invalid choice, skipping...")
            except ValueError:
                print("Invalid input, skipping...")
        elif choice == 4:
            # Remove from all entries
            for entry_info in conflict['entries']:
                self._remove_synonym_from_entry(entry_info['entry_id'], conflict['synonym'])
    
    def _resolve_canonical_plural_conflict(self, conflict):
        """Resolve canonical-plural conflicts between entries"""
        print(f"\nConflict: '{conflict['canonical']}' is:")
        print(f"  - Canonical in entry {conflict['canonical_entry_id']}")
        print(f"  - Plural in entry {conflict['plural_entry_id']} (canonical: {conflict['plural_canonical']})")
        
        options = [
            f"Merge entries (keep '{conflict['canonical']}' as canonical)",
            f"Remove '{conflict['canonical']}' from plurals of '{conflict['plural_canonical']}'",
            "Skip"
        ]
        
        choice = self._get_choice("How would you like to resolve this?", options)
        
        if choice == 1:
            self._merge_entries(conflict['canonical_entry_id'], conflict['plural_entry_id'])
        elif choice == 2:
            self._remove_plural_from_entry(conflict['plural_entry_id'], conflict['canonical'])
    
    def _resolve_duplicate_canonical(self, conflict):
        """Resolve duplicate canonical names"""
        print(f"\nDuplicate canonical: '{conflict['canonical']}'")
        print("Entries:")
        for i, entry_id in enumerate(conflict['entry_ids'], 1):
            entry = next(e for e in conflict['entries'] if e.get('id', f'row_{i}') == entry_id)
            print(f"  {i}. ID: {entry_id}")
            print(f"     Synonyms: {entry.get('synonym', 'None')}")
            print(f"     Plurals: {entry.get('plurals', 'None')}")
            print(f"     Category: {entry.get('category', 'None')}")
        
        options = [
            "Merge all entries into first one",
            "Keep first entry, delete others",
            "Choose which entry to keep",
            "Skip"
        ]
        
        choice = self._get_choice("How would you like to resolve this?", options)
        
        if choice == 1:
            # Merge all into first
            primary_id = conflict['entry_ids'][0]
            for entry_id in conflict['entry_ids'][1:]:
                self._merge_entries(primary_id, entry_id)
        elif choice == 2:
            # Delete others
            for entry_id in conflict['entry_ids'][1:]:
                self._delete_entry(entry_id)
        elif choice == 3:
            # Let user choose
            print("Which entry should be kept?")
            try:
                keep_choice = int(input("Enter number: ")) - 1
                if 0 <= keep_choice < len(conflict['entry_ids']):
                    keep_id = conflict['entry_ids'][keep_choice]
                    for entry_id in conflict['entry_ids']:
                        if entry_id != keep_id:
                            self._delete_entry(entry_id)
                else:
                    print("Invalid choice, skipping...")
            except ValueError:
                print("Invalid input, skipping...")
    
    def _resolve_invalid_category(self, conflict):
        """Resolve invalid category"""
        print(f"\nEntry: {conflict['canonical']}")
        print(f"Invalid category: '{conflict['invalid_category']}'")
        print("Valid categories:")
        for i, cat in enumerate(conflict['allowed_categories'], 1):
            print(f"  {i}. {cat}")
        
        options = ["Choose valid category", "Clear category", "Skip"]
        choice = self._get_choice("How would you like to resolve this?", options)
        
        if choice == 1:
            print("Enter the number of the correct category:")
            try:
                cat_choice = int(input()) - 1
                if 0 <= cat_choice < len(conflict['allowed_categories']):
                    new_category = conflict['allowed_categories'][cat_choice]
                    self._apply_category_fix(conflict['entry_id'], new_category)
                else:
                    print("Invalid choice, skipping...")
            except ValueError:
                print("Invalid input, skipping...")
        elif choice == 2:
            self._apply_category_fix(conflict['entry_id'], "")
    
    def _resolve_whitespace_issues(self, conflict):
        """Resolve whitespace issues"""
        print(f"\nEntry: {conflict['canonical']}")
        print(f"Original: '{conflict['original']}'")
        print(f"Suggested fix: '{conflict['suggested_fix']}'")
        
        options = ["Apply suggested fix", "Skip"]
        choice = self._get_choice("How would you like to resolve this?", options)
        
        if choice == 1:
            if 'synonyms' in conflict['type']:
                self._apply_synonym_fix(conflict['entry_id'], conflict['suggested_fix'])
            else:
                self._apply_plural_fix(conflict['entry_id'], conflict['suggested_fix'])
    
    def _apply_synonym_fix(self, entry_id, new_synonyms):
        """Apply synonym fix to database"""
        try:
            # entry_id is the canonical value (primary key)
            result = supabase.table(self.table_name).update({
                "synonym": new_synonyms
            }).eq("canonical", entry_id).execute()
            
            if not result.data:
                print(f"❌ No entry found with canonical '{entry_id}'")
                return
            
            self.fixes_applied.append({
                "type": "synonym_update",
                "entry_id": entry_id,
                "new_value": new_synonyms,
                "timestamp": datetime.now().isoformat()
            })
            print("✅ Synonym fix applied")
        except Exception as e:
            print(f"❌ Error applying synonym fix: {e}")
    
    def _apply_plural_fix(self, entry_id, new_plurals):
        """Apply plural fix to database"""
        try:
            # entry_id is the canonical value (primary key)
            result = supabase.table(self.table_name).update({
                "plurals": new_plurals
            }).eq("canonical", entry_id).execute()
            
            if not result.data:
                print(f"❌ No entry found with canonical '{entry_id}'")
                return
            
            self.fixes_applied.append({
                "type": "plural_update",
                "entry_id": entry_id,
                "new_value": new_plurals,
                "timestamp": datetime.now().isoformat()
            })
            print("✅ Plural fix applied")
        except Exception as e:
            print(f"❌ Error applying plural fix: {e}")
    
    def _apply_category_fix(self, entry_id, new_category):
        """Apply category fix to database"""
        try:
            # entry_id is the canonical value (primary key)
            result = supabase.table(self.table_name).update({
                "category": new_category
            }).eq("canonical", entry_id).execute()
            
            if not result.data:
                print(f"❌ No entry found with canonical '{entry_id}'")
                return
            
            self.fixes_applied.append({
                "type": "category_update",
                "entry_id": entry_id,
                "new_value": new_category,
                "timestamp": datetime.now().isoformat()
            })
            print("✅ Category fix applied")
        except Exception as e:
            print(f"❌ Error applying category fix: {e}")
    
    def _remove_synonym_from_entry(self, entry_id, synonym_to_remove):
        """Remove a specific synonym from an entry"""
        try:
            # entry_id is the canonical value (primary key)
            response = supabase.table(self.table_name).select("synonym").eq("canonical", entry_id).execute()
            if not response.data:
                print(f"❌ Entry with canonical '{entry_id}' not found")
                return
            
            current_synonyms = response.data[0].get('synonym', '')
            synonyms_set = split_and_clean(current_synonyms)
            synonyms_set.discard(synonym_to_remove.lower())
            new_synonyms = join_set(synonyms_set)
            
            self._apply_synonym_fix(entry_id, new_synonyms)
        except Exception as e:
            print(f"❌ Error removing synonym: {e}")
    
    def _remove_plural_from_entry(self, entry_id, plural_to_remove):
        """Remove a specific plural from an entry"""
        try:
            # entry_id is the canonical value (primary key)
            response = supabase.table(self.table_name).select("plurals").eq("canonical", entry_id).execute()
            if not response.data:
                print(f"❌ Entry with canonical '{entry_id}' not found")
                return
            
            current_plurals = response.data[0].get('plurals', '')
            plurals_set = split_and_clean(current_plurals)
            plurals_set.discard(plural_to_remove.lower())
            new_plurals = join_set(plurals_set)
            
            self._apply_plural_fix(entry_id, new_plurals)
        except Exception as e:
            print(f"❌ Error removing plural: {e}")
    
    def _merge_entries(self, primary_id, secondary_id):
        """Merge two entries"""
        try:
            # primary_id and secondary_id are canonical values (primary keys)
            response = supabase.table(self.table_name).select("*").in_("canonical", [primary_id, secondary_id]).execute()
            if len(response.data) != 2:
                print(f"❌ Could not find both entries")
                return
            
            primary = next((e for e in response.data if e['canonical'] == primary_id), None)
            secondary = next((e for e in response.data if e['canonical'] == secondary_id), None)
            
            if not primary or not secondary:
                print(f"❌ Could not find one or both entries")
                return
            
            # Merge synonyms
            primary_synonyms = split_and_clean(primary.get('synonym', ''))
            secondary_synonyms = split_and_clean(secondary.get('synonym', ''))
            merged_synonyms = primary_synonyms.union(secondary_synonyms)
            
            # Merge plurals
            primary_plurals = split_and_clean(primary.get('plurals', ''))
            secondary_plurals = split_and_clean(secondary.get('plurals', ''))
            merged_plurals = primary_plurals.union(secondary_plurals)
            
            # Use primary category, or secondary if primary is empty
            category = primary.get('category', '') or secondary.get('category', '')
            
            # Update primary entry
            supabase.table(self.table_name).update({
                "synonym": join_set(merged_synonyms),
                "plurals": join_set(merged_plurals),
                "category": category
            }).eq("canonical", primary_id).execute()
            
            # Delete secondary entry
            supabase.table(self.table_name).delete().eq("canonical", secondary_id).execute()
            
            self.fixes_applied.append({
                "type": "merge_entries",
                "primary_id": primary_id,
                "secondary_id": secondary_id,
                "timestamp": datetime.now().isoformat()
            })
            print("✅ Entries merged successfully")
        except Exception as e:
            print(f"❌ Error merging entries: {e}")
    
    def _delete_entry(self, entry_id):
        """Delete an entry"""
        try:
            # entry_id is the canonical value (primary key)
            result = supabase.table(self.table_name).delete().eq("canonical", entry_id).execute()
            
            if not result.data:
                print(f"❌ No entry found with canonical '{entry_id}'")
                return
            
            self.fixes_applied.append({
                "type": "delete_entry",
                "entry_id": entry_id,
                "timestamp": datetime.now().isoformat()
            })
            print(f"✅ Entry '{entry_id}' deleted")
        except Exception as e:
            print(f"❌ Error deleting entry: {e}")
    
    def _create_backup(self):
        """Create backup of current lookup table"""
        try:
            # Ensure logs directory exists
            os.makedirs(LOGS_DIR, exist_ok=True)
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_filename = f"lookup_table_backup_{timestamp}.csv"
            backup_path = os.path.join(LOGS_DIR, backup_filename)
            
            # Fetch all data
            response = supabase.table(self.table_name).select("*").execute()
            if not response.data:
                print("⚠️  No data to backup")
                return
            
            # Save to CSV
            fieldnames = response.data[0].keys()
            with open(backup_path, "w", newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(response.data)
            
            print(f"💾 Backup created: {backup_path}")
            self.backup_created = True
        except Exception as e:
            print(f"❌ Error creating backup: {e}")
    
    def _show_summary(self):
        """Show summary of fixes applied"""
        if not self.fixes_applied:
            print("\n📊 No fixes were applied")
            return
        
        print(f"\n📊 Summary: {len(self.fixes_applied)} fixes applied")
        
        # Count by type
        fix_counts = {}
        for fix in self.fixes_applied:
            fix_type = fix['type']
            fix_counts[fix_type] = fix_counts.get(fix_type, 0) + 1
        
        for fix_type, count in fix_counts.items():
            print(f"  - {fix_type.replace('_', ' ').title()}: {count}")
        
        # Save fixes log
        self._save_fixes_log()
        
        print("\n✅ Resolution completed!")
        print("💡 Tip: Run validation again to check for remaining conflicts")
    
    def _save_fixes_log(self):
        """Save log of all fixes applied"""
        if not self.fixes_applied:
            return
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_filename = f"conflict_resolution_log_{timestamp}.csv"
        log_path = os.path.join(LOGS_DIR, log_filename)
        
        fieldnames = ["type", "entry_id", "details", "timestamp"]
        
        with open(log_path, "w", newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            
            for fix in self.fixes_applied:
                row = {
                    "type": fix['type'],
                    "entry_id": fix.get('entry_id', ''),
                    "details": json.dumps({k: v for k, v in fix.items() if k not in ['type', 'entry_id']}),
                    "timestamp": fix['timestamp']
                }
                writer.writerow(row)
        
        print(f"📄 Fixes log saved to: {log_path}")
    
    def _get_choice(self, question, options):
        """Get user choice from options"""
        print(f"\n{question}")
        for i, option in enumerate(options, 1):
            print(f"  {i}. {option}")
        
        while True:
            try:
                choice = int(input("Enter your choice: "))
                if 1 <= choice <= len(options):
                    return choice
                else:
                    print(f"Please enter a number between 1 and {len(options)}")
            except ValueError:
                print("Please enter a valid number")
    
    def _ask_continue(self, question, default=False):
        """Ask yes/no question"""
        default_text = " [Y/n]" if default else " [y/N]"
        response = input(f"{question}{default_text}: ").strip().lower()
        
        if not response:
            return default
        
        return response in ['y', 'yes']

def load_config():
    """Load configuration from pipeline_config.json"""
    config = {"supabase_lookup_table": "ingredient_lookup"}
    
    try:
        if os.path.exists(CONFIG_PATH):
            with open(CONFIG_PATH, 'r') as f:
                file_config = json.load(f)
                config.update(file_config)
    except Exception as e:
        logging.warning(f"Could not load config file: {e}. Using default values.")
    
    return config

def main():
    """Main function to run interactive conflict resolution"""
    print("🔧 Lookup Table Conflict Resolution")
    print("=" * 40)
    
    # Load configuration
    config = load_config()
    table_name = config["supabase_lookup_table"]
    
    print(f"Table: {table_name}")
    
    try:
        # Initialize resolver
        resolver = ConflictResolver(table_name)
        
        # Run interactive resolution
        resolver.run_interactive_resolution()
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Resolution interrupted by user")
    except Exception as e:
        logging.error(f"❌ Error during resolution: {e}")
        raise

if __name__ == "__main__":
    main()
