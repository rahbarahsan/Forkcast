"""Create a consistent SQLite backup, including committed WAL transactions."""

import argparse
from contextlib import closing
import os
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def backup(source: Path, destination: Path):
    source, destination = source.resolve(), destination.expanduser().resolve()
    if not source.is_file():
        raise ValueError("Database does not exist; start Forkcast first")
    if destination.exists() or source == destination:
        raise ValueError("Choose a new backup path; existing files are never overwritten")
    destination.parent.mkdir(parents=True, exist_ok=True)
    # Exclusive creation prevents overwriting an existing file after the check.
    with destination.open("xb"):
        pass
    try:
        with closing(sqlite3.connect(source.as_uri() + "?mode=ro", uri=True)) as origin:
            with closing(sqlite3.connect(destination)) as target:
                with target:
                    origin.backup(target)
    except Exception:
        destination.unlink(missing_ok=True)
        raise


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("destination", type=Path)
    parser.add_argument(
        "--source",
        type=Path,
        default=Path(os.getenv("FORKCAST_DATABASE", ROOT / "data/local/forkcast.sqlite3")),
    )
    args = parser.parse_args()
    backup(args.source, args.destination)
    print(f"Backup saved to {args.destination.resolve()}")
