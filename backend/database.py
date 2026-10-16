"""SQLite storage with a versioned reference catalog and private runtime records."""

import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "datasets" / "catalog.json"


class Database:
    def __init__(self, path: str | Path):
        self.path = Path(path).expanduser().resolve()

    @contextmanager
    def connect(self):
        conn = sqlite3.connect(self.path, timeout=15)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys=ON")
        try:
            with conn:
                yield conn
        finally:
            conn.close()

    def initialize(self):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
        with self.connect() as conn:
            conn.execute("PRAGMA journal_mode=WAL")
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS migrations (version INTEGER PRIMARY KEY);
                CREATE TABLE IF NOT EXISTS catalog_recipes (id TEXT PRIMARY KEY, data TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS parsed_ingredients (
                    recipe_id TEXT PRIMARY KEY REFERENCES catalog_recipes(id), data TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS ingredient_lookup (canonical TEXT PRIMARY KEY, data TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS records (
                    kind TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
                    PRIMARY KEY(kind, id)
                );
                INSERT OR IGNORE INTO migrations VALUES (1);
            """)
            for recipe in catalog["recipes"]:
                conn.execute(
                    "INSERT INTO catalog_recipes VALUES (?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data",
                    (recipe["id"], json.dumps(recipe)),
                )
                parsed = [
                    r for r in catalog["grocery_items_per_recipe"] if r["recipe_id"] == recipe["id"]
                ]
                conn.execute(
                    "INSERT INTO parsed_ingredients VALUES (?,?) ON CONFLICT(recipe_id) DO UPDATE SET data=excluded.data",
                    (recipe["id"], json.dumps(parsed)),
                )
            for item in catalog["ingredient_lookup"]:
                conn.execute(
                    "INSERT INTO ingredient_lookup VALUES (?,?) ON CONFLICT(canonical) DO UPDATE SET data=excluded.data",
                    (item["canonical"], json.dumps(item)),
                )

    def list(self, kind):
        with self.connect() as conn:
            rows = conn.execute(
                "SELECT data, created_at FROM records WHERE kind=? ORDER BY created_at, id", (kind,)
            ).fetchall()
            return [{**json.loads(r["data"]), "created_at": r["created_at"]} for r in rows]

    def get(self, kind, record_id):
        with self.connect() as conn:
            row = conn.execute(
                "SELECT data, created_at FROM records WHERE kind=? AND id=?", (kind, record_id)
            ).fetchone()
            return {**json.loads(row["data"]), "created_at": row["created_at"]} if row else None

    def save(self, kind, data, record_id=None):
        record_id = record_id or str(uuid4())
        record = {**data, "id": record_id}
        with self.connect() as conn:
            conn.execute(
                """INSERT INTO records(kind,id,data) VALUES (?,?,?)
                ON CONFLICT(kind,id) DO UPDATE SET data=excluded.data""",
                (kind, record_id, json.dumps(record)),
            )
        return self.get(kind, record_id)

    def delete(self, kind, record_id):
        with self.connect() as conn:
            return (
                conn.execute(
                    "DELETE FROM records WHERE kind=? AND id=?", (kind, record_id)
                ).rowcount
                > 0
            )

    def recipes(self):
        with self.connect() as conn:
            reference = [
                {**json.loads(r[0]), "source": "catalog"}
                for r in conn.execute("SELECT data FROM catalog_recipes ORDER BY id")
            ]
        overrides = {r["id"]: {**r, "source": "personal"} for r in self.list("recipe")}
        return [overrides.pop(r["id"], r) for r in reference] + list(overrides.values())

    def lookup(self):
        with self.connect() as conn:
            return [
                json.loads(r[0])
                for r in conn.execute("SELECT data FROM ingredient_lookup ORDER BY canonical")
            ]

    def preprocessed(self, recipe_ids):
        result = {}
        with self.connect() as conn:
            for recipe_id in recipe_ids:
                # A personal override always uses its current ingredient lines.
                if self.get("recipe", recipe_id):
                    continue
                row = conn.execute(
                    "SELECT data FROM parsed_ingredients WHERE recipe_id=?", (recipe_id,)
                ).fetchone()
                if row:
                    result[recipe_id] = json.loads(row[0])
        return result

    def activate_plan(self, plan_id):
        with self.connect() as conn:
            conn.execute("BEGIN IMMEDIATE")
            for row in conn.execute("SELECT id,data FROM records WHERE kind='plan'").fetchall():
                plan = json.loads(row["data"])
                plan["isActive"] = row["id"] == plan_id
                conn.execute(
                    "UPDATE records SET data=? WHERE kind='plan' AND id=?",
                    (json.dumps(plan), row["id"]),
                )

    def save_plan(self, data, record_id=None):
        record_id = record_id or str(uuid4())
        with self.connect() as conn:
            conn.execute("BEGIN IMMEDIATE")
            rows = conn.execute("SELECT id,data FROM records WHERE kind='plan'").fetchall()
            plan = {**data, "id": record_id}
            if not rows:
                plan["isActive"] = True
            if plan.get("isActive"):
                for row in rows:
                    previous = json.loads(row["data"])
                    previous["isActive"] = False
                    conn.execute(
                        "UPDATE records SET data=? WHERE kind='plan' AND id=?",
                        (json.dumps(previous), row["id"]),
                    )
            conn.execute(
                """INSERT INTO records(kind,id,data) VALUES ('plan',?,?)
                ON CONFLICT(kind,id) DO UPDATE SET data=excluded.data""",
                (record_id, json.dumps(plan)),
            )
        return self.get("plan", record_id)

    def save_many(self, kind, items):
        ids = []
        with self.connect() as conn:
            for item in items:
                record_id = str(uuid4())
                conn.execute(
                    "INSERT INTO records(kind,id,data) VALUES (?,?,?)",
                    (kind, record_id, json.dumps({**item, "id": record_id})),
                )
                ids.append(record_id)
        return [self.get(kind, record_id) for record_id in ids]
