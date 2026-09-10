"""Utility helper functions."""
import json
import logging

logger = logging.getLogger(__name__)

def parse_json_from_llm(content: str) -> dict:
    """Safely parse JSON from LLM output, handling markdown blocks."""
    if not content:
        return {}
    
    # Strip markdown formatting if present
    content = content.strip()
    if content.startswith("```json"):
        content = content[7:]
    elif content.startswith("```"):
        content = content[3:]
        
    if content.endswith("```"):
        content = content[:-3]
        
    try:
        return json.loads(content.strip())
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON from LLM: {e}\\nContent: {content}")
        return {}
