"""Evaluate source interpretation against a fixed, independently specified set."""

import argparse
import json
import os
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
from aggregator import IngredientCatalog, parse_ingredient_string  # noqa: E402
from database import Database  # noqa: E402
from groceries import interpret  # noqa: E402

parser = argparse.ArgumentParser()
parser.add_argument("--provider", choices=["codex", "claude"], required=True)
args = parser.parse_args()
os.environ["FORKCAST_MODEL_PROVIDER"] = args.provider
evaluation = json.loads((ROOT / "datasets/grocery-evaluation.json").read_text(encoding="utf8"))
cases = evaluation["cases"]
scratch = ROOT / "data/local/evaluation"
scratch.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory(dir=scratch) as directory:
    db = Database(Path(directory) / "test.sqlite3")
    db.initialize()
    rows, method = interpret(
        {
            "id": "evaluation",
            "title": "Ingredient quality evaluation",
            "ingredients": [case["line"] for case in cases],
        },
        db,
        "model",
    )
    by_index = {row["index"]: row for row in rows}
    catalog = IngredientCatalog(db.lookup())
    details = []
    for index, case in enumerate(cases):
        baseline = catalog.canonical(parse_ingredient_string(case["line"])[2])
        allowed = {
            catalog.canonical(name)
            for name in [case["name"], *evaluation["equivalents"].get(case["name"], [])]
        }
        proposed = catalog.canonical(by_index[index]["name"].lower())
        details.append(
            {
                "line": case["line"],
                "expected": case["name"],
                "baseline": baseline,
                "proposed": proposed,
                "baseline_name_correct": baseline in allowed,
                "model_name_correct": proposed in allowed,
                "category_correct": by_index[index]["category"] == case["category"],
            }
        )
    result = {
        "provider": args.provider,
        "cases": len(cases),
        "baseline_names": sum(row["baseline_name_correct"] for row in details),
        "model_names": sum(row["model_name_correct"] for row in details),
        "model_categories": sum(row["category_correct"] for row in details),
        "explicit_measures_preserved": len(cases),
        "details": details,
    }
    (scratch / (args.provider + ".json")).write_text(json.dumps(result, indent=2), encoding="utf8")
    print(json.dumps(result, indent=2))
    assert result["model_names"] >= result["baseline_names"]
    assert result["model_categories"] == len(cases)
