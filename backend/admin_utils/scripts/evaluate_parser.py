import csv
from datetime import datetime

def evaluate_parsed_ingredients(parsed_path):
    with open(parsed_path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    scores = []
    log = []
    field_counts = {"name": 0, "quantity": 0, "unit": 0, "modifiers": 0, "category": 0, "canonical": 0, "plural": 0}
    total_possible = len(rows) * 7  # 7 fields per row

    for row in rows:
        score = 0
        log_entry = f"RAW: {row['raw_text']} | Parsed → "

        if row["name"]: 
            score += 1
            field_counts["name"] += 1
            log_entry += f"name: {row['name']} "
        
        if row["quantity"]: 
            score += 1
            field_counts["quantity"] += 1
            log_entry += f"quantity: {row['quantity']} "
        
        if row["unit"]: 
            score += 1
            field_counts["unit"] += 1
            log_entry += f"unit: {row['unit']} "
        
        if row["modifiers"]: 
            score += 1
            field_counts["modifiers"] += 1
            log_entry += f"modifiers: {row['modifiers']} "
            
        if row["category"]: 
            score += 1
            field_counts["category"] += 1
            log_entry += f"category: {row['category']} "
            
        if row["canonical"]: 
            score += 1
            field_counts["canonical"] += 1
            log_entry += f"canonical: {row['canonical']} "
            
        if row["plural"]: 
            score += 1
            field_counts["plural"] += 1
            log_entry += f"plural: {row['plural']} "

        log.append(log_entry.strip())
        scores.append(score)

    avg_score = sum(scores) / total_possible * 100
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    print(f"📊 Evaluation Report @ {timestamp}")
    print(f"Average Parsing Score: {avg_score:.2f}% over {len(rows)} entries")
    
    # Print field-specific stats
    print("\n🔍 Field-specific stats:")
    for field, count in field_counts.items():
        field_pct = (count / len(rows)) * 100
        print(f"  {field}: {count}/{len(rows)} ({field_pct:.2f}%)")
    
    # Print score distribution
    score_distribution = [0, 0, 0, 0, 0, 0, 0, 0]  # For scores 0-7
    for score in scores:
        if score < len(score_distribution):
            score_distribution[score] += 1
    
    print("\n📈 Score distribution:")
    for i, count in enumerate(score_distribution):
        pct = (count / len(rows)) * 100
        print(f"  {i} fields: {count} ingredients ({pct:.2f}%)")
    
    print("\n📋 Detailed parsing results:")
    for line in log:
        print(line)

if __name__ == "__main__":
    import os
    parsed_path = os.path.join(os.path.dirname(__file__), "..", "csv", "parsed_ingredients_haiku.csv")
    evaluate_parsed_ingredients(parsed_path)
