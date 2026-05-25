#!/usr/bin/env bash
set -euo pipefail

missing=()

if [[ -z "${PRA_DEV_API_KEY:-}" ]]; then
  missing+=("PRA_DEV_API_KEY")
fi

if [[ -z "${PRA_DEV_ACCESS_KEY:-}" ]]; then
  missing+=("PRA_DEV_ACCESS_KEY")
fi

if (( ${#missing[@]} > 0 )); then
  echo "Local env generation aborted: missing required variable(s): ${missing[*]}" >&2
  echo "Set them in your shell (for example ~/.zshrc) or macOS Keychain-backed exports before running env:generate." >&2
  echo "Example setup:" >&2
  echo "  security add-generic-password -U -a \"\$USER\" -s PRA_DEV_API_KEY -w \"<value>\"" >&2
  echo "  security add-generic-password -U -a \"\$USER\" -s PRA_DEV_ACCESS_KEY -w \"<value>\"" >&2
  exit 1
fi

echo "Local env check passed: PRA_DEV_API_KEY and PRA_DEV_ACCESS_KEY are set."
