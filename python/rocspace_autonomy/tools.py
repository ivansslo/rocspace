"""Small allow-listed tools for autonomous tasks."""
from __future__ import annotations

import json
import urllib.request
from typing import Callable


def hub_health() -> str:
    request = urllib.request.Request("https://api.roadfx.biz.id/health", headers={"User-Agent": "Mozilla/5.0 (compatible; RocSpace-Autonomy/1.0)"})
    with urllib.request.urlopen(request, timeout=15) as response:
        data = json.loads(response.read().decode())
    return json.dumps({"status": data.get("status"), "region": data.get("region"), "services": data.get("services", [])})


def model_catalog() -> str:
    request = urllib.request.Request("https://api.roadfx.biz.id/v1/models", headers={"User-Agent": "Mozilla/5.0 (compatible; RocSpace-Autonomy/1.0)"})
    with urllib.request.urlopen(request, timeout=15) as response:
        data = json.loads(response.read().decode())
    return json.dumps({"count": len(data.get("data", [])), "models": [x.get("id") for x in data.get("data", [])]})


TOOLS: dict[str, Callable[[], str]] = {
    "hub_health": hub_health,
    "model_catalog": model_catalog,
}


def call_tool(name: str) -> str:
    if name not in TOOLS:
        raise ValueError(f"Tool not allowed: {name}")
    return TOOLS[name]()
