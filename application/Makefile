# current working directory
PWD=$(shell pwd)

# default settings
run := unit
report := html
models := lib/models
profile := $(notdir $(PWD))

# environment
PORT ?= 4001
NODE_ENV ?= development
BASE_URL ?= http://localhost:$(PORT)

ifneq ($(PORTS),)
	PORT_FLAGS = -p $(subst $(shell echo ','), -p ,$(PORTS))
endif

# export common vars
export PORT
export NODE_ENV
export BASE_URL

# dotenv support
ifneq ($(wildcard .env),)
	include .env
endif

# docker-compose configuration
BASE_COMPOSE = -f docker/docker-compose.yml
TEST_COMPOSE = $(BASE_COMPOSE) -f docker/docker-compose.test.yml
DEV_COMPOSE = $(TEST_COMPOSE) -f docker/docker-compose.dev.yml
E2E_COMPOSE = $(DEV_COMPOSE) -f docker/docker-compose.e2e.yml

# targets
.PHONY: ? up run bash logs stop down e2e test build integration provision ci cov add rm dev dist
.PHONY: seed reset clear clean prune deps purge schema database migration templates

# utils
define ls
	@(((ls $(1) | grep .) > /dev/null 2>&1) || $(2)) || true
endef

define iif
  @(($(1) > /dev/null 2>&1) && printf "\r* $(2)\n") || printf "\r* $(3)\n"
endef

define fig
	@(figlet $(1)! 2> /dev/null) || printf "\n  Welcome to $(1)!\n  -- get http://www.figlet.org/ to see a nice fig ;-)\n\n"
endef

?: Makefile
	@$(call fig,$(profile))
	@awk -F':.*?##' '/^[^ @:]+:.*##/{gsub("%","*",$$1);gsub("\\\\",":*",$$1);printf "\033[36m%13s\033[0m %s\n",$$1,$$2}' $<

	@printf "\n  Examples:"
	@printf "\n    make web:build nginx:provision"
	@printf "\n    make migrate:destroy"
	@printf "\n    make clean dev"
	@printf "\n\n"

sh: ## SSH into services with current SHELL  (docker)
	@docker exec -it $(shell docker ps | grep $(service) | awk '/.*/{print $$1}') $(SHELL) $(SHELL_FLAGS)

up: ## Start service in the background  (docker)
	@docker-compose $(DEV_COMPOSE) up -d --no-deps --force-recreate $(service)

run: ## Execute from single service  (docker)
	@docker-compose $(BASE_COMPOSE) run -T --rm --no-deps $(PORT_FLAGS) $(service)

logs: ## Display logs for given service  (docker)
	@docker-compose $(BASE_COMPOSE) logs -f $(service)

stop: ## Stop single services  (docker)
	@docker-compose $(BASE_COMPOSE) stop $(service)

down: ## Destroy test environment  (docker)
	@docker-compose $(TEST_COMPOSE) down

e2e: ## Headlessly run E2E tests  (docker)
	@docker-compose $(E2E_COMPOSE) exec -T web bash -c "wait-for-it -t 0 web:4000 && npm run test:e2e:ci -- e2e/cases"

test: ## Test current build of a service  (docker)
	@docker-compose $(TEST_COMPOSE) -f services/$(service)/docker-compose.test.yml run -T --rm $(service)

build: ## Build all or single services  (docker)
	@docker-compose $(BASE_COMPOSE) build $(service)

backend: ## Build base docker-image  (docker)
	@docker build -t application/nodejs --target nodejs -f docker/Dockerfile.backend .

integration: ## Env for frontend-development and QA  (docker)
	@docker-compose $(E2E_COMPOSE) run --rm -d $(PORT_FLAGS) $(service)

provision: ## Env for production or staging servers  (docker)
	@$(call fig,$(service) up)
	@docker-compose $(BASE_COMPOSE) run --rm -p $(PORT):80 -d $(service)

	@printf "\nPlease wait while the server is being provisioned... "
	@printf "\nOnce done, it will be available at http://$(shell hostname):$(PORT)/"
	@printf "\n\nIf takes longer, execute \`make logs\` to understand what's going on."
	@printf "\n\n"

%!: ## Kill services by name with pkill  (host)
	@(pkill -9 $(subst !,,$@) > /dev/null 2>&1) || true

%\:%: ## Invoke tasks by service name  (host)
%\:sh %\:up %\:run %\:logs %\:stop %\:down %\:test %\:build %\:provision:
	@make -s service=$(subst :, ,$@)

npm\:%: ## Invoke NPM commands  (host)
	@npm $(subst :, ,$*) $(NPM_FLAGS)

ci: deps ## Run tests and report coverage results! :wink:  (host)
	@mkdir -p $(run)_coverage && npm run test:coverage:$(run)
	@make -s cov report="text-lcov > $(run)_coverage/lcov.info"

cov: deps ## Report coverage after tests  (host)
	@npm run test:report -- -r $(report)

dev: deps ## Single-shot development workspace  (host)
	@make -s node! npm!
	@make -s up service=db
	@make -s schema templates database node

node: deps ## Develop NodeJS application only  (host)
	@npm run watch:mail & npm run watch & npm run dev

dist: deps ## Build artifacts for production  (host)
	@npm run build:mail && npm run schema && npm run dist

seed: deps ## Run custom seeders  (host)
	@npm run grown -- backup models:$(models) --load db/seeders/$(NODE_ENV)

reset: deps ## Run integration_seeds  (host)
	@node db/integration_seeds

clear: deps ## Run integration_seeds with --clear  (host)
	@node db/integration_seeds --clear

clean: ## Remove cache and generated artifacts  (host)
	@$(call iif,rm -r pgdata build log api/schema/generated lib/mailer/generated,Built artifacts were deleted,Artifacts already deleted)
	@$(call iif,unlink .tarima,Cache file was deleted,Cache file already deleted)

prune: ## Remove schema files and migrations  (host)
	@$(call iif,rm -r db/migrations/*.js,Migrations deleted,Migrations already deleted)
	@$(call iif,rm -r db/schema*,Schema deleted,Schema already deleted)

deps: ## Check for installed dependencies  (host)
	@$(call ls,node_modules,npm i)

purge: ## Remove all from node_modules/*  (host)
	@printf "\r* Removing all dependencies... "
	@rm -rf node_modules/.{bin,cache}
	@rm -rf node_modules/*
	@echo "OK"

schema: deps ## Generate sources from given schemas  (host)
	@$(call ls,api/schema/generated,npm run schema)

templates: deps ## Regenerate mailing templates  (host)
	@$(call ls,lib/mailer/generated,npm run build:mail)

database: deps ## Start database for development  (host)
	@make -s migrate:up reset

migrate\:%: deps ## Execute pending migrations  (host)
	@npm run grown -- migrate models:$(models) --$(subst :, --,$*)

migration: deps ## Autogenerate new migration files  (host)
	@make -s migrate:make:up:apply
