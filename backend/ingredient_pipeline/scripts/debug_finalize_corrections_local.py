import os
import json
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

def debug_config_loading():
    # Get the actual script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    logging.info(f"Script directory: {script_dir}")
    
    # Construct the config path
    config_path = os.path.join(script_dir, "..", "config", "pipeline_config.json")
    logging.info(f"Config path: {config_path}")
    logging.info(f"Absolute config path: {os.path.abspath(config_path)}")
    logging.info(f"Config exists: {os.path.exists(config_path)}")
    
    # Try to load the config
    if os.path.exists(config_path):
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
            logging.info(f"Config content: {config}")
            logging.info(f"GPT model from config: {config.get('gpt_model', 'Not found')}")
        except Exception as e:
            logging.error(f"Error loading config: {e}")
    else:
        logging.error(f"Config file does not exist at path: {config_path}")
    
    # Check if __file__ is working correctly
    logging.info(f"__file__: {__file__}")
    logging.info(f"os.path.abspath(__file__): {os.path.abspath(__file__)}")
    
    # Check the current working directory
    logging.info(f"Current working directory: {os.getcwd()}")
    
    # Now try to import the finalize_corrections_local module and check its CONFIG_PATH
    try:
        sys.path.append(script_dir)
        import finalize_corrections_local
        logging.info(f"finalize_corrections_local.CONFIG_PATH: {finalize_corrections_local.CONFIG_PATH}")
        logging.info(f"finalize_corrections_local.CONFIG_PATH exists: {os.path.exists(finalize_corrections_local.CONFIG_PATH)}")
        
        # Check if the GPT_MODEL is being set correctly
        if hasattr(finalize_corrections_local, 'GPT_MODEL'):
            logging.info(f"finalize_corrections_local.GPT_MODEL: {finalize_corrections_local.GPT_MODEL}")
        else:
            logging.error("finalize_corrections_local.GPT_MODEL not found")
    except Exception as e:
        logging.error(f"Error importing finalize_corrections_local: {e}")

if __name__ == "__main__":
    debug_config_loading()
