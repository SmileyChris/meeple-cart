#!/usr/bin/env bash
set -euo pipefail

VERSION="${POCKETBASE_VERSION:-0.32.0}"
TARGET_DIR="pocketbase"
mkdir -p "${TARGET_DIR}"

case "$(uname -s)" in
  Linux*) PLATFORM="linux" ;;
  Darwin*) PLATFORM="darwin" ;;
  *)
    echo "Unsupported operating system: $(uname -s)" >&2
    exit 1
    ;;
esac

case "$(uname -m)" in
  x86_64|amd64) ARCH="amd64" ;;
  arm64|aarch64) ARCH="arm64" ;;
  *)
    echo "Unsupported architecture: $(uname -m)" >&2
    exit 1
    ;;
esac

ARCHIVE="pocketbase_${VERSION}_${PLATFORM}_${ARCH}.zip"
URL="https://github.com/pocketbase/pocketbase/releases/download/v${VERSION}/${ARCHIVE}"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

BINARY_PATH="${TARGET_DIR}/pocketbase-${VERSION}"
LINK_PATH="${TARGET_DIR}/pocketbase"

if [[ -x "${BINARY_PATH}" ]]; then
  # Already have the correct version - nothing to do
  :
else
  echo "Downloading PocketBase ${VERSION}..." >&2
  curl -fsSL "${URL}" -o "${TMP_DIR}/${ARCHIVE}"
  if command -v unzip >/dev/null 2>&1; then
    unzip -q "${TMP_DIR}/${ARCHIVE}" pocketbase -d "${TMP_DIR}"
  else
    # Fallback for Windows environments where unzip might be missing but powershell is available
    # Convert WSL path to Windows path for powershell
    WIN_ZIP_PATH=$(wslpath -w "${TMP_DIR}/${ARCHIVE}")
    WIN_DEST_PATH=$(wslpath -w "${TMP_DIR}")
    powershell.exe -Command "Expand-Archive -Path '${WIN_ZIP_PATH}' -DestinationPath '${WIN_DEST_PATH}' -Force"
  fi
  mv "${TMP_DIR}/pocketbase" "${BINARY_PATH}"
  chmod +x "${BINARY_PATH}"
  echo "PocketBase ${VERSION} installed" >&2
fi

# Handle the symbolic link more carefully
rm -rf "${LINK_PATH}"
ln -s "pocketbase-${VERSION}" "${LINK_PATH}"
