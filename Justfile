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

migrate:
    @./scripts/download-pocketbase.sh
    @mkdir -p pocketbase/pb_data
    @echo "Running PocketBase migrations..."
    @./pocketbase/pocketbase migrate up --dir pocketbase/pb_data --migrationsDir pocketbase/pb_migrations

docs:
    @uvx --with mkdocs-material mkdocs serve
