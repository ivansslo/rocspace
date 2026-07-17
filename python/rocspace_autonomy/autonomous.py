"""Bounded autonomous runner with a maximum number of steps."""
from __future__ import annotations

from .orchestrator import Orchestrator, OrchestrationResult


def run_autonomous(task: str, max_steps: int = 1, model: str = "llama-3.3-70b-versatile") -> list[OrchestrationResult]:
    if not 1 <= max_steps <= 3:
        raise ValueError("max_steps must be between 1 and 3")
    orchestrator = Orchestrator(model=model)
    results = []
    for step in range(max_steps):
        tool = "hub_health" if step == 0 else "model_catalog"
        results.append(orchestrator.run(task, tool=tool))
    return results
