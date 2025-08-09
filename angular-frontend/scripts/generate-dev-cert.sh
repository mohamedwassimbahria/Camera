#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/generate-dev-cert.sh <IP_ADDRESS>
# Example: ./scripts/generate-dev-cert.sh 192.168.1.107
# Generates cert.pem and key.pem in the Angular project root with SAN for the given IP.

IP_ADDRESS="${1:-127.0.0.1}"
# Resolve Angular project root (one level up from this script)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CERT_PATH="${PROJECT_ROOT}/cert.pem"
KEY_PATH="${PROJECT_ROOT}/key.pem"

echo "Generating self-signed cert for IP: ${IP_ADDRESS}"

echo "Output cert: ${CERT_PATH}"
echo "Output key : ${KEY_PATH}"

# OpenSSL command with IP-based SAN so iOS/Safari accepts it
openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
  -keyout "${KEY_PATH}" -out "${CERT_PATH}" \
  -subj "/CN=${IP_ADDRESS}" \
  -addext "subjectAltName = IP:${IP_ADDRESS}"

echo "Done. Start Angular with:"
echo "  npx ng serve --host 0.0.0.0 --port 4200 --ssl --ssl-cert cert.pem --ssl-key key.pem --allowed-hosts all"