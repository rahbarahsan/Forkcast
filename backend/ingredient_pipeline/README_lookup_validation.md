# Lookup Table Validation & Conflict Resolution

This document describes the comprehensive validation and conflict resolution system for the ingredient lookup table.

## 🔍 Overview

The lookup table validation system consists of two main scripts:

1. **`validate_lookup_table.py`** - Detects and reports conflicts
2. **`resolve_lookup_conflicts.py`** - Interactive conflict resolution

## 📋 Conflict Types Detected

### **Internal Entry Issues**

#### 1. **Duplicate Synonyms**

- **Issue**: Same synonym appears multiple times in one entry
- **Example**: `synonym: "cherry tomato, roma tomato, cherry tomato"`
- **Severity**: Medium
- **Fix**: Remove duplicates automatically

#### 2. **Duplicate Plurals**

- **Issue**: Same plural appears multiple times in one entry
- **Example**: `plurals: "tomatoes, cherry tomatoes, tomatoes"`
- **Severity**: Medium
- **Fix**: Remove duplicates automatically

#### 3. **Canonical Self-References**

- **Issue**: Canonical name appears in its own synonyms/plurals
- **Example**: `canonical: "tomato", synonym: "cherry tomato, tomato"`
- **Severity**: High
- **Fix**: Remove canonical from synonyms/plurals

#### 4. **Whitespace Issues**

- **Issue**: Extra spaces, leading/trailing whitespace
- **Example**: `synonym: " cherry tomato , roma tomato  "`
- **Severity**: Low
- **Fix**: Clean whitespace automatically

### **Cross-Entry Conflicts**

#### 5. **Duplicate Canonical Names**

- **Issue**: Same canonical name in multiple entries
- **Example**: Two entries both have `canonical: "tomato"`
- **Severity**: Critical
- **Fix**: Merge entries or delete duplicates

#### 6. **Synonym in Multiple Entries**

- **Issue**: Same synonym appears in different entries
- **Example**: "cherry tomato" in both "tomato" and "grape tomato" entries
- **Severity**: High
- **Fix**: Choose which entry should keep the synonym

#### 7. **Canonical-Plural Conflicts**

- **Issue**: One entry's canonical matches another's plural
- **Example**:
  - Entry 1: `canonical: "tomato"`
  - Entry 2: `canonical: "tomatoes", plurals: "tomatoes"`
- **Severity**: Critical
- **Fix**: Merge entries or remove conflicting plural

#### 8. **Canonical-Synonym Conflicts**

- **Issue**: One entry's canonical appears as synonym in another
- **Example**:
  - Entry 1: `canonical: "tomato"`
  - Entry 2: `canonical: "vegetable", synonym: "tomato"`
- **Severity**: High
- **Fix**: Remove synonym or merge entries

### **Data Quality Issues**

#### 9. **Empty Canonical Names**

- **Issue**: Entry has no canonical name
- **Severity**: Critical
- **Fix**: Manual intervention required

#### 10. **Invalid Categories**

- **Issue**: Category not in allowed list
- **Example**: `category: "InvalidCategory"`
- **Severity**: Medium
- **Fix**: Choose valid category or clear field

## 🚀 Usage

### **Step 1: Run Validation**

```bash
cd backend
python -m ingredient_pipeline.scripts.validate_lookup_table
```

**Output:**

- Console summary of conflicts found
- Detailed CSV report in `/logs/` directory
- Categorized by severity (Critical, High, Medium, Low)

### **Step 2: Resolve Conflicts (Optional)**

```bash
cd backend
python -m ingredient_pipeline.scripts.resolve_lookup_conflicts
```

**Features:**

- Interactive conflict resolution
- Automatic backup creation
- Severity-based processing order
- Multiple resolution options per conflict
- Comprehensive logging

## 📊 Validation Report

### **Console Output Example**

```
🔍 Starting comprehensive lookup table validation...
📊 Validation Summary: 15 conflicts found

By Severity:
  - Critical: 3
  - High: 5
  - Medium: 4
  - Low: 3

By Type:
  - Synonym In Multiple Entries: 5
  - Internal Duplicate Synonyms: 3
  - Canonical Plural Conflict: 2
  - Whitespace Issues Synonyms: 3
  - Invalid Category: 2
```

### **CSV Report Fields**

- `type` - Conflict type
- `severity` - Critical/High/Medium/Low
- `entry_id` - Affected entry ID
- `canonical` - Canonical name
- `issue` - Human-readable description
- `details` - JSON with additional data
- `suggested_fix` - Automatic fix suggestion
- `timestamp` - When detected

## 🔧 Interactive Resolution

### **Resolution Options by Conflict Type**

#### **Internal Duplicates**

1. Apply suggested fix (remove duplicates)
2. Edit manually
3. Skip

