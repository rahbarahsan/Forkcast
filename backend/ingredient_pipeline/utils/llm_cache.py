"""
LLM API Cache Utility
Provides caching functionality for LLM API calls to reduce costs and improve performance.
"""

import os
import json
import hashlib
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
from pathlib import Path

class LLMCache:
    """
    Local file-based cache for LLM API responses.
    Caches based on input hash to avoid duplicate API calls.
    """
    
    def __init__(self, cache_dir: str = None, cache_name: str = "llm_cache"):
        """
        Initialize the cache.
        
        Args:
            cache_dir: Directory to store cache files. Defaults to ingredient_pipeline/cache/
            cache_name: Name of the cache file (without extension)
        """
        if cache_dir is None:
            # Default to ingredient_pipeline/cache/
            script_dir = os.path.dirname(os.path.dirname(__file__))
            cache_dir = os.path.join(script_dir, "cache")
        
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
        
        self.cache_file = self.cache_dir / f"{cache_name}.json"
        self.stats_file = self.cache_dir / f"{cache_name}_stats.json"
        
        # Load existing cache
        self.cache_data = self._load_cache()
        self.stats = self._load_stats()
        
        # Setup logging
        self.logger = logging.getLogger(__name__)
    
    def _load_cache(self) -> Dict[str, Any]:
        """Load cache from file."""
        if self.cache_file.exists():
            try:
                with open(self.cache_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return data.get("entries", {})
            except (json.JSONDecodeError, KeyError) as e:
                self.logger.warning(f"Failed to load cache file: {e}. Starting with empty cache.")
                return {}
        return {}
    
    def _load_stats(self) -> Dict[str, Any]:
        """Load cache statistics from file."""
        if self.stats_file.exists():
            try:
                with open(self.stats_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except json.JSONDecodeError as e:
                self.logger.warning(f"Failed to load stats file: {e}. Starting with empty stats.")
        
        return {
            "cache_hits": 0,
            "cache_misses": 0,
            "total_api_calls_saved": 0,
            "estimated_cost_saved": 0.0,
            "last_updated": None
        }
    
    def _save_cache(self):
        """Save cache to file."""
        cache_structure = {
            "cache_version": "1.0",
            "created": datetime.now().isoformat(),
            "total_entries": len(self.cache_data),
            "entries": self.cache_data
        }
        
        try:
            with open(self.cache_file, 'w', encoding='utf-8') as f:
                json.dump(cache_structure, f, indent=2, ensure_ascii=False)
        except Exception as e:
            self.logger.error(f"Failed to save cache: {e}")
    
    def _save_stats(self):
        """Save statistics to file."""
        self.stats["last_updated"] = datetime.now().isoformat()
        self.stats["total_entries"] = len(self.cache_data)
        
        try:
            with open(self.stats_file, 'w', encoding='utf-8') as f:
                json.dump(self.stats, f, indent=2)
        except Exception as e:
            self.logger.error(f"Failed to save stats: {e}")
    
    def _generate_cache_key(self, input_text: str, model: str = "", additional_context: str = "") -> str:
        """
        Generate a unique cache key for the input.
        
        Args:
            input_text: The main input text to cache
            model: Model name used (optional)
            additional_context: Any additional context that affects the output
            
        Returns:
            SHA256 hash as cache key
        """
        # Normalize input for consistent caching
        normalized_input = input_text.strip().lower()
        
        # Include model and context in the key if provided
        cache_string = f"{normalized_input}|{model}|{additional_context}"
        
        return hashlib.sha256(cache_string.encode('utf-8')).hexdigest()
    
    def get(self, input_text: str, model: str = "", additional_context: str = "") -> Optional[Dict[str, Any]]:
        """
        Get cached result for the input.
        
        Args:
            input_text: The input text to look up
            model: Model name used
            additional_context: Additional context
            
        Returns:
            Cached result if found, None otherwise
        """
        cache_key = self._generate_cache_key(input_text, model, additional_context)
        
        if cache_key in self.cache_data:
            self.stats["cache_hits"] += 1
            self.logger.info(f"Cache HIT for input: '{input_text[:50]}...'")
            return self.cache_data[cache_key]["output"]
        
        self.stats["cache_misses"] += 1
        self.logger.info(f"Cache MISS for input: '{input_text[:50]}...'")
        return None
    
    def set(self, input_text: str, output: Dict[str, Any], model: str = "", 
            additional_context: str = "", estimated_cost: float = 0.0):
        """
        Store result in cache.
        
        Args:
            input_text: The input text
            output: The API response/output to cache
            model: Model name used
            additional_context: Additional context
            estimated_cost: Estimated cost of this API call
        """
        cache_key = self._generate_cache_key(input_text, model, additional_context)
        
        self.cache_data[cache_key] = {
            "input": input_text,
            "output": output,
            "model": model,
            "additional_context": additional_context,
            "timestamp": datetime.now().isoformat(),
            "estimated_cost": estimated_cost
        }
        
        # Update stats
        self.stats["total_api_calls_saved"] += 1
        self.stats["estimated_cost_saved"] += estimated_cost
        
        self.logger.info(f"Cached result for input: '{input_text[:50]}...'")
        
        # Save to file
        self._save_cache()
        self._save_stats()
    
    def clear(self):
        """Clear all cached data."""
        self.cache_data.clear()
        self.stats = {
            "cache_hits": 0,
            "cache_misses": 0,
            "total_api_calls_saved": 0,
            "estimated_cost_saved": 0.0,
            "last_updated": None
        }
        self._save_cache()
        self._save_stats()
        self.logger.info("Cache cleared")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        total_requests = self.stats["cache_hits"] + self.stats["cache_misses"]
        hit_rate = (self.stats["cache_hits"] / total_requests * 100) if total_requests > 0 else 0
        
        return {
            **self.stats,
            "total_requests": total_requests,
            "hit_rate_percentage": round(hit_rate, 2),
            "total_entries": len(self.cache_data)
        }
    
    def print_stats(self):
        """Print cache statistics."""
        stats = self.get_stats()
        print("\n" + "="*50)
        print("📊 LLM CACHE STATISTICS")
        print("="*50)
        print(f"Total Entries: {stats['total_entries']}")
        print(f"Cache Hits: {stats['cache_hits']}")
        print(f"Cache Misses: {stats['cache_misses']}")
        print(f"Hit Rate: {stats['hit_rate_percentage']}%")
        print(f"API Calls Saved: {stats['total_api_calls_saved']}")
        print(f"Estimated Cost Saved: ${stats['estimated_cost_saved']:.4f}")
        if stats['last_updated']:
            print(f"Last Updated: {stats['last_updated']}")
        print("="*50)
    
    def export_cache_entries(self, output_file: str = None) -> List[Dict[str, Any]]:
        """
        Export cache entries for analysis.
        
        Args:
            output_file: Optional file to save the export
            
        Returns:
            List of cache entries
        """
        entries = []
        for cache_key, data in self.cache_data.items():
            entries.append({
                "cache_key": cache_key,
                "input": data["input"],
                "output": data["output"],
                "model": data["model"],
                "timestamp": data["timestamp"],
                "estimated_cost": data.get("estimated_cost", 0.0)
            })
        
        if output_file:
            try:
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(entries, f, indent=2, ensure_ascii=False)
                self.logger.info(f"Cache entries exported to {output_file}")
            except Exception as e:
                self.logger.error(f"Failed to export cache entries: {e}")
        
        return entries


# Convenience functions for common use cases
def create_ingredient_parsing_cache() -> LLMCache:
    """Create a cache specifically for ingredient parsing."""
    return LLMCache(cache_name="ingredient_parsing_cache")

def create_correction_validation_cache() -> LLMCache:
    """Create a cache specifically for correction validation."""
    return LLMCache(cache_name="correction_validation_cache")
