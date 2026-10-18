# Recipe photographs

The 50 reference recipes each have a distinct, locally bundled real photograph.
These are representative serving photographs, rather than photographs of our
adapted methods being cooked. Garnishes, sides and presentation can differ.
Photography does not establish halal certification of the pictured ingredients.
The salmon kebabs, satay curry and machboos cards explicitly identify their
related serving variations. The satay photograph shows skewers with sauce on
the side; the recipe makes a curry.

Each card includes its photographer's credit, a link to the original file page,
and a license link. No image host is contacted to browse the collection. Credit
links open only when selected. Personal recipes without a bundled photograph use
the existing kitchen illustration.

## Sources and licenses

[The photo manifest](../datasets/photo-credits.json) records the original file
title, author, source page, download URL, license, retrieval date, representative
description and SHA-256 of every bundled photograph. Image licenses are separate
from the application code's license. Preserve these credits and the applicable
license when redistributing the collection. Share-alike photographs retain their
specified Creative Commons license; this does not relicense the application.

The files are Wikimedia's resized JPEG renditions, downloaded without further
pixel edits. Cards use a cover layout, so the visible framing changes with the
screen size. The manifest records this presentation change. Original files and
licensing details remain available through each source link.

## Updating the collection

1. Select a genuine photograph of the dish, check its file-page license and
   authorship, and review the image visually. Check the actual preparation and
   presentation; search titles alone can be misleading.
2. Save an appropriately sized JPEG in `app/assets/recipes/`. Update the public
   manifest with its provenance and checksum, and set the reference recipe's
   image key in `datasets/catalog.json`. Never export personal records.
3. Run `python scripts/prepare_recipe_photos.py --write`, then format the generated
   `app/src/data/recipePhotos.ts` with the app's Prettier command.
4. Run `python scripts/prepare_recipe_photos.py`, the app checks, export, and the
   desktop/phone photo browser tests. The validator checks complete coverage,
   distinct files, checksums, licenses, local asset imports and collection size.

Metro needs static image imports to include assets in web, Android and iOS
bundles. The generated map provides these imports. No photo API key is required.
