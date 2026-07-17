"""A bounded planner → tool → responder orchestration flow."""
from __future__ import annotations

from dataclasses import dataclass

from .providers import ProviderClient
from .tools import call_tool


@dataclass
class OrchestrationResult:
    task: str
    tool: str
    evidence: str
    response: str


class Orchestrator:
    def __init__(self, client: ProviderClient | None = None, model: str = "llama-3.3-70b-versatile"): 
        self.client = client or ProviderClient()
        self.model = model

    def run(self, task: str, tool: str = "hub_health") -> OrchestrationResult:
        """Run one bounded orchestration step.

        The tool must be allow-listed. There is no shell execution, filesystem
        access, or secret disclosure path in this module.
        """
        evidence = call_tool(tool)
        prompt = (
            "You are RocSpace Orchestrator. Answer concisely from the supplied "
            "verified evidence. Do not invent credentials, endpoints, or private data.\n\n"
            f"Task: {task}\nVerified evidence: {evidence}"
        )
        response = self.client.complete(self.model, [{"role": "user", "content": prompt}])
        return OrchestrationResult(task=task, tool=tool, evidence=evidence, response=response)
