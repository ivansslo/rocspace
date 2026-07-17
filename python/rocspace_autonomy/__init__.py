"""RocSpace autonomous orchestration primitives.

This package deliberately reads credentials only from process environment.
Never commit or print credential values.
"""

from .providers import ProviderClient, discover_models
from .orchestrator import Orchestrator

__all__ = ["ProviderClient", "Orchestrator", "discover_models"]
