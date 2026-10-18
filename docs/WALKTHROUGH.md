# Forkcast walkthrough

[Watch the full walkthrough](forkcast-walkthrough.mp4) ·
[Animated preview](forkcast-demo.gif) · [Text captions](forkcast-walkthrough.vtt)

A 1 minute 40 second, captioned recording of the current application at 1280 × 800.
The video has no audio; the chapter titles and explanations are visible throughout.
The README's animated preview links to the full H.264 MP4.

## Chapters and transcript

| Time  | Chapter                          | What happens                                                       |
| ----- | -------------------------------- | ------------------------------------------------------------------ |
| 00:00 | Good food. Less figuring it out. | A private local kitchen, ready to make the week easier.            |
| 00:05 | Find your next favorite.         | 50 sourced recipes, real photographs and clear halal notes.        |
| 00:20 | Make a plan that fits.           | Two dinners together. One plan to shop from.                       |
| 00:26 | Start with what you have.        | Real pantry quantities reduce the amounts you need to buy.         |
| 00:33 | One sensible shopping list.      | Grouped by aisle, with pantry deductions and recipe evidence.      |
| 00:52 | Give your basket a destination.  | Compare whole-pack costs and see what still has no price.          |
| 01:00 | From watchlist to table.         | Import a YouTube recipe, then check its source and amounts.        |
| 01:11 | A second pair of hands.          | Ask, review the prepared action, then choose Apply.                |
| 01:26 | Your kitchen travels with you.   | The same local household, in a compact phone layout.               |
| 01:34 | A little planning. More living.  | Recipes. Pantry. Plans. Groceries. All in your own little kitchen. |

## What the recording shows

The recording uses the actual web app and local API with a fresh, disposable SQLite
household. Recipes, meal-plan saves, pantry quantities, grocery deductions,
ingredient evidence, export, shopping history, offer comparison and assistant Apply
all use the real application. No model responses or API results are mocked.

The YouTube scene uses the public description of
[this Food Fusion video](https://www.youtube.com/watch?v=3SlIQtHsToc), fetched before
recording and pasted into the import panel for review. The app identifies that
pasted text is not verified against the video. The result is previewed, without
saving it to the reference catalog. The import and assistant use the operator's
authenticated Codex subscription. Two response waits are shortened; the assistant
chapter labels that edit. Actions and results remain in their original order.

The offers belong to fictional **Sample Market** and **Sample Grocer** and have
illustrative CAD prices. Their caption explicitly identifies them as sample data.
The recording shows recommendations from these recorded offers, rather than live
retailer prices or nearby map searches. Unpriced ingredients remain visible.

The phone scene is the same app at a 390-pixel viewport width. It demonstrates the
responsive browser layout; it does not represent a native device recording.
Private household data, credentials and CLI output are excluded. Recipe-photo
credits remain visible in the app; the complete sources and individual licenses
are in [the photo manifest](../datasets/photo-credits.json).

## Record a new walkthrough

Install the app and backend dependencies using the root README, activate the Python
environment, and install Playwright Chromium. The full walkthrough needs a working,
authenticated Codex CLI; `FORKCAST_DEMO_PROVIDER=claude` selects Claude instead.
These recording tools are optional and are not runtime app dependencies.

Example in PowerShell, from the repository root:

```powershell
python -m pip install imageio-ffmpeg==0.6.0
$env:FORKCAST_DEMO_PYTHON = (Get-Command python).Source
$env:FORKCAST_DEMO_PROVIDER = 'codex'
$env:EXPO_PUBLIC_API_URL = 'http://localhost:8017/api'
Set-Location app
npx playwright install chromium
npx expo export --platform web --max-workers 2 --output-dir ../data/local/walkthrough-dist
Set-Location ..
node scripts/record_walkthrough.cjs
$walkthroughEncoder = python -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"
python scripts/render_walkthrough.py --ffmpeg $walkthroughEncoder
```

The recorder refuses to reuse an existing server on ports 8017 or 8087. It starts
its own services and database, asserts the completed actions, and closes them when
finished. Scratch recordings, logs, source text, household data and timing manifests
stay under ignored `data/local/`. The renderer replaces the public MP4, GIF preview
and WebVTT captions in `docs/`, verifies that every output frame decodes, and checks
file sizes. Review playback and chapter timestamps before committing those files.
