#!/usr/bin/env bash
set -euo pipefail

# This script generates a self-signed SSL certificate for development.
# It automatically detects the local IP address to include in the certificate's
# Subject Alternative Name (SAN), which is required by modern browsers like
# Chrome and Safari (especially on iOS) to trust the certificate for IP-based access.

# Resolve Angular project root (one level up from this script)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CERT_PATH="${PROJECT_ROOT}/cert.pem"
KEY_PATH="${PROJECT_ROOT}/key.pem"

# --- Auto-detect IP Address ---
# Default to localhost if no specific IP is found
IP_ADDRESS="127.0.0.1"
if command -v hostname &> /dev/null && [[ "$(hostname -I)" ]]; then
    # Linux-like systems (takes the first IP)
    IP_ADDRESS=$(hostname -I | awk '{print $1}')
elif command -v ipconfig &> /dev/null && ipconfig getifaddr en0 &> /dev/null; then
    # macOS (for Wi-Fi)
    IP_ADDRESS=$(ipconfig getifaddr en0)
elif command -v ipconfig &> /dev/null && ipconfig getifaddr en1 &> /dev/null; then
    # macOS (for Ethernet)
    IP_ADDRESS=$(ipconfig getifaddr en1)
fi

echo "===================================================================="
echo "  Generating Self-Signed SSL Certificate"
echo "===================================================================="
echo
echo "  This will generate 'cert.pem' and 'key.pem' in the project root."
echo "  The certificate will be valid for:"
echo "    - https://localhost:4200"
echo "    - https://${IP_ADDRESS}:4200 (for mobile device access)"
echo
echo "  Detected IP Address: ${IP_ADDRESS}"
echo

# --- OpenSSL command with Subject Alternative Name (SAN) ---
# The SAN field is crucial for modern browsers (Chrome, Safari) to trust the certificate.
# It allows specifying multiple hostnames/IPs. A Common Name (CN) alone is no longer sufficient.
openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
  -keyout "${KEY_PATH}" -out "${CERT_PATH}" \
  -subj "/CN=localhost" \
  -addext "subjectAltName = DNS:localhost,IP:${IP_ADDRESS}"

echo "===================================================================="
echo "  Certificate generated successfully!"
echo "===================================================================="
echo
echo "  You can now start the Angular server with:"
echo "    npm start"
echo
echo "  To access from your phone, browse to: https://${IP_ADDRESS}:4200"
echo "===================================================================="
