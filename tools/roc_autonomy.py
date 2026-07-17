#!/usr/bin/env python3
"""Safe CLI for model discovery and a bounded RocSpace orchestration test.

Credentials are read only from the current process environment. This command
never prints secret values.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "python"))
from rocspace_autonomy.autonomous import run_autonomous
from rocspace_autonomy.providers import discover_models


def main() -> int:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("models", help="Discover provider catalogues for configured keys")
    run = sub.add_parser("run", help="Run one bounded orchestration response test")
    run.add_argument("task")
    run.add_argument("--steps", type=int, default=1)
    run.add_argument("--model", default="llama-3.3-70b-versatile", help="Model ID, e.g. rocspace/initial on a private Tailscale client")
    args = parser.parse_args()

    if args.command == "models":
        report = [
            {"provider": item.provider, "ok": item.ok, "count": len(item.models), "models": list(item.models), "error": item.error}
            for item in discover_models()
        ]
        print(json.dumps(report, indent=2))
        return 0 if any(item["ok"] for item in report) else 2

    results = run_autonomous(args.task, max_steps=args.steps, model=args.model)
    print(json.dumps([{"tool": r.tool, "response": r.response} for r in results], indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
