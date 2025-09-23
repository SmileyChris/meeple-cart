set shell := ["bash", "-euo", "pipefail", "-c"]

default: dev

dev:
    @if [[ ! -d "node_modules" ]]; then \
        echo "Installing npm dependencies..."; \
        npm install; \
    fi
    @if [[ ! -f ".env" && -f ".env.example" ]]; then \
        echo "Copying .env from .env.example" ; \
        cp .env.example .env; \
    fi
    @./scripts/dev.sh
