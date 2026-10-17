import decisions
import pytest
from providers import ProviderError


def test_jev_is_optional_and_preserves_review_uncertainty(monkeypatch):
    recipe = {"title": "Dinner", "ingredients": ["2 cloves garlic"]}
    lines = [{"index": 0, "name": "garlic", "quantity": 2, "unit": "clove"}]
    assert decisions.review(recipe, lines) == []
    monkeypatch.setenv("FORKCAST_DECISION_PROVIDER", "jev")
    with pytest.raises(ProviderError, match="missing"):
        decisions.review(recipe, lines)
    monkeypatch.setenv("TYPESAFE_API_KEY", "test")
    calls = []
    monkeypatch.setattr(
        decisions,
        "_post",
        lambda *args: (
            calls.append(args)
            or {
                "answers": {
                    "0": {
                        "type": "choice",
                        "choice": "review",
                        "confidence": 0.4,
                        "probabilities": {"supported": 0.4, "review": 0.6},
                    }
                }
            }
        ),
    )
    assert decisions.review(recipe, lines) == ["Jev review: check 2 cloves garlic"]
    assert calls[0][0] == "https://api.typesafe.ai/v1/systemone"
    assert calls[0][2]["model"] == "jev-latest"
    monkeypatch.setattr(decisions, "_post", lambda *_: {"answers": {}})
    with pytest.raises(ProviderError, match="incomplete"):
        decisions.review(recipe, lines)
