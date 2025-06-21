# backend/admin_utils/scripts/llm_toggle_loader.py

import json
import os

def get_llm_mode(config_path="config/pipeline_config.json"):
    """Load LLM mode from pipeline_config.json (local or api)"""
    full_path = os.path.join(os.path.dirname(__file__), "..", config_path)
    try:
        with open(full_path, "r") as f:
            config = json.load(f)
        return config.get("parsing_mode", "local")
    except FileNotFoundError:
        print(f"Warning: {config_path} not found. Defaulting to 'local' mode.")
        return "local"

# Example usage
if __name__ == "__main__":
    mode = get_llm_mode()
    print(f"🔁 Current LLM Mode: {mode}")
