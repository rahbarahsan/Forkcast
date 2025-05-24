# Enhanced finalize_corrections.py

This script processes finalized ingredient CSVs and updates the Supabase ingredient_lookup table with comprehensive ingredient data including plurals, synonyms, and categories.

## Features

### 🚀 Enhanced Functionality

- **Inflect Integration**: Robust plural generation using the `inflect` library
- **Smart Merging**: Intelligently merges synonyms and plurals without duplicates
- **Universal Lookup**: Searches across canonical, synonym, and plural columns
- **Configuration-Driven**: Loads table names from `pipeline_config.json`
- **Comprehensive Logging**: Detailed CSV logs of all operations

### 🔍 Intelligent Processing

- **Attention Filtering**: Skips rows with `needs_attention=true`
- **Category Validation**: Only accepts predefined categories
- **Plural Auto-Generation**: Automatically generates plurals for names and synonyms
- **Enhanced Lookup**: Finds matches using singular/plural conversion

## Usage

### Prerequisites

1. Activate the admin virtual environment:

   ```bash
   cd backend
   source admin_utils/venv_admin/bin/activate  # Linux/Mac
   # or
   admin_utils\venv_admin\Scripts\activate     # Windows
   ```

2. Ensure you have a finalized CSV in `/finalized_csv/` directory

### Running the Script

```bash
cd backend
python -m admin_utils.scripts.finalize_corrections
```

## Input Requirements

### CSV Structure

The script expects CSV files with these columns:

- `name`: Ingredient name
- `normalized_name` or `normalize`: Canonical form
- `category`: Ingredient category
- `synonym_of` or `synonym`: Comma-separated synonyms
- `attention_needed` or `needs_attention`: Boolean flag (must be false)

### Example CSV Row

```csv
name,normalized_name,category,synonym_of,attention_needed
"roma tomato","tomato","Vegetables","cherry tomato,plum tomato",false
```

## Output

### 1. Supabase Updates

Updates the `ingredient_lookup` table with:

- **canonical**: Normalized ingredient name
- **synonym**: Comma-separated synonyms
- **plurals**: Comma-separated plural forms
- **category**: Validated category

### 2. Operation Logs

Creates detailed logs in `/logs/` directory:

```csv
timestamp,action,canonical,data
2025-01-23T10:30:00,INSERT,tomato,"{""canonical"":""tomato"",""synonym"":""roma tomato,cherry tomato""}"
2025-01-23T10:30:01,UPDATE,onion,"{""synonym"":""Added: yellow onion""}"
```

## Configuration

### pipeline_config.json

```json
{
  "supabase_lookup_table": "ingredient_lookup",
  "allow_category_override": false
}
```

### Allowed Categories

```python
ALLOWED_CATEGORIES = [
    "Vegetables", "Other", "Condiments & Spices",
    "Meat & Seafood", "Dairy", "Fruits", "Grains & Bakery"
]
```

## Processing Logic

### 1. Row Processing

```
For each CSV row:
├── Skip if attention_needed = true
├── Extract normalized_name
├── Look up existing entry (enhanced search)
├── If exists: Merge intelligently
└── If new: Create comprehensive entry
```

### 2. Smart Merging

```
Existing Entry + New Data:
├── Synonyms: Union of both sets
├── Plurals: Add plurals of new synonyms
├── Category: Update if empty or override allowed
└── Log all changes
```

### 3. Plural Generation

```
For each ingredient:
├── Generate plural of main name
├── Generate plural of normalized name
├── Generate plurals of all synonyms
└── Add all unique plurals to entry
```

## Examples

### Example 1: New Ingredient

**Input CSV:**

```csv
name,normalized_name,category,synonym_of
"roma tomato","tomato","Vegetables","cherry tomato"
```

**Output to Supabase:**

```json
{
  "canonical": "tomato",
  "synonym": "cherry tomato, roma tomato",
  "plurals": "cherry tomatoes, roma tomatoes, tomatoes",
  "category": "Vegetables"
}
```

### Example 2: Updating Existing

**Existing in Supabase:**

```json
{
  "canonical": "tomato",
  "synonym": "roma tomato",
  "plurals": "tomatoes",
  "category": "Vegetables"
}
```

**Input CSV:**

```csv
name,normalized_name,synonym_of
"beefsteak tomato","tomato","heirloom tomato"
```

**Updated in Supabase:**

```json
{
  "canonical": "tomato",
  "synonym": "heirloom tomato, roma tomato",
  "plurals": "beefsteak tomatoes, heirloom tomatoes, tomatoes",
  "category": "Vegetables"
}
```

## Testing

Run the test script to verify functionality:

```bash
cd backend/admin_utils
python test_finalize_corrections.py
```

This tests:

- Inflect plural generation
- Lookup functionality
- Enhanced search capabilities
- Utility functions

## Integration with Pipeline

### Complete Admin Pipeline

```
1. enrich_ingredients_from_supabase.py
   ↓ (Fetches recipes, creates parsed CSV)

2. Manual Review + Validation
   ↓ (Human validates, moves to finalized_csv/)

3. finalize_corrections_local.py (Optional)
   ↓ (LLM fixes attention_needed items)

4. push_to_grocery_items.py
   ↓ (Populates grocery_items_per_recipe)

5. finalize_corrections.py ← THIS SCRIPT
   ↓ (Enriches ingredient_lookup table)

✅ Enhanced lookup table for future processing
```

## Benefits

### 🎯 Improved Accuracy

- Handles irregular plurals correctly (tomato→tomatoes, knife→knives)
- Comprehensive synonym and plural coverage
- Validates categories against allowed list

### 🚀 Better Performance

- Efficient lookup using enhanced search
- Batch upsert operations
- Fallback to individual operations if needed

### 📊 Complete Tracking

- Detailed operation logs
- Change tracking for auditing
- Processing summaries

### 🔄 Future-Proof

- Universal lookup function for other scripts
- Configurable table names
- Extensible for additional fields

## Troubleshooting

### Common Issues

1. **No CSV files found**

   - Ensure finalized CSV exists in `/finalized_csv/` directory
   - Check file has `.csv` extension

2. **Supabase connection errors**

   - Verify `.env` file has correct credentials
   - Check network connectivity

3. **Import errors**

   - Ensure `inflect` is installed: `pip install inflect>=7.0.0`
   - Verify virtual environment is activated

4. **Permission errors**
   - Check write permissions for `/logs/` directory
   - Ensure Supabase user has table update permissions

### Debug Mode

Enable debug logging by modifying the script:

```python
logging.basicConfig(level=logging.DEBUG)
```

This provides detailed information about each processing step.
