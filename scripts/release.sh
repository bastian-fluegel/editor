#!/usr/bin/env bash
set -euo pipefail

level="${1:-}"
if [[ "$level" != "patch" && "$level" != "minor" && "$level" != "major" ]]; then
  echo "Usage: $0 {patch|minor|major}" >&2
  exit 2
fi

require_clean_worktree() {
  if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "Working tree ist nicht clean. Bitte erst committen/stashen." >&2
    exit 2
  fi
}

read_version() {
  if [[ ! -f VERSION ]]; then
    echo "VERSION file fehlt." >&2
    exit 2
  fi
  tr -d ' \t\r\n' < VERSION
}

bump_version() {
  local v="$1"
  local level="$2"
  if [[ ! "$v" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
    echo "Ungültige Version in VERSION: $v (erwartet X.Y.Z)" >&2
    exit 2
  fi
  local major="${BASH_REMATCH[1]}"
  local minor="${BASH_REMATCH[2]}"
  local patch="${BASH_REMATCH[3]}"

  case "$level" in
    major) major=$((major + 1)); minor=0; patch=0 ;;
    minor) minor=$((minor + 1)); patch=0 ;;
    patch) patch=$((patch + 1)) ;;
  esac
  echo "${major}.${minor}.${patch}"
}

ensure_changelog_unreleased() {
  if [[ ! -f CHANGELOG.md ]]; then
    cat > CHANGELOG.md <<'EOF'
# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

## [Unreleased]

### Added

### Changed

### Fixed
EOF
    return
  fi

  if ! grep -qE '^## \\[Unreleased\\]' CHANGELOG.md; then
    python3 - <<'PY'
from pathlib import Path
path = Path("CHANGELOG.md")
lines = path.read_text(encoding="utf-8").splitlines(True)

insert = [
  "\n",
  "## [Unreleased]\n",
  "\n",
  "### Added\n",
  "\n",
  "### Changed\n",
  "\n",
  "### Fixed\n",
  "\n",
]

# Insert after the initial intro block (first blank line after the intro), fallback to top.
idx = 0
for i, line in enumerate(lines):
  if line.startswith("## "):
    idx = i
    break
else:
  idx = len(lines)

lines[idx:idx] = insert
path.write_text("".join(lines), encoding="utf-8")
PY
  fi
}

update_changelog_for_release() {
  local new_version="$1"
  local today
  today="$(date +%F)"

  python3 - <<'PY'
import re
from pathlib import Path
from datetime import date

new_version = Path("VERSION").read_text(encoding="utf-8").strip()
today = date.today().isoformat()
path = Path("CHANGELOG.md")
text = path.read_text(encoding="utf-8")

if "## [Unreleased]" not in text:
    raise SystemExit("CHANGELOG.md hat keinen [Unreleased]-Block (sollte vorher erzeugt werden).")

lines = text.splitlines(True)

def is_unreleased_heading(l: str) -> bool:
    return l.startswith("## [Unreleased]")

def is_version_heading(l: str) -> bool:
    return bool(re.match(r"^## \\[[0-9]+\\.[0-9]+\\.[0-9]+\\]", l))

u_start = next(i for i,l in enumerate(lines) if is_unreleased_heading(l))
u_end = next((i for i in range(u_start+1, len(lines)) if is_version_heading(lines[i])), len(lines))

unreleased_block = lines[u_start:u_end]

# Grab unreleased content after the heading line (keep any subsections if user added them).
content = unreleased_block[1:]
has_meaningful = any(l.strip().startswith("-") for l in content)

release_lines = []
release_lines.append(f"## [{new_version}] - {today}\n\n")
if has_meaningful:
    # Keep content as-is under the new version.
    # Ensure there is a blank line after the heading.
    release_lines.extend(content)
    if not release_lines[-1].endswith("\n"):
        release_lines[-1] += "\n"
else:
    release_lines.append("### Changed\n")
    release_lines.append(f"- Release v{new_version}.\n")
    release_lines.append("\n")

# Reset Unreleased block to a minimal skeleton.
new_unreleased = [
    "## [Unreleased]\n",
    "\n",
    "### Added\n",
    "\n",
    "### Changed\n",
    "\n",
    "### Fixed\n",
    "\n",
]

new_lines = []
new_lines.extend(lines[:u_start])
new_lines.extend(new_unreleased)
new_lines.append("\n")
new_lines.extend(release_lines)
new_lines.extend(lines[u_end:])

path.write_text("".join(new_lines), encoding="utf-8")
PY
}

main() {
  command -v git >/dev/null 2>&1 || { echo "git fehlt." >&2; exit 2; }
  command -v python3 >/dev/null 2>&1 || { echo "python3 fehlt (für Changelog-Update)." >&2; exit 2; }

  require_clean_worktree

  current="$(read_version)"
  next="$(bump_version "$current" "$level")"
  echo "$next" > VERSION

  ensure_changelog_unreleased
  update_changelog_for_release "$next"

  git add VERSION CHANGELOG.md
  git commit -m "release: v${next}"
  git tag "v${next}"
  git push origin HEAD
  git push origin "v${next}"
}

main "$@"

