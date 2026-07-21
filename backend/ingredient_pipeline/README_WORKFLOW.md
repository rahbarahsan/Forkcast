# Admin Utils Pipeline Workflow

This guide walks you through the complete ingredient processing pipeline with flexible options for parsing, validation, and correction.

## 🚀 Quick Start

### Prerequisites

1. **Activate the admin virtual environment**

   ```bash
   cd backend
   source ingredient_pipeline/venv_admin/bin/activate  # Linux/Mac
   # or
   ingredient_pipeline\venv_admin\Scripts\activate     # Windows
   ```

2. **Configure your settings**
   - Copy `ingredient_pipeline/config/pipeline_config_example.json` to `ingredient_pipeline/config/pipeline_config.json`
   - Update the configuration as needed (see Configuration section below)

## 📋 Complete Pipeline Steps

### Step 1: Parse Ingredients from Supabase

```bash
cd backend
python -m ingredient_pipeline.scripts.enrich_ingredients_from_supabase
```

**Two Parsing Modes Available:**

#### 🆓 **Local Mode** (`parsing_mode: "local"`)

- **Pros**: Free, fast, no API costs
- **Cons**: Less accurate for complex ingredients
- **Best for**: Clean, simple ingredient lists

#### 🎯 **API Mode** (`parsing_mode: "api"`)

- **Pros**: More accurate, handles complex ingredients
- **Cons**: Costs money, slower
- **Best for**: Complex or messy ingredient data

**What it does:**

- Fetches recipes from your Supabase table
- Parses ingredient strings into structured data (quantity, unit, name, modifiers, etc.)
- Creates CSV file in `ingredient_pipeline/csv/` folder
- Also creates copy in `ingredient_pipeline/csv/finalized_csv/` folder
- Flags problematic entries with `needs_attention = true`

**Output:** `parsed_ingredients_YYYYMMDD_HHMMSS.csv`

### Step 2: Validation & Correction (Multiple Options)

#### Option A: Manual Review Only

1. **Review the generated CSV** in `ingredient_pipeline/csv/finalized_csv/`
2. **Fix any issues manually** in your preferred CSV editor
3. **Save the corrected file**

#### Option B: LLM-Assisted Corrections

If you have entries with `attention_needed = true` and want AI help:

```bash
cd backend
python -m ingredient_pipeline.scripts.finalize_corrections_local
```

**What it does:**

- Finds rows with `attention_needed = True`
- Uses AI to fix missing or incorrect data
- Enriches data from existing lookup table
- Updates the finalized CSV with corrections

#### Option C: Combined Approach (Recommended)

1. **Manual review first** - fix obvious issues
2. **Run LLM corrections** - let AI handle the tricky ones
3. **Final manual check** - verify AI corrections

**⚠️ Important:** Keep only ONE file in `finalized_csv/` folder to avoid extra API costs!

### Step 3: Push to Grocery Items Table

```bash
cd backend
python -m ingredient_pipeline.scripts.push_to_grocery_items
```

**What it does:**

- Validates data format and completeness
- Checks for duplicates and conflicts
- Pushes entries to your grocery items table in Supabase
- Includes error handling and rollback capabilities
- Populates the main ingredient database

**Built-in Safety Checks:**

- ✅ Data format validation
- ✅ Required field verification
- ✅ Duplicate detection
- ✅ Category validation

### Step 4: Enrich Lookup Table

```bash
cd backend
python -m ingredient_pipeline.scripts.finalize_corrections
```

**What it does:**

- Processes finalized ingredients intelligently
- Updates the ingredient lookup table with:
  - **Synonyms and plurals** (using inflect library)
  - **Categories** (validated against allowed list)
  - **Enhanced search data**
- Uses smart merging logic to prevent conflicts
- Creates comprehensive logs for tracking

**Smart Features:**

