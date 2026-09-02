.PHONY: install dev build preview selftest vectors check clean help

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort \
	  | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-10s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	npm install

dev: install ## Run the dev server
	npm run dev

build: install ## Build into docs/ (what GitHub Pages serves)
	npm run build

preview: build ## Serve the built output locally
	npm run preview

selftest: install ## Check the TS subject against the Python baseline
	npm run selftest

REFERENCE ?= ../reference/packages/agentic-dataset-conformance/src/agentic_dataset_conformance/data

vectors: ## Re-copy the CC0 vectors from the reference repo and regenerate the index
	@test -d "$(REFERENCE)" || { echo "no reference data at $(REFERENCE)"; exit 1; }
	cp $(REFERENCE)/vectors/*.json src/engine/data/vectors/
	cp $(REFERENCE)/worlds/*.json  src/engine/data/worlds/
	cp $(REFERENCE)/LICENSE        src/engine/data/LICENSE
	python3 scripts/generate-data-index.py
	@echo "re-copied; now run 'make selftest' before trusting the result"

check: ## Verify the built payload looks like a site
	@test -f docs/index.html || { echo "refusing: no docs/index.html"; exit 1; }
	@test -f docs/.nojekyll || { echo "refusing: no docs/.nojekyll"; exit 1; }
	@echo "docs/ looks publishable"

clean: ## Remove dependencies and build output
	rm -rf node_modules docs
