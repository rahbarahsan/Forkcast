"""Optional live subscription check; never called by the offline test suite."""
import argparse
import os
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'backend'))
from providers import extract

parser = argparse.ArgumentParser()
parser.add_argument('--provider', choices=['codex', 'claude'], required=True)
args = parser.parse_args()
os.environ['FORKCAST_MODEL_PROVIDER'] = args.provider
result = extract('pantry', 'Pantry inventory: 2 kg rice; 3 tomatoes. Return exactly these two items.')
assert len(result['items']) == 2, 'Expected two pantry items'
assert any(item['name'].lower() == 'rice' for item in result['items']), 'Expected rice'
print(f'{args.provider}: validated two pantry items; nothing saved to the application database')
