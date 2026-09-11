"""Utility helper functions."""
import json
import logging
import re
from typing import Dict, Any

logger = logging.getLogger(__name__)


def parse_json_from_llm(content: str) -> Dict[str, Any]:
    """Safely parse JSON from LLM output, resilient to markdown blocks and preamble text."""
    if not content:
        return {}

    text = content.strip()

    # Fast path: direct valid JSON
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Extract content inside ```json ... ``` or ``` ... ```
    fence_pattern = r"```(?:json)?\s*([\s\S]*?)\s*```"
    match = re.search(fence_pattern, text)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass

    # Fallback: extract substring between first '{' and last '}'
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            pass

    logger.warning("Failed to parse JSON from LLM output: %s", text[:200])
    return {}