#### **Synonym Conflicts**

1. Keep synonym in first entry only
2. Keep synonym in last entry only
3. Choose which entry to keep it in
4. Remove from all entries
5. Skip

#### **Canonical-Plural Conflicts**

1. Merge entries (keep canonical as primary)
2. Remove from plurals
3. Skip

#### **Duplicate Canonical Names**

1. Merge all entries into first one
2. Keep first entry, delete others
3. Choose which entry to keep
4. Skip

#### **Invalid Categories**

1. Choose valid category from list
2. Clear category field
3. Skip

### **Safety Features**

#### **Automatic Backup**

- Creates CSV backup before any changes
- Stored in `/logs/` with timestamp
- Includes all table data

#### **Change Logging**

- Every fix is logged with details
- Timestamp and operation type recorded
- Can be used for audit trails

#### **Rollback Capability**

- Backup can be used to restore original state
- All changes are tracked for reversal

## 📁 File Structure

```
backend/ingredient_pipeline/
├── scripts/
│   ├── validate_lookup_table.py      # Main validation script
│   ├── resolve_lookup_conflicts.py   # Interactive resolution
│   └── ...
├── utils/
│   └── ingredient_lookup.py          # Shared utilities
├── logs/                             # Generated reports
│   ├── lookup_validation_report_*.csv
│   ├── lookup_table_backup_*.csv
│   └── conflict_resolution_log_*.csv
└── config/
    └── pipeline_config.json          # Table configuration
```

## ⚙️ Configuration

### **pipeline_config.json**

```json
{
  "supabase_lookup_table": "ingredient_lookup"
}
```

### **Allowed Categories**

```python
ALLOWED_CATEGORIES = [
    "Vegetables", "Other", "Condiments & Spices",
    "Meat & Seafood", "Dairy", "Fruits", "Grains & Bakery"
]
```

## 🔄 Integration with Pipeline

### **Recommended Workflow**

```
1. Run ingredient processing pipeline
   ↓
2. Run finalize_corrections.py
   ↓
3. Run validate_lookup_table.py ← CHECK FOR CONFLICTS
   ↓
4. If conflicts found:
   ├── Run resolve_lookup_conflicts.py
   ├── Fix conflicts interactively
   └── Re-run validation to confirm
   ↓
5. Continue with normal operations
```

### **Automation Possibilities**

#### **Scheduled Validation**

- Run validation weekly/monthly
- Email reports to administrators
- Flag critical issues for immediate attention

#### **Pre-Processing Validation**

- Validate before major operations
- Prevent conflicts from propagating
- Maintain data quality standards

## 📈 Benefits

### **Data Quality Assurance**

- **Prevents lookup failures** due to conflicts
- **Ensures consistency** across the system
- **Maintains referential integrity** of ingredient data

### **Improved User Experience**

- **Better pantry matching** with clean synonym data
- **Accurate ingredient recognition** without duplicates
- **Consistent categorization** for filtering/grouping

### **System Reliability**

- **Reduces processing errors** from malformed data
- **Prevents infinite loops** from circular references
- **Maintains performance** with optimized lookups

### **Maintenance Efficiency**

- **Automated conflict detection** saves manual review time
- **Interactive resolution** provides control over fixes
- **Comprehensive logging** enables audit trails

## 🚨 Critical Conflict Examples

### **Example 1: Canonical-Plural Conflict**

```
Entry 1: canonical="tomato", plurals="tomatoes"
Entry 2: canonical="tomatoes", plurals="tomatoes"

Problem: "tomatoes" lookup is ambiguous
Solution: Merge entries or remove duplicate canonical
```

### **Example 2: Synonym Cross-Contamination**

```
Entry 1: canonical="tomato", synonym="cherry tomato"
Entry 2: canonical="grape tomato", synonym="cherry tomato"

Problem: "cherry tomato" maps to multiple canonicals
Solution: Decide which entry should own "cherry tomato"
```

### **Example 3: Self-Reference Loop**

```
Entry: canonical="tomato", synonym="tomato, roma tomato"

Problem: Circular reference in lookup
Solution: Remove "tomato" from synonyms
```

## 💡 Best Practices

### **Regular Validation**

- Run validation after bulk imports
- Schedule periodic checks
- Validate before production deployments

### **Conflict Prevention**

- Use validation in finalize_corrections.py
- Implement checks in data entry workflows
- Train users on proper data entry

### **Resolution Strategy**

- Handle critical conflicts first
- Batch similar conflicts together
- Document resolution decisions

### **Backup Strategy**

- Always create backups before changes
- Keep multiple backup versions
- Test restoration procedures

---

_This validation system ensures your ingredient lookup table remains clean, consistent, and reliable for optimal system performance._
