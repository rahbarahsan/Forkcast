"""Optional live subscription evaluation; works only in a disposable database."""

import argparse
import os
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
from assistant import ChatInput, apply_task, chat  # noqa: E402
from database import Database  # noqa: E402
from groceries import generate  # noqa: E402
from youtube import preview_video  # noqa: E402

parser = argparse.ArgumentParser()
parser.add_argument("--provider", choices=["codex", "claude"], required=True)
parser.add_argument("--youtube", action="store_true")
args = parser.parse_args()
os.environ["FORKCAST_MODEL_PROVIDER"] = args.provider
scratch = ROOT / "data/local/smoke"
scratch.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory(dir=scratch) as directory:
    db = Database(Path(directory) / "evaluation.sqlite3")
    db.initialize()
    recipe = db.save(
        "recipe",
        {
            "title": "Garlic cumin chicken",
            "ingredients": [
                "500 g boneless halal chicken thighs",
                "2 cloves garlic, finely minced",
                "1 tbsp extra virgin olive oil",
                "1 tsp ground cumin",
            ],
            "instructions": "Marinate and cook chicken thoroughly.",
        },
    )
    grocery = generate(db, [recipe], [{"name": "garlic", "quantity": "1 clove"}], mode="model")
    assert not grocery["warnings"], grocery["warnings"]
    assert "model" in grocery["method"], grocery["method"]
    assert grocery["raw"]["garlic"] == {"clove": 1}, grocery["raw"]
    assert len(grocery["items"]) == 4, grocery["raw"]
    assert all(item["category"] != "Other" for item in grocery["items"])
    print(
        args.provider
        + ": semantic grocery interpretation, source coverage and exact stock deduction passed",
        flush=True,
    )
    conversation = chat(
        db, ChatInput(message="Add 500 g rice to my pantry. Do not change anything else.")
    )
    message = conversation["messages"][-1]
    assert message["task_id"] and db.list("pantry") == []
    apply_task(db, message["task_id"])
    assert len(db.list("pantry")) == 1 and db.list("pantry")[0]["quantity"] == "500 g"
    apply_task(db, message["task_id"])
    assert len(db.list("pantry")) == 1
    print(
        args.provider + ": LangGraph task preview, apply and duplicate prevention passed",
        flush=True,
    )
    if args.youtube:
        video = preview_video("https://www.youtube.com/watch?v=3SlIQtHsToc")
        assert video["recipe"] and len(video["recipe"]["ingredients"]) >= 10, video["warnings"]
        assert "food fusion" in video["recipe"]["source_name"].lower()
        assert not any("facebook.com" in line for line in video["recipe"]["ingredients"])
        print(
            args.provider + ": public YouTube recipe fetch and model interpretation passed",
            flush=True,
        )
print("Disposable evaluation finished; personal application records were not changed.")