- 🔄 Automatic plural generation (tomato → tomatoes, knife → knives)
- 🔍 Enhanced lookup capabilities
- 🛡️ Conflict prevention during updates
- 📊 Detailed operation logging

### Step 5: Validate Lookup Table (Recommended)

```bash
cd backend
python -m ingredient_pipeline.scripts.validate_lookup_table
```

**What it does:**

- Scans lookup table for conflicts and duplicates
- Generates detailed validation report
- Identifies issues like:
  - Duplicate synonyms within entries
  - Conflicting canonical names
  - Cross-entry synonym conflicts
  - Data quality problems

**If conflicts found, run the interactive resolver:**

```bash
cd backend
python -m ingredient_pipeline.scripts.resolve_lookup_conflicts
```

**Interactive Resolution Features:**

- 🔧 Step-by-step conflict resolution
- 💾 Automatic backup before changes
- 🎯 Multiple resolution options per conflict
- 📝 Comprehensive change logging

## ⚙️ Configuration

### Pipeline Config (`ingredient_pipeline/config/pipeline_config.json`)

```json
{
  "parsing_mode": "local",
  "supabase_lookup_table": "ingredient_lookup",
  "supabase_grocery_table": "grocery_items_per_recipe",
  "use_full_recipe_table": true,
  "selected_recipe_ids": [],
  "save_with_timestamp": true,
  "allow_category_override": false,
  "gpt_model": "gpt-3.5-turbo",
  "track_api_usage": true,
  "max_api_retries": 3
}
```

**Key Settings:**

- **`parsing_mode`**:
  - `"local"` = Code-based parsing (free, faster)
  - `"api"` = AI parsing (costs money, more accurate)
- **`supabase_lookup_table`**: Your ingredient lookup table name
- **`supabase_grocery_table`**: Your grocery items table name
- **`use_full_recipe_table`**: `true` = process all recipes, `false` = use selected IDs
- **`selected_recipe_ids`**: Array of specific recipe IDs to process
- **`allow_category_override`**: Allow overwriting existing categories

### Environment Variables

Make sure your `.env` files are configured:

- `ingredient_pipeline/config/.env` - Supabase and OpenAI credentials
- `backend/.env` - Main app credentials

## 🔄 Flexible Workflow Options

### 🚀 **Fast & Free Workflow**

```
Local parsing → Manual review → Push → Lookup update → Validate
```

**Best for**: Clean data, budget-conscious processing

### 🎯 **Accurate & Assisted Workflow**

```
API parsing → Manual review → LLM corrections → Push → Lookup update → Validate
```

**Best for**: Complex data, maximum accuracy needed

### ⚖️ **Balanced Workflow** (Recommended)

```
Local parsing → Manual review → LLM corrections (flagged items) → Push → Lookup update → Validate
```

**Best for**: Most use cases, good balance of cost and accuracy

### 🔧 **Development/Testing Workflow**

```
Local parsing → Manual review → Push → Lookup update → Validate → Resolve conflicts
```

**Best for**: Testing, development, data cleanup

## 📊 What Each Script Does

| Script                                | Purpose                | Input                    | Output                   | Cost        |
| ------------------------------------- | ---------------------- | ------------------------ | ------------------------ | ----------- |
| `enrich_ingredients_from_supabase.py` | Parse raw ingredients  | Supabase recipes         | CSV with parsed data     | Free/Paid\* |
| `finalize_corrections_local.py`       | AI-assisted fixes      | CSV with attention flags | Corrected CSV            | Paid        |
| `push_to_grocery_items.py`            | Populate grocery table | Finalized CSV            | Supabase grocery entries | Free        |
| `finalize_corrections.py`             | Enrich lookup table    | Finalized CSV            | Enhanced lookup table    | Free        |
| `validate_lookup_table.py`            | Check for conflicts    | Lookup table             | Validation report        | Free        |
| `resolve_lookup_conflicts.py`         | Fix conflicts          | Validation report        | Clean lookup table       | Free        |

