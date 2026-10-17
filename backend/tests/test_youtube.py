import pytest
import youtube
from network import SourceError


@pytest.mark.parametrize(
    "url",
    [
        "https://youtu.be/abcDEF123_-",
        "https://www.youtube.com/watch?v=abcDEF123_-",
        "https://m.youtube.com/shorts/abcDEF123_-",
    ],
)
def test_video_urls(url):
    assert youtube.video_id(url) == "abcDEF123_-"


@pytest.mark.parametrize(
    "url",
    [
        "https://youtube.com.evil.test/watch?v=abcDEF123_-",
        "http://127.0.0.1/watch?v=abcDEF123_-",
        "file:///etc/passwd",
        "https://youtube.com@evil.test/watch?v=abcDEF123_-",
        "https://youtube.com/watch?v=short",
    ],
)
def test_reject_other_sources(url):
    with pytest.raises(SourceError):
        youtube.video_id(url)


def test_description_preview_never_saves(client, monkeypatch):
    before = len(client.get("/api/recipes").json())
    monkeypatch.setattr(
        youtube,
        "fetch_description",
        lambda _: (
            "Lemon rice",
            "Test cook",
            "Lemon rice\nIngredients\n200 g rice\n1 lemon\nInstructions\nCook rice and add lemon.",
        ),
    )
    monkeypatch.setattr(
        youtube,
        "fetch_transcript",
        lambda *_: pytest.fail("Complete descriptions need no captions"),
    )
    preview = client.post(
        "/api/import/youtube", json={"url": "https://youtu.be/abcDEF123_-"}
    ).json()
    assert preview["recipe"]["source_name"] == "Test cook"
    assert preview["recipe"]["ingredients"] == ["200 g rice", "1 lemon"]
    assert len(client.get("/api/recipes").json()) == before


def test_blocked_video_has_honest_fallback(client, monkeypatch):
    def blocked(*_):
        raise SourceError("blocked")

    monkeypatch.setattr(youtube, "fetch_description", blocked)
    monkeypatch.setattr(youtube, "fetch_transcript", blocked)
    result = client.post("/api/import/youtube", json={"url": "https://youtu.be/abcDEF123_-"}).json()
    assert result["recipe"] is None
    assert any("blocked" in warning for warning in result["warnings"])
    pasted = client.post(
        "/api/import/youtube",
        json={
            "url": "https://youtu.be/abcDEF123_-",
            "pasted_text": "Lemon rice\nIngredients\n200 g rice\nInstructions\nCook rice.",
        },
    ).json()
    assert pasted["recipe"]["title"] == "Lemon rice"
