#!/usr/bin/env bash
# Deploy this backend to Vercel from the backend directory.
# - Optionally loads a local dotenv file (for VERCEL_TOKEN, etc.)
# - Runs a production-safe build check (prisma generate + nest build)
# - Invokes the Vercel CLI
#
# Usage:
#   ./scripts/vercel-deploy.sh              # preview deployment
#   ./scripts/vercel-deploy.sh --prod       # production
#   ./scripts/vercel-deploy.sh --skip-build # skip local build check
#   VERCEL_DOTENV=.env.local ./scripts/vercel-deploy.sh --prod
#   ./scripts/vercel-deploy.sh -- --debug   # extra args after -- go to vercel
#
# First-time setup:
#   cd backend && npx vercel link
#   npm run vercel:env:push    # or configure vars in the Vercel dashboard
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PROD=0
SKIP_BUILD=0
VERCEL_ARGS=()

load_dotenv() {
  local f="${VERCEL_DOTENV:-$ROOT/.env}"
  if [[ ! -f "$f" ]]; then
    return 0
  fi
  echo "Loading environment from $f (export-compatible entries only)"
  set -a
  # shellcheck disable=SC1090
  source "$f"
  set +a
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --prod)
      PROD=1
      shift
      ;;
    --skip-build)
      SKIP_BUILD=1
      shift
      ;;
    --help|-h)
      cat <<'EOF'
Usage: vercel-deploy.sh [--prod] [--skip-build] [--] [extra vercel deploy args]

  --prod        Deploy to production
  --skip-build  Skip npm run build:vercel preflight
  VERCEL_DOTENV Path to dotenv file (default: .env in backend root)

First time: npx vercel link
Sync secrets: npm run vercel:env:pull | npm run vercel:env:push
EOF
      exit 0
      ;;
    --)
      shift
      VERCEL_ARGS+=("$@")
      break
      ;;
    *)
      VERCEL_ARGS+=("$1")
      shift
      ;;
  esac
done

if ! command -v npx >/dev/null 2>&1; then
  echo "npx is required (Node.js/npm)." >&2
  exit 1
fi

load_dotenv

if [[ "$SKIP_BUILD" -eq 0 ]]; then
  echo "Running local preflight: npm run build:vercel"
  npm run build:vercel
fi

DEPLOY_CMD=(npx vercel deploy --yes)
if [[ "$PROD" -eq 1 ]]; then
  DEPLOY_CMD+=(--prod)
fi
DEPLOY_CMD+=("${VERCEL_ARGS[@]}")

echo "Deploying with: ${DEPLOY_CMD[*]}"
exec "${DEPLOY_CMD[@]}"
