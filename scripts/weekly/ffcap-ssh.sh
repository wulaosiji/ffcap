#!/usr/bin/env bash
# Production SSH wrapper. Credentials come ONLY from the environment and are never echoed.
#   FFCAP_SSH_HOST (default 47.100.55.67), FFCAP_SSH_USER, and either
#   FFCAP_SSH_KEY (path to a private key file kept outside Git) or FFCAP_SSH_PASSWORD (needs sshpass).
# Usage: scripts/weekly/ffcap-ssh.sh 'pm2 describe ffcap'
set -euo pipefail
HOST="${FFCAP_SSH_HOST:-47.100.55.67}"
: "${FFCAP_SSH_USER:?FFCAP_SSH_USER not set}"
if [[ -n "${FFCAP_SSH_KEY:-}" ]]; then
  exec ssh -i "$FFCAP_SSH_KEY" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new "${FFCAP_SSH_USER}@${HOST}" "$@"
fi
: "${FFCAP_SSH_PASSWORD:?set FFCAP_SSH_KEY or FFCAP_SSH_PASSWORD}"
export SSHPASS="$FFCAP_SSH_PASSWORD"
exec sshpass -e ssh -o StrictHostKeyChecking=accept-new -o PreferredAuthentications=password -o PubkeyAuthentication=no "${FFCAP_SSH_USER}@${HOST}" "$@"
