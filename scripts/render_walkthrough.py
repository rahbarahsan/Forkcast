"""Encode the recorded walkthrough, its animated preview, and text captions."""

import argparse
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def run(command):
    result = subprocess.run(
        command, capture_output=True, text=True, encoding="utf8", errors="replace"
    )
    if result.returncode:
        raise RuntimeError(result.stderr[-5000:])
    return result


def timestamp(seconds, vtt=False):
    milliseconds = round(seconds * 1000)
    hours, rest = divmod(milliseconds, 3_600_000)
    minutes, rest = divmod(rest, 60_000)
    seconds, milliseconds = divmod(rest, 1000)
    if vtt:
        return f"{hours:02}:{minutes:02}:{seconds:02}.{milliseconds:03}"
    return f"{hours * 60 + minutes:02}:{seconds:02}"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ffmpeg", required=True, help="Path to a full FFmpeg build with libx264")
    parser.add_argument("--capture", type=Path, default=ROOT / "data/local/walkthrough-latest.json")
    args = parser.parse_args()
    capture = json.loads(args.capture.read_text(encoding="utf8"))
    source = Path(capture["source"])
    info = subprocess.run(
        [args.ffmpeg, "-hide_banner", "-i", str(source)],
        capture_output=True,
        text=True,
        encoding="utf8",
        errors="replace",
    )
    match = re.search(r"Duration: (\d+):(\d+):([\d.]+)", info.stderr)
    if not match:
        raise ValueError("Cannot read source video duration")
    duration = int(match[1]) * 3600 + int(match[2]) * 60 + float(match[3])
    start = max(0, capture["chapters"][0]["start"] - 0.15)
    finish = duration - 0.15
    omissions = sorted(capture["omissions"], key=lambda item: item["start"])
    ranges = []
    cursor = start
    for omission in omissions:
        end = min(omission["start"], finish)
        if end > cursor:
            ranges.append((cursor, end))
        cursor = max(cursor, omission["end"])
    if finish > cursor:
        ranges.append((cursor, finish))
    assert ranges and all(end > begin for begin, end in ranges)

    def edited_time(value):
        return sum(max(0, min(value, end) - begin) for begin, end in ranges if value > begin)

    docs = ROOT / "docs"
    docs.mkdir(exist_ok=True)
    movie = docs / "forkcast-walkthrough.mp4"
    gif = docs / "forkcast-demo.gif"
    filters = [
        f"[0:v]trim=start={begin:.3f}:end={end:.3f},setpts=PTS-STARTPTS[v{index}]"
        for index, (begin, end) in enumerate(ranges)
    ]
    filters.append(
        "".join(f"[v{index}]" for index in range(len(ranges)))
        + f"concat=n={len(ranges)}:v=1:a=0,scale=1280:800:flags=lanczos,setsar=1[out]"
    )
    run(
        [
            args.ffmpeg,
            "-y",
            "-hide_banner",
            "-i",
            str(source),
            "-filter_complex",
            ";".join(filters),
            "-map",
            "[out]",
            "-an",
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "24",
            "-pix_fmt",
            "yuv420p",
            "-r",
            "25",
            "-movflags",
            "+faststart",
            "-metadata",
            "title=Forkcast product walkthrough",
            "-metadata",
            "comment=Actual app recording with an example household; response waits shortened.",
            str(movie),
        ]
    )
    chapters = [
        {**chapter, "start": round(edited_time(chapter["start"]), 3)}
        for chapter in capture["chapters"]
    ]
    final_duration = sum(end - begin for begin, end in ranges)
    # Short, readable samples from the real video; the README links the full recording.
    clips = []
    for index, offset in [(0, 3.5), (1, 10.5), (4, 8), (5, 3.5), (7, 9), (8, 6.5)]:
        chapter = chapters[index]
        end = chapters[index + 1]["start"] if index + 1 < len(chapters) else final_duration
        point = chapter["start"] + min(offset, max(0.7, end - chapter["start"] - 2.4))
        clips.append((point, min(point + 2.2, end - 0.1)))
    preview_filters = [
        f"[0:v]trim=start={begin:.3f}:end={end:.3f},setpts=PTS-STARTPTS[g{index}]"
        for index, (begin, end) in enumerate(clips)
    ]
    preview_filters += [
        "".join(f"[g{index}]" for index in range(len(clips)))
        + f"concat=n={len(clips)}:v=1:a=0,fps=7,scale=960:600:flags=lanczos,split[a][b]",
        "[a]palettegen=max_colors=128:stats_mode=diff[p]",
        "[b][p]paletteuse=dither=bayer:bayer_scale=3[out]",
    ]
    run(
        [
            args.ffmpeg,
            "-y",
            "-hide_banner",
            "-i",
            str(movie),
            "-filter_complex",
            ";".join(preview_filters),
            "-map",
            "[out]",
            "-loop",
            "0",
            str(gif),
        ]
    )
    captions = ["WEBVTT", ""]
    for index, chapter in enumerate(chapters):
        end = chapters[index + 1]["start"] if index + 1 < len(chapters) else final_duration
        captions += [
            str(index + 1),
            timestamp(chapter["start"], True) + " --> " + timestamp(end, True),
            chapter["title"],
            chapter["caption"],
            "",
        ]
    (docs / "forkcast-walkthrough.vtt").write_text("\n".join(captions), encoding="utf8")
    # Decode every output frame; a successfully written header alone is insufficient.
    for artifact in [movie, gif]:
        run([args.ffmpeg, "-v", "error", "-i", str(artifact), "-f", "null", "-"])
    assert movie.stat().st_size < 15_000_000, "Keep the repository's walkthrough compact"
    assert gif.stat().st_size < 10_000_000, "Keep the inline README preview compact"
    report = {
        "duration_seconds": round(final_duration, 2),
        "resolution": "1280x800",
        "codec": "H.264 / yuv420p",
        "audio": "none; visible captions",
        "video_bytes": movie.stat().st_size,
        "preview_bytes": gif.stat().st_size,
        "chapters": chapters,
        "response_waits_shortened": len(omissions),
    }
    (ROOT / "data/local/walkthrough-render.json").write_text(
        json.dumps(report, indent=2), encoding="utf8"
    )
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
