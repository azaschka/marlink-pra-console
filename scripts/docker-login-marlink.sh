#!/usr/bin/env bash
set -euo pipefail

registry="shamrock-nexus.cdn-vas.net"
username="${DOCKER_MARLINK_USER:-shamrock}"

if [[ -n "${DOCKER_MARLINK_PASSWORD:-}" ]]; then
  password="${DOCKER_MARLINK_PASSWORD}"
else
  read -r -s -p "Docker password for ${username}@${registry}: " password
  echo
fi

if [[ -z "${password}" ]]; then
  echo "No Docker password provided. Aborting login." >&2
  exit 1
fi

printf "%s" "${password}" | docker login "${registry}" -u "${username}" --password-stdin
