"""Validate bundled recipe photographs and build their static native asset map."""

import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "datasets/photo-credits.json"
OUTPUT = ROOT / "app/src/data/recipePhotos.ts"


def render():
    catalog = json.loads((ROOT / "datasets/catalog.json").read_text(encoding="utf8"))
    photos = json.loads(MANIFEST.read_text(encoding="utf8"))["photos"]
    recipes = {recipe["id"]: recipe for recipe in catalog["recipes"]}
    assert len(photos) == len(recipes), "Every reference recipe needs a photograph"
    assert {photo["recipe_id"] for photo in photos} == set(recipes)
    assert len({photo["key"] for photo in photos}) == len(photos)
    assert len({photo["sha256"] for photo in photos}) == len(photos), "Use distinct photographs"
    imports = []
    entries = []
    total = 0
    for index, photo in enumerate(photos):
        assert recipes[photo["recipe_id"]]["image"] == photo["key"]
        path = ROOT / photo["path"]
        assert path.parent == ROOT / "app/assets/recipes" and path.suffix == ".jpg"
        data = path.read_bytes()
        assert data.startswith(b"\xff\xd8\xff"), path
        assert hashlib.sha256(data).hexdigest() == photo["sha256"], path
        assert 5_000 <= len(data) <= 1_500_000, path
        assert photo["author"] and photo["description"] and photo["changes"]
        assert photo["license"] in {
            "CC BY 2.0",
            "CC BY 3.0",
            "CC BY 4.0",
            "CC BY-SA 2.0",
            "CC BY-SA 2.5",
            "CC BY-SA 3.0",
            "CC BY-SA 4.0",
            "CC0",
            "Public domain",
        }, photo["license"]
        assert photo["license_url"].startswith("https://creativecommons.org/")
        assert photo["page_url"].startswith("https://commons.wikimedia.org/wiki/File:")
        assert photo["download_url"].startswith(
            ("https://upload.wikimedia.org/", "https://thumb.wikimedia.org/")
        )
        total += len(data)
        imports.append(f"import photo{index} from '../../assets/recipes/{path.name}';")
        fields = {
            "description": photo["description"],
            "author": photo["author"],
            "pageUrl": photo["page_url"],
            "license": photo["license"],
            "licenseUrl": photo["license_url"],
            "note": photo["note"],
        }
        lines = [f"  {json.dumps(photo['key'])}: {{", f"    source: photo{index},"]
        lines += [
            f"    {key}: {json.dumps(value, ensure_ascii=False)}," for key, value in fields.items()
        ]
        entries.append("\n".join(lines + ["  },"]))
    assert total <= 20_000_000, "Keep the offline photo collection compact"
    text = (
        "// Static imports keep recipe photography available offline on every platform.\n"
        "// Source and license records: datasets/photo-credits.json.\n"
        + "\n".join(imports)
        + "\n\nexport const recipePhotos: Record<\n  string,\n"
        "  { source: number; description: string; author: string; pageUrl: string;"
        " license: string; licenseUrl: string; note: string }\n> = {\n"
        + "\n".join(entries)
        + "\n};\n"
    )
    return text, photos, total


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true", help="Write the static asset map")
    args = parser.parse_args()
    text, photos, total = render()
    if args.write:
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT.write_text(text, encoding="utf8")
    else:
        source = OUTPUT.read_text(encoding="utf8")
        assert source.count("import photo") == len(photos)
        for photo in photos:
            assert photo["key"] in source
            assert Path(photo["path"]).name in source
            assert photo["page_url"] in source
            assert photo["license_url"] in source
    print(f"Verified {len(photos)} distinct local recipe photographs ({total / 1_000_000:.1f} MB).")


if __name__ == "__main__":
    main()
