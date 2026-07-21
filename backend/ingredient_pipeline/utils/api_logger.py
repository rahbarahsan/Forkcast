"""
API Logging Utility
Provides comprehensive logging for API calls with cost tracking and performance metrics.
"""

import os
import csv
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
from pathlib import Path

class APILogger:
    """
    Comprehensive API call logger with cost tracking and performance metrics.
    """
    
    def __init__(self, log_dir: str = None, log_name: str = "api_usage"):
        """
        Initialize the API logger.
        
        Args:
            log_dir: Directory to store log files. Defaults to ingredient_pipeline/logs/
            log_name: Base name for log files
        """
        if log_dir is None:
            # Default to ingredient_pipeline/logs/
            script_dir = os.path.dirname(os.path.dirname(__file__))
            log_dir = os.path.join(script_dir, "logs")
        
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(exist_ok=True)
        
        # Create timestamped log files
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.csv_log_file = self.log_dir / f"{log_name}_{timestamp}.csv"
        self.json_log_file = self.log_dir / f"{log_name}_{timestamp}.json"
        
        # Initialize log data
        self.log_entries = []
        self.session_stats = {
            "session_start": datetime.now().isoformat(),
            "total_calls": 0,
            "successful_calls": 0,
            "failed_calls": 0,
            "total_cost": 0.0,
            "total_tokens": 0,
            "average_response_time": 0.0,
            "models_used": set()
        }
        
        # Setup logging
        self.logger = logging.getLogger(__name__)
        
        # Initialize CSV file with headers
        self._initialize_csv()
    
    def _initialize_csv(self):
        """Initialize CSV file with headers."""
        headers = [
            "timestamp", "recipe_id", "input_text", "output_data", "model", 
            "success", "error_message", "response_time_ms", "estimated_cost",
            "input_tokens", "output_tokens", "total_tokens", "cache_hit"
        ]
        
        try:
            with open(self.csv_log_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow(headers)
        except Exception as e:
            self.logger.error(f"Failed to initialize CSV log file: {e}")
    
    def log_api_call(self, 
                     input_text: str,
                     output_data: Any = None,
                     model: str = "",
                     recipe_id: str = "",
                     success: bool = True,
                     error_message: str = "",
                     response_time_ms: float = 0.0,
                     estimated_cost: float = 0.0,
                     input_tokens: int = 0,
                     output_tokens: int = 0,
                     cache_hit: bool = False):
        """
        Log an API call with comprehensive details.
        
        Args:
            input_text: The input sent to the API
            output_data: The response from the API
            model: Model name used
            recipe_id: Associated recipe ID (if applicable)
            success: Whether the call was successful
            error_message: Error message if failed
            response_time_ms: Response time in milliseconds
            estimated_cost: Estimated cost of the API call
            input_tokens: Number of input tokens
            output_tokens: Number of output tokens
            cache_hit: Whether this was served from cache
        """
        timestamp = datetime.now().isoformat()
        total_tokens = input_tokens + output_tokens
        
        # Create log entry
        log_entry = {
            "timestamp": timestamp,
            "recipe_id": recipe_id,
            "input_text": input_text,
            "output_data": output_data,
            "model": model,
            "success": success,
            "error_message": error_message,
            "response_time_ms": response_time_ms,
            "estimated_cost": estimated_cost,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": total_tokens,
            "cache_hit": cache_hit
        }
        
        self.log_entries.append(log_entry)
        
        # Update session stats
        self.session_stats["total_calls"] += 1
        if success:
            self.session_stats["successful_calls"] += 1
        else:
            self.session_stats["failed_calls"] += 1
        
        if not cache_hit:  # Only count actual API costs
            self.session_stats["total_cost"] += estimated_cost
            self.session_stats["total_tokens"] += total_tokens
        
        if model:
            self.session_stats["models_used"].add(model)
        
        # Update average response time
        if response_time_ms > 0:
            current_avg = self.session_stats["average_response_time"]
            total_calls = self.session_stats["total_calls"]
            self.session_stats["average_response_time"] = (
                (current_avg * (total_calls - 1) + response_time_ms) / total_calls
            )
        
        # Write to CSV immediately for real-time tracking
        self._write_csv_entry(log_entry)
        
        # Log to console
        status = "✅ SUCCESS" if success else "❌ FAILED"
        cache_status = "🎯 CACHE HIT" if cache_hit else "🌐 API CALL"
        
        self.logger.info(
            f"{status} | {cache_status} | Model: {model} | "
            f"Cost: ${estimated_cost:.4f} | Time: {response_time_ms:.0f}ms | "
            f"Input: '{input_text[:50]}...'"
        )
        
        if not success and error_message:
            self.logger.error(f"API Error: {error_message}")
    
    def _write_csv_entry(self, log_entry: Dict[str, Any]):
        """Write a single log entry to CSV file."""
        try:
            with open(self.csv_log_file, 'a', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                
                # Convert output_data to JSON string for CSV
                output_str = json.dumps(log_entry["output_data"]) if log_entry["output_data"] else ""
                
                row = [
                    log_entry["timestamp"],
                    log_entry["recipe_id"],
                    log_entry["input_text"],
                    output_str,
                    log_entry["model"],
                    log_entry["success"],
                    log_entry["error_message"],
                    log_entry["response_time_ms"],
                    log_entry["estimated_cost"],
                    log_entry["input_tokens"],
                    log_entry["output_tokens"],
                    log_entry["total_tokens"],
                    log_entry["cache_hit"]
                ]
                writer.writerow(row)
        except Exception as e:
            self.logger.error(f"Failed to write CSV entry: {e}")
    
    def save_session_summary(self):
        """Save complete session summary to JSON file."""
        # Convert set to list for JSON serialization
        summary = {
            **self.session_stats,
            "models_used": list(self.session_stats["models_used"]),
            "session_end": datetime.now().isoformat(),
            "log_entries": self.log_entries
        }
        
        try:
            with open(self.json_log_file, 'w', encoding='utf-8') as f:
                json.dump(summary, f, indent=2, ensure_ascii=False)
            
            self.logger.info(f"Session summary saved to {self.json_log_file}")
        except Exception as e:
            self.logger.error(f"Failed to save session summary: {e}")
    
    def print_session_stats(self):
        """Print session statistics."""
        stats = self.session_stats
        success_rate = (stats["successful_calls"] / stats["total_calls"] * 100) if stats["total_calls"] > 0 else 0
        
        print("\n" + "="*60)
        print("📊 API USAGE SESSION STATISTICS")
        print("="*60)
        print(f"Session Start: {stats['session_start']}")
        print(f"Total API Calls: {stats['total_calls']}")
        print(f"Successful Calls: {stats['successful_calls']}")
        print(f"Failed Calls: {stats['failed_calls']}")
        print(f"Success Rate: {success_rate:.1f}%")
        print(f"Total Cost: ${stats['total_cost']:.4f}")
        print(f"Total Tokens: {stats['total_tokens']:,}")
        print(f"Average Response Time: {stats['average_response_time']:.0f}ms")
        print(f"Models Used: {', '.join(stats['models_used']) if stats['models_used'] else 'None'}")
        print(f"CSV Log: {self.csv_log_file}")
        print(f"JSON Log: {self.json_log_file}")
        print("="*60)
    
    def get_cost_breakdown(self) -> Dict[str, Any]:
        """Get detailed cost breakdown by model."""
        breakdown = {}
        
        for entry in self.log_entries:
            if entry["cache_hit"]:  # Skip cached entries
                continue
                
            model = entry["model"] or "unknown"
            if model not in breakdown:
                breakdown[model] = {
                    "calls": 0,
                    "total_cost": 0.0,
                    "total_tokens": 0,
                    "avg_cost_per_call": 0.0
                }
            
            breakdown[model]["calls"] += 1
            breakdown[model]["total_cost"] += entry["estimated_cost"]
            breakdown[model]["total_tokens"] += entry["total_tokens"]
        
        # Calculate averages
        for model_data in breakdown.values():
            if model_data["calls"] > 0:
                model_data["avg_cost_per_call"] = model_data["total_cost"] / model_data["calls"]
        
        return breakdown
    
    def export_failed_calls(self, output_file: str = None) -> List[Dict[str, Any]]:
        """Export failed API calls for debugging."""
        failed_calls = [entry for entry in self.log_entries if not entry["success"]]
        
        if output_file:
            try:
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(failed_calls, f, indent=2, ensure_ascii=False)
                self.logger.info(f"Failed calls exported to {output_file}")
            except Exception as e:
                self.logger.error(f"Failed to export failed calls: {e}")
        
        return failed_calls


# Convenience function for creating API logger
def create_api_logger(script_name: str = "api_usage") -> APILogger:
    """Create an API logger with script-specific naming."""
    return APILogger(log_name=script_name)