\*Depends on `parsing_mode` setting

## 🔄 Complete Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    INGREDIENT PROCESSING PIPELINE               │
└─────────────────────────────────────────────────────────────────┘

1. 📥 PARSE INGREDIENTS
   ├── enrich_ingredients_from_supabase.py
   ├── Mode: Local (free) OR API (paid)
   ├── Input: Supabase recipes table
   └── Output: parsed_ingredients_*.csv

2. 👁️ VALIDATION & CORRECTION
   ├── Manual Review (always recommended)
   ├── LLM Corrections (optional, for flagged items)
   ├── Combined approach (recommended)
   └── Keep only ONE file in finalized_csv/

3. 📤 PUSH TO DATABASE
   ├── push_to_grocery_items.py
   ├── Built-in validation & safety checks
   ├── Input: Finalized CSV
   └── Output: Populated grocery_items table

4. 🔍 ENRICH LOOKUP TABLE
   ├── finalize_corrections.py
   ├── Smart merging & conflict prevention
   ├── Input: Finalized CSV
   └── Output: Enhanced ingredient_lookup table

5. ✅ VALIDATE & CLEAN
   ├── validate_lookup_table.py (detect conflicts)
   ├── resolve_lookup_conflicts.py (fix conflicts)
   └── Output: Clean, conflict-free lookup table
```

## 💡 Tips & Best Practices

### Before You Start

- ✅ Activate the virtual environment
- ✅ Check your configuration files
- ✅ Ensure Supabase credentials are set
- ✅ Backup your database (optional but recommended)
- ✅ Choose appropriate parsing mode for your data

### During Processing

- 📁 Keep only ONE file in `finalized_csv/` folder
- 👀 Review CSV data before pushing to database
- 💰 Use `parsing_mode: "local"` to minimize costs
- 📝 Check logs for any errors or warnings
- 🔄 Run validation after each major step

### After Processing

- 🔍 Always run validation to check for conflicts
- 📊 Review processing logs for insights
- 🧹 Clean up old CSV files if needed
- 📈 Monitor lookup table performance
- 🎯 Test ingredient matching in your app

### Cost Optimization

- 🆓 Use local parsing for simple ingredients
- 🎯 Use API parsing only for complex cases
- 📊 Track API usage with `track_api_usage: true`
- 🔄 Process in smaller batches to control costs

### Troubleshooting

- **No CSV generated?** Check Supabase connection and recipe data
- **API errors?** Verify OpenAI credentials and model settings
- **Push failures?** Check table permissions and data format
- **Validation conflicts?** Run the interactive resolver
- **High costs?** Switch to local parsing mode

## 📁 File Structure

```
backend/ingredient_pipeline/
├── config/
│   ├── pipeline_config.json          # Main configuration
│   ├── .env                          # Supabase & API credentials
│   └── pipeline_config_example.json  # Configuration template
├── csv/
│   ├── parsed_ingredients_*.csv      # Generated CSV files
│   └── finalized_csv/               # Ready-to-process files (keep only 1!)
├── logs/                            # Processing logs and reports
│   ├── lookup_validation_report_*.csv
│   ├── lookup_table_backup_*.csv
│   └── conflict_resolution_log_*.csv
├── scripts/                         # All processing scripts
└── utils/                          # Shared utilities
```

## 🆘 Need Help?

- **Configuration issues?** Check `pipeline_config_example.json` for reference
- **Script errors?** Look in the `logs/` folder for detailed error messages
- **Lookup conflicts?** See `README_lookup_validation.md` for detailed conflict resolution
- **Processing details?** Check `README_finalize_corrections.md` for advanced features
- **Cost concerns?** Use local parsing mode and batch processing

---

**🎯 Goal:** Transform raw recipe ingredients into a clean, searchable, intelligent ingredient database that powers your grocery planning system with maximum flexibility and control!
