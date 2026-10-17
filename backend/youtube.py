"""YouTube description/caption import; no video downloads, account or API key."""

import json
import re
from urllib.parse import parse_qs, urlsplit

try:
    from .imports import recipe_preview
    from .network import SourceError, read_public
    from .providers import ProviderError, configuration, extract
except ImportError:
    from imports import recipe_preview
    from network import SourceError, read_public
    from providers import ProviderError, configuration, extract


def video_id(url):
    parsed = urlsplit(url.strip())
    if (
        parsed.scheme not in ("http", "https")
        or parsed.username
        or parsed.port not in (None, 80, 443)
    ):
        raise SourceError("Enter a YouTube watch, shorts, live, or youtu.be URL")
    if parsed.hostname == "youtu.be":
        result = parsed.path.strip("/")
    elif parsed.hostname in ("youtube.com", "www.youtube.com", "m.youtube.com"):
        result = (
            parse_qs(parsed.query).get("v", [""])[0]
            if parsed.path == "/watch"
            else parsed.path.split("/")[-1]
            if parsed.path.startswith(("/shorts/", "/live/", "/embed/"))
            else ""
        )
    else:
        result = ""
    if not re.fullmatch(r"[A-Za-z0-9_-]{11}", result):
        raise SourceError("Enter a valid YouTube video URL")
    return result


def fetch_description(identifier):
    html = read_public("https://www.youtube.com/watch?v=" + identifier, {"www.youtube.com"})
    for match in re.finditer(r"(?:ytInitialPlayerResponse\s*=|\"playerResponse\"\s*:)\s*", html):
        try:
            player, _ = json.JSONDecoder().raw_decode(html[match.end() :])
            details = player.get("videoDetails", {})
            if details.get("videoId") == identifier:
                return (
                    details.get("title", ""),
                    details.get("author", ""),
                    details.get("shortDescription", ""),
                )
        except (ValueError, AttributeError):
            continue
    raise SourceError("YouTube did not expose a public description")


def fetch_transcript(identifier, languages):
    import requests
    from youtube_transcript_api import YouTubeTranscriptApi

    class BoundedSession(requests.Session):
        def request(self, *args, **kwargs):
            kwargs["timeout"] = (5, 12)
            return super().request(*args, **kwargs)

    with BoundedSession() as session:
        transcript = YouTubeTranscriptApi(http_client=session).fetch(
            identifier, languages=languages
        )
        return (
            "\n".join(snippet.text for snippet in transcript)[:80_000],
            transcript.language,
            transcript.is_generated,
        )


def structured_description(text, title=""):
    heading = re.search(r"(?im)^\s*ingredients\s*:?\s*$", text)
    if not heading:
        return recipe_preview(text)
    section = text[heading.start() :]
    section = re.split(
        r"(?im)^\s*(?:recipe in (?:urdu|hindi)|urdu recipe|follow us|subscribe)\b", section
    )[0]
    prefix = [line.strip() for line in text[: heading.start()].splitlines() if line.strip()]
    return recipe_preview(
        (title or (prefix[-1] if prefix else "Imported video recipe")) + "\n" + section
    )


def preview_video(url, pasted_text="", use_model=True, languages=None):
    identifier = video_id(url)
    canonical = "https://www.youtube.com/watch?v=" + identifier
    title, author, description, transcript, language = "", "", "", "", ""
    warnings = []
    if pasted_text.strip():
        transcript = pasted_text.strip()
        warnings.append(
            "Using your pasted description/transcript; it was not verified against the video."
        )
    else:
        try:
            title, author, description = fetch_description(identifier)
        except SourceError:
            warnings.append("Public video description could not be fetched.")
        # A complete description avoids an unnecessary second YouTube request.
        try:
            structured_description(description, title)
        except (ValueError, KeyError, TypeError, StopIteration, IndexError):
            try:
                transcript, language, generated = fetch_transcript(
                    identifier, languages or ["en", "ur", "hi", "ar"]
                )
                if generated:
                    warnings.append("Automatic captions may mishear ingredient names and amounts.")
            except Exception:
                warnings.append(
                    "Captions are unavailable or YouTube blocked this request. Paste the transcript below to continue."
                )
    material = "\n".join(part for part in (title, description, transcript) if part)[:95_000]
    recipe = None
    if material:
        try:
            if use_model and configuration()["available"]:
                recipe = extract("recipe", material)
                warnings.append(
                    "Model interpretation: check every amount and step against the source before saving."
                )
            else:
                recipe = structured_description(description or transcript, title).model_dump()
        except (ValueError, KeyError, TypeError, StopIteration, IndexError):
            if use_model and configuration()["available"]:
                try:
                    recipe = extract("recipe", material)
                    warnings.append(
                        "Model interpretation: check every amount and step against the source before saving."
                    )
                except ProviderError as exc:
                    warnings.append(str(exc))
            else:
                warnings.append(
                    "Configure a model to interpret free-form captions, or paste text with Ingredients and Instructions headings."
                )
        except ProviderError as exc:
            warnings.append(str(exc))
            try:
                recipe = structured_description(description or transcript, title).model_dump()
            except (ValueError, KeyError, TypeError, StopIteration, IndexError):
                pass
    if recipe:
        recipe.update(source_url=canonical, source_name=author or "YouTube creator")
    return {
        "recipe": recipe,
        "source_url": canonical,
        "title": title,
        "author": author,
        "language": language,
        "text": material,
        "warnings": warnings,
    }
