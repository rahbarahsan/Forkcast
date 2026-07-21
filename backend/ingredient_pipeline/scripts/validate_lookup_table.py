#!/usr/bin/env python3
# /ingredient_pipeline/scripts/validate_lookup_table.py

import os
import csv
import json
import logging
from datetime import datetime
from collections import defaultdict, Counter
from dotenv import load_dotenv
import sys

# Add backend/ingredient_pipeline to the Python path
SCRIPT_DIR = os.path.dirname(__file__)
BACKEND_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, "..",".."))
sys.path.append(BACKEND_DIR)

# Import Supabase client and shared utilities
from ingredient_pipeline.supabase.supabase_client import get_supabase_client
from ingredient_pipeline.utils.ingredient_lookup import split_and_clean, join_set

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

# --- Load configuration ---
def load_config():
    """Load configuration from pipeline_config.json"""
    config = {
        "supabase_lookup_table": "ingredient_lookup"
    }
    
    try:
        if os.path.exists(CONFIG_PATH):
            with open(CONFIG_PATH, 'r') as f:
                file_config = json.load(f)
                config.update(file_config)
    except Exception as e:
        logging.warning(f"Could not load config file: {e}. Using default values.")
    
    return config

# --- Constants ---
ALLOWED_CATEGORIES = [
    "Vegetables", "Other", "Condiments & Spices", 
    "Meat & Seafood", "Dairy", "Fruits", "Grains & Bakery"
]

