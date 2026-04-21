#!/usr/bin/env bash
set -euo pipefail

payload="$(cat)"
export CURSOR_HOOK_PAYLOAD="$payload"

python3 - <<'PY'
import json, os, re, sys

raw = os.environ.get("CURSOR_HOOK_PAYLOAD", "")
try:
    data = json.loads(raw) if raw.strip() else {}
except Exception:
    # Fail closed: malformed input
    print(json.dumps({"permission": "deny", "user_message": "Hook input war kein valides JSON. Aktion gestoppt."}))
    sys.exit(0)

# Cursor hook payloads can vary by version/event. Be defensive.
tool = data.get("tool") or data.get("tool_name") or ""
tool_input = (
    data.get("tool_input")
    or data.get("toolInput")
    or data.get("input")
    or data.get("args")
    or data.get("arguments")
    or {}
)
cmd = ""
if isinstance(tool_input, dict):
    cmd = (
        tool_input.get("command")
        or tool_input.get("cmd")
        or tool_input.get("shell_command")
        or ""
    )

m = re.match(r"^\s*release\s+(patch|minor|major)\s*$", cmd)
if not m:
    print(json.dumps({"permission": "allow"}))
    sys.exit(0)

level = m.group(1)
new_cmd = f'bash "scripts/release.sh" "{level}"'

print(json.dumps({
    "permission": "allow",
    "updated_input": {
        **(tool_input if isinstance(tool_input, dict) else {}),
        "command": new_cmd
    }
}))
PY
