import json
from types import SimpleNamespace

import providers
import pytest


def test_disabled_extraction_leaves_database_untouched(client, monkeypatch):
    monkeypatch.setenv("FORKCAST_MODEL_PROVIDER", "none")
    assert client.post("/api/extract", json={"task": "pantry", "text": "2 eggs"}).status_code == 422
    assert client.get("/api/pantry").json() == []


@pytest.mark.parametrize(
    "provider,key,envelope",
    [
        (
            "openai",
            "OPENAI_API_KEY",
            {
                "output": [
                    {
                        "content": [
                            {
                                "type": "output_text",
                                "text": '{"items":[{"name":"rice","quantity":"2 kg"}]}',
                            }
                        ]
                    }
                ]
            },
        ),
        (
            "anthropic",
            "ANTHROPIC_API_KEY",
            {
                "content": [
                    {"type": "text", "text": '{"items":[{"name":"rice","quantity":"2 kg"}]}'}
                ]
            },
        ),
        (
            "google",
            "GOOGLE_API_KEY",
            {
                "candidates": [
                    {
                        "content": {
                            "parts": [{"text": '{"items":[{"name":"rice","quantity":"2 kg"}]}'}]
                        }
                    }
                ]
            },
        ),
    ],
)
def test_api_provider_contracts_validate_output(provider, key, envelope, monkeypatch):
    monkeypatch.setenv("FORKCAST_MODEL_PROVIDER", provider)
    monkeypatch.setenv("FORKCAST_MODEL", "test-model")
    monkeypatch.setenv(key, "test-key")
    calls = []
    monkeypatch.setattr(providers, "_post", lambda *args: calls.append(args) or envelope)
    assert providers.extract("pantry", "2 kg rice")["items"][0]["name"] == "rice"
    assert calls[0][0].startswith("https://")
    monkeypatch.setattr(providers, "_post", lambda *args: {})
    with pytest.raises(providers.ProviderError, match="expected fields"):
        providers.extract("pantry", "2 kg rice")


def test_claude_subscription_has_no_tools_and_does_not_inherit_api_keys(monkeypatch):
    monkeypatch.setenv("FORKCAST_MODEL_PROVIDER", "claude")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "not-for-subscription-mode")
    monkeypatch.setattr(providers.shutil, "which", lambda name: "/bin/claude")

    def run(args, **kwargs):
        assert args[args.index("--tools") + 1] == ""
        assert kwargs["shell"] is False
        assert "ANTHROPIC_API_KEY" not in kwargs["env"]
        return SimpleNamespace(
            returncode=0,
            stdout=json.dumps({"result": '{"items":[{"name":"rice","quantity":"2 kg"}]}'}),
        )

    monkeypatch.setattr(providers.subprocess, "run", run)
    assert providers.extract("pantry", "2 kg rice")["items"][0]["quantity"] == "2 kg"


def test_rejects_invalid_images():
    with pytest.raises(providers.ProviderError):
        providers.image_data("https://untrusted.example/image.png")
