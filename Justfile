set shell := ["bash", "-euo", "pipefail", "-c"]

default: dev

dev:
	./scripts/dev.sh
