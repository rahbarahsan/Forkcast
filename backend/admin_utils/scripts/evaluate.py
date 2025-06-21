import csv
from datetime import datetime
import os
import argparse

def evaluate_parsed_ingredients(parsed_path):
    with open(parsed_path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    scores = []
    log = []
    field_counts = {"name": 0, "quantity": 0, "unit": 0, "modifiers": 0, "category": 0}
    total_possible = len(rows) * 5  # 5 fields if category is included

    for row in rows:
        score = 0
        log_entry = f"RAW: {row.get('raw_text', '')} | Parsed → "

        if row.get("name"): 
            score += 1
            field_counts["name"] += 1
            log_entry += f"name: {row['name']} "

        if row.get("quantity"): 
            score += 1
            field_counts["quantity"] += 1
            log_entry += f"quantity: {row['quantity']} "

        if row.get("unit"): 
            score += 1
            field_counts["unit"] += 1
            log_entry += f"unit: {row['unit']} "

        if row.get("modifiers"): 
            score += 1
            field_counts["modifiers"] += 1
            log_entry += f"modifiers: {row['modifiers']} "

        if row.get("category"): 
            score += 1
            field_counts["category"] += 1
            log_entry += f"category: {row['category']} "

        log.append(log_entry.strip())
        scores.append(score)

    avg_score = sum(scores) / total_possible * 100
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    print(f"📊 Evaluation Report @ {timestamp}")
    print(f"Average Parsing Score: {avg_score:.2f}% over {len(rows)} entries")
    
    print("\n🔍 Field-specific stats:")
    for field, count in field_counts.items():
        field_pct = (count / len(rows)) * 100
        print(f"  {field}: {count}/{len(rows)} ({field_pct:.2f}%)")

    print("\n📈 Score distribution:")
    score_distribution = [0, 0, 0, 0, 0, 0]  # For scores 0-5
    for score in scores:
        score_distribution[score] += 1
    for i, count in enumerate(score_distribution):
        pct = (count / len(rows)) * 100
        print(f"  {i} fields: {count} ingredients ({pct:.2f}%)")

    print("\n📋 Detailed parsing results:")
    for line in log:
        print(line)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=str, required=True, help="Path to enriched CSV file")
    args = parser.parse_args()

    evaluate_parsed_ingredients(args.source)
