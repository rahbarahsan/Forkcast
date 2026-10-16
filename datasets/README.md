# Reference catalog

`catalog.json` is the portable application dataset recovered from the checked-in
SQL seed. It contains six recipes, 90 parsed ingredient rows, and 45 ingredient
lookup entries. Images refer to bundled app assets, so the catalog has no hosted
image dependency.

The backend seeds these reference tables automatically on first startup and can
repeat seeding safely. Personal recipes, pantry items, plans, history, and offers
are stored separately in `data/local/forkcast.sqlite3`, which is ignored by Git.
There is no automatic export of personal records into this dataset.

Some historical parsed rows contain spreadsheet-corrupted quantities or ambiguous
names. The runtime validates quantities and falls back to parsing the original
recipe line when a prepared row is unusable.
