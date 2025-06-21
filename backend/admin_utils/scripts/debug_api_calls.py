import os
import json
import logging
import sys
import time
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

def debug_api_calls():
    # Get the actual script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    logging.info(f"Script directory: {script_dir}")
    
    # Add backend/admin_utils to the Python path
    admin_utils_dir = os.path.abspath(os.path.join(script_dir, ".."))
    sys.path.append(admin_utils_dir)
    
    # Try to import the API logger
    try:
        from utils.api_logger import create_api_logger, APILogger
        logging.info("Successfully imported API logger")
        
        # Create a new API logger
        api_logger = create_api_logger("debug_api_calls")
        logging.info("Created API logger")
        
        # Print session stats
        api_logger.print_session_stats()
        
        # Check if there are any existing logs
        logs = api_logger.log_entries
        logging.info(f"Found {len(logs)} API call logs in current session")
        
        # Print the most recent logs
        recent_logs = logs[-10:] if len(logs) > 10 else logs
        for i, log in enumerate(recent_logs):
            logging.info(f"Log {i+1}:")
            logging.info(f"  - Timestamp: {log.get('timestamp', 'N/A')}")
            logging.info(f"  - Model: {log.get('model', 'N/A')}")
            logging.info(f"  - Success: {log.get('success', 'N/A')}")
            logging.info(f"  - Cache Hit: {log.get('cache_hit', 'N/A')}")
            logging.info(f"  - Input: {log.get('input_text', 'N/A')[:50] if log.get('input_text') else 'N/A'}...")
            
    except ImportError as e:
        logging.error(f"Error importing API logger: {e}")
    
    # Check the config file
    config_path = os.path.join(script_dir, "..", "config", "pipeline_config.json")
    logging.info(f"Config path: {config_path}")
    logging.info(f"Config exists: {os.path.exists(config_path)}")
    
    if os.path.exists(config_path):
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
            logging.info(f"Config content: {config}")
            logging.info(f"GPT model from config: {config.get('gpt_model', 'Not found')}")
        except Exception as e:
            logging.error(f"Error loading config: {e}")
    
    # Check the .env file
    env_path = os.path.join(script_dir, "..", "config", ".env")
    logging.info(f"Env path: {env_path}")
    logging.info(f"Env exists: {os.path.exists(env_path)}")
    
    if os.path.exists(env_path):
        try:
            from dotenv import load_dotenv
            load_dotenv(dotenv_path=env_path)
            openrouter_model = os.getenv("OPENROUTER_MODEL", "Not found")
            logging.info(f"OPENROUTER_MODEL from .env: {openrouter_model}")
        except Exception as e:
            logging.error(f"Error loading .env: {e}")
    
    # Check the logs directory for finalize_corrections logs
    logs_dir = os.path.join(script_dir, "..", "logs")
    logging.info(f"Logs directory: {logs_dir}")
    logging.info(f"Logs directory exists: {os.path.exists(logs_dir)}")
    
    if os.path.exists(logs_dir):
        log_files = [f for f in os.listdir(logs_dir) if f.startswith("finalize_corrections_log_")]
        logging.info(f"Found {len(log_files)} finalize_corrections log files")
        
        if log_files:
            # Sort by name (which includes timestamp) to get the most recent
            log_files.sort(reverse=True)
            most_recent_log = os.path.join(logs_dir, log_files[0])
            logging.info(f"Most recent log file: {most_recent_log}")
            
            try:
                with open(most_recent_log, 'r') as f:
                    log_content = f.read()
                logging.info(f"Log file content (first 500 chars): {log_content[:500]}...")
            except Exception as e:
                logging.error(f"Error reading log file: {e}")

if __name__ == "__main__":
    debug_api_calls()
