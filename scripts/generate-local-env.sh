#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_FILE="${ROOT_DIR}/src/assets/scripts/env.js"

api_base_url="${PRA_DEV_API_BASE_URL:-/api}"
api_key="${PRA_DEV_API_KEY:-}"
access_key="${PRA_DEV_ACCESS_KEY:-}"

cat > "${TARGET_FILE}" <<EOF
(function (window) {
    window["env"] = window["env"] || {};

    window["env"]["PRA_API_BASE_URL"] = "${api_base_url}";
    window["env"]["PRA_API_KEY"] = "${api_key}";
    window["env"]["PRA_ACCESS_KEY"] = "${access_key}";
})(this);
EOF

echo "Generated ${TARGET_FILE} from PRA_DEV_* environment variables."