class LookupTableValidator:
    def __init__(self, table_name):
        self.table_name = table_name
        self.data = []
        self.conflicts = []
        self.fixes_applied = []
        
    def fetch_data(self):
        """Fetch all data from the lookup table"""
        try:
            response = supabase.table(self.table_name).select("*").execute()
            if response.data is None:
                logging.warning("No data returned from Supabase lookup table")
                return []
            self.data = response.data
            logging.info(f"Fetched {len(self.data)} entries from {self.table_name}")
            return self.data
        except Exception as e:
            logging.error(f"Error fetching lookup data: {e}")
            return []
    
    def validate_all(self):
        """Run all validation checks"""
        logging.info("🔍 Starting comprehensive lookup table validation...")
        
        self.conflicts = []
        
        # Run all validation checks
        self.check_internal_duplicates()
        self.check_cross_entry_conflicts()
        self.check_data_quality()
        self.check_category_validity()
        
        # Generate summary
        self.generate_summary()
        
        return self.conflicts
    
    def check_internal_duplicates(self):
        """Check for duplicates within individual entries"""
        logging.info("🔍 Checking for internal duplicates...")
        
        for i, entry in enumerate(self.data):
            canonical = entry.get('canonical', '').strip()
            if not canonical:
                # Skip entries without canonical
                continue
            entry_id = canonical  # Use canonical as the primary key
            
            # Check synonym duplicates
            synonym_str = entry.get('synonym', '')
            if synonym_str:
                synonyms = [s.strip().lower() for s in synonym_str.split(',') if s.strip()]
                synonym_counts = Counter(synonyms)
                duplicates = [syn for syn, count in synonym_counts.items() if count > 1]
                
                if duplicates:
                    self.conflicts.append({
                        'type': 'internal_duplicate_synonyms',
                        'severity': 'medium',
                        'entry_id': entry_id,
                        'canonical': canonical,
                        'issue': f"Duplicate synonyms found: {', '.join(duplicates)}",
                        'original_synonyms': synonym_str,
                        'duplicates': duplicates,
                        'suggested_fix': self._deduplicate_synonyms(synonym_str)
                    })
            
            # Check plural duplicates
            plural_str = entry.get('plurals', '')
            if plural_str:
                plurals = [p.strip().lower() for p in plural_str.split(',') if p.strip()]
                plural_counts = Counter(plurals)
                duplicates = [pl for pl, count in plural_counts.items() if count > 1]
                
                if duplicates:
                    self.conflicts.append({
                        'type': 'internal_duplicate_plurals',
                        'severity': 'medium',
                        'entry_id': entry_id,
                        'canonical': canonical,
                        'issue': f"Duplicate plurals found: {', '.join(duplicates)}",
                        'original_plurals': plural_str,
                        'duplicates': duplicates,
                        'suggested_fix': self._deduplicate_plurals(plural_str)
                    })
            
            # Check canonical self-references
            canonical_lower = canonical.lower()
            if synonym_str and canonical_lower in [s.strip().lower() for s in synonym_str.split(',')]:
                self.conflicts.append({
                    'type': 'canonical_in_synonyms',
                    'severity': 'high',
                    'entry_id': entry_id,
                    'canonical': canonical,
                    'issue': f"Canonical '{canonical}' appears in its own synonyms",
                    'original_synonyms': synonym_str,
                    'suggested_fix': self._remove_canonical_from_synonyms(canonical, synonym_str)
                })
            
            if plural_str and canonical_lower in [p.strip().lower() for p in plural_str.split(',')]:
                self.conflicts.append({
                    'type': 'canonical_in_plurals',
                    'severity': 'high',
                    'entry_id': entry_id,
                    'canonical': canonical,
                    'issue': f"Canonical '{canonical}' appears in its own plurals",
                    'original_plurals': plural_str,
                    'suggested_fix': self._remove_canonical_from_plurals(canonical, plural_str)
                })
    
    def check_cross_entry_conflicts(self):
        """Check for conflicts between different entries"""
        logging.info("🔍 Checking for cross-entry conflicts...")
        
        # Build indexes for efficient lookup
        canonical_index = {}
        synonym_index = defaultdict(list)
        plural_index = defaultdict(list)
        
        for i, entry in enumerate(self.data):
            canonical_raw = entry.get('canonical', '').strip()
            if not canonical_raw:
                continue
            entry_id = canonical_raw  # Use canonical as the primary key
            canonical = canonical_raw.lower()
            
            # Index canonical names
            if canonical:
                if canonical in canonical_index:
                    # Duplicate canonical names
                    self.conflicts.append({
                        'type': 'duplicate_canonical',
                        'severity': 'critical',
                        'entry_ids': [canonical_index[canonical]['entry_id'], entry_id],
                        'canonical': canonical,
                        'issue': f"Canonical name '{canonical}' appears in multiple entries",
                        'entries': [canonical_index[canonical], entry]
                    })
                else:
                    canonical_index[canonical] = {'entry_id': entry_id, 'entry': entry}
            
            # Index synonyms
            synonym_str = entry.get('synonym', '')
            if synonym_str:
                synonyms = [s.strip().lower() for s in synonym_str.split(',') if s.strip()]
                for syn in synonyms:
                    synonym_index[syn].append({'entry_id': entry_id, 'canonical': canonical, 'entry': entry})
            
            # Index plurals
            plural_str = entry.get('plurals', '')
            if plural_str:
                plurals = [p.strip().lower() for p in plural_str.split(',') if p.strip()]
                for pl in plurals:
                    plural_index[pl].append({'entry_id': entry_id, 'canonical': canonical, 'entry': entry})
        
        # Check for synonym conflicts (same synonym in multiple entries)
        for synonym, entries in synonym_index.items():
            if len(entries) > 1:
                self.conflicts.append({
                    'type': 'synonym_in_multiple_entries',
                    'severity': 'high',
                    'synonym': synonym,
                    'entry_ids': [e['entry_id'] for e in entries],
                    'canonicals': [e['canonical'] for e in entries],
                    'issue': f"Synonym '{synonym}' appears in multiple entries: {', '.join([e['canonical'] for e in entries])}",
                    'entries': entries
                })
        
        # Check for canonical-plural conflicts
        for canonical, canonical_data in canonical_index.items():
            if canonical in plural_index:
                plural_entries = plural_index[canonical]
                for plural_entry in plural_entries:
                    if plural_entry['entry_id'] != canonical_data['entry_id']:
                        self.conflicts.append({
                            'type': 'canonical_plural_conflict',
                            'severity': 'critical',
                            'canonical': canonical,
                            'canonical_entry_id': canonical_data['entry_id'],
                            'plural_entry_id': plural_entry['entry_id'],
                            'plural_canonical': plural_entry['canonical'],
                            'issue': f"'{canonical}' is canonical in one entry but plural in another (canonical: '{plural_entry['canonical']}')",
                            'entries': [canonical_data['entry'], plural_entry['entry']]
                        })
        
        # Check for canonical-synonym conflicts
        for canonical, canonical_data in canonical_index.items():
            if canonical in synonym_index:
                synonym_entries = synonym_index[canonical]
                for synonym_entry in synonym_entries:
                    if synonym_entry['entry_id'] != canonical_data['entry_id']:
                        self.conflicts.append({
                            'type': 'canonical_synonym_conflict',
                            'severity': 'high',
                            'canonical': canonical,
                            'canonical_entry_id': canonical_data['entry_id'],
                            'synonym_entry_id': synonym_entry['entry_id'],
                            'synonym_canonical': synonym_entry['canonical'],
                            'issue': f"'{canonical}' is canonical in one entry but synonym in another (canonical: '{synonym_entry['canonical']}')",
                            'entries': [canonical_data['entry'], synonym_entry['entry']]
                        })
    
    def check_data_quality(self):
        """Check for data quality issues"""
        logging.info("🔍 Checking data quality...")
        
        for i, entry in enumerate(self.data):
            canonical = entry.get('canonical', '').strip()
            
            # Check for empty canonical
            if not canonical:
                self.conflicts.append({
                    'type': 'empty_canonical',
                    'severity': 'critical',
                    'entry_id': f'row_{i}',  # Use row index for entries without canonical
                    'issue': "Entry has empty canonical name",
                    'entry': entry
                })
                continue  # Skip further checks for this entry
            
            entry_id = canonical  # Use canonical as the primary key
            
            # Check for whitespace issues
            synonym_str = entry.get('synonym', '')
            if synonym_str and (synonym_str != synonym_str.strip() or '  ' in synonym_str):
                self.conflicts.append({
                    'type': 'whitespace_issues_synonyms',
                    'severity': 'low',
                    'entry_id': entry_id,
                    'canonical': canonical,
                    'issue': "Synonym field has whitespace issues",
                    'original': synonym_str,
                    'suggested_fix': self._clean_whitespace(synonym_str)
                })
            
            plural_str = entry.get('plurals', '')
            if plural_str and (plural_str != plural_str.strip() or '  ' in plural_str):
                self.conflicts.append({
                    'type': 'whitespace_issues_plurals',
                    'severity': 'low',
                    'entry_id': entry_id,
                    'canonical': canonical,
                    'issue': "Plurals field has whitespace issues",
                    'original': plural_str,
                    'suggested_fix': self._clean_whitespace(plural_str)
                })
    
    def check_category_validity(self):
        """Check for invalid categories"""
        logging.info("🔍 Checking category validity...")
        
        for i, entry in enumerate(self.data):
            canonical = entry.get('canonical', '').strip()
            if not canonical:
                continue
            entry_id = canonical  # Use canonical as the primary key
            category = entry.get('category', '').strip()
            
            if category and category not in ALLOWED_CATEGORIES:
                self.conflicts.append({
                    'type': 'invalid_category',
                    'severity': 'medium',
                    'entry_id': entry_id,
                    'canonical': canonical,
                    'issue': f"Invalid category: '{category}'",
                    'invalid_category': category,
                    'allowed_categories': ALLOWED_CATEGORIES
                })
    
    def _deduplicate_synonyms(self, synonym_str):
        """Remove duplicate synonyms"""
        synonyms = split_and_clean(synonym_str)
        return join_set(synonyms)
    
    def _deduplicate_plurals(self, plural_str):
        """Remove duplicate plurals"""
        plurals = split_and_clean(plural_str)
        return join_set(plurals)
    
    def _remove_canonical_from_synonyms(self, canonical, synonym_str):
        """Remove canonical from synonyms"""
        synonyms = split_and_clean(synonym_str)
        synonyms.discard(canonical.lower())
        return join_set(synonyms)
    
    def _remove_canonical_from_plurals(self, canonical, plural_str):
        """Remove canonical from plurals"""
        plurals = split_and_clean(plural_str)
        plurals.discard(canonical.lower())
        return join_set(plurals)
    
    def _clean_whitespace(self, text):
        """Clean whitespace issues"""
        if not text:
            return text
        # Split by comma, strip each part, rejoin
        parts = [part.strip() for part in text.split(',') if part.strip()]
        return ', '.join(parts)
    
    def generate_summary(self):
        """Generate validation summary"""
        if not self.conflicts:
            logging.info("✅ No conflicts found! Lookup table is clean.")
            return
        
        # Count conflicts by type and severity
        by_type = defaultdict(int)
        by_severity = defaultdict(int)
        
        for conflict in self.conflicts:
            by_type[conflict['type']] += 1
            by_severity[conflict['severity']] += 1
        
        logging.info(f"📊 Validation Summary: {len(self.conflicts)} conflicts found")
        logging.info("By Severity:")
        for severity in ['critical', 'high', 'medium', 'low']:
            if severity in by_severity:
                logging.info(f"  - {severity.title()}: {by_severity[severity]}")
        
        logging.info("By Type:")
        for conflict_type, count in by_type.items():
            logging.info(f"  - {conflict_type.replace('_', ' ').title()}: {count}")
    
    def save_report(self):
        """Save detailed validation report to CSV"""
        if not self.conflicts:
            logging.info("No conflicts to report")
            return None
        
        # Ensure logs directory exists
        os.makedirs(LOGS_DIR, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_filename = f"lookup_validation_report_{timestamp}.csv"
        report_path = os.path.join(LOGS_DIR, report_filename)
        
        fieldnames = [
            "type", "severity", "entry_id", "canonical", "issue", 
            "details", "suggested_fix", "timestamp"
        ]
        
        with open(report_path, "w", newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            
            for conflict in self.conflicts:
                row = {
                    "type": conflict.get('type', ''),
                    "severity": conflict.get('severity', ''),
                    "entry_id": conflict.get('entry_id', ''),
                    "canonical": conflict.get('canonical', ''),
                    "issue": conflict.get('issue', ''),
                    "details": json.dumps({k: v for k, v in conflict.items() 
                                         if k not in ['type', 'severity', 'entry_id', 'canonical', 'issue']}),
                    "suggested_fix": conflict.get('suggested_fix', ''),
                    "timestamp": datetime.now().isoformat()
                }
                writer.writerow(row)
        
        logging.info(f"📄 Validation report saved to: {report_path}")
        return report_path

def main():
    """Main function to run lookup table validation"""
    logging.info("🚀 Starting Lookup Table Validation...")
    
    # Load configuration
    config = load_config()
    table_name = config["supabase_lookup_table"]
    
    logging.info(f"Validating table: {table_name}")
    
    try:
        # Initialize validator
        validator = LookupTableValidator(table_name)
        
        # Fetch data
        data = validator.fetch_data()
        if not data:
            logging.error("No data to validate")
            return
        
        # Run validation
        conflicts = validator.validate_all()
        
        # Save report
        report_path = validator.save_report()
        
        # Summary
        if conflicts:
            logging.info(f"❌ Validation completed with {len(conflicts)} conflicts found")
            if report_path:
                logging.info(f"📄 Detailed report saved to: {report_path}")
            logging.info("🔧 Run the interactive resolution script to fix conflicts")
        else:
            logging.info("✅ Validation completed successfully - no conflicts found!")
        
    except Exception as e:
        logging.error(f"❌ Error during validation: {e}")
        raise

if __name__ == "__main__":
    main()
