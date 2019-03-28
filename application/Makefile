# current working directory
PWD=$(shell pwd)

# default settings
run := unit
report := html
models := lib/models
profile := $(notdir $(PWD))

# common ports
PORT := 3001

# environment
NODE_ENV ?= development
PORTS ?= $(PORT):3000,9505:9505,9506:9506,35729:35729

ifneq ($(PORTS),)
	PORT_FLAGS = -p $(subst $(shell echo ','), -p ,$(PORTS))
endif

# export common vars
export PORT
export NODE_ENV

# dotenv support
ifneq ($(wildcard .env),)
	include .env
	ENV_FLAGS += --env-file $(PWD)/.env
endif

# docker-compose configuration
BASE_COMPOSE = -f docker-compose.yml
TEST_COMPOSE = $(BASE_COMPOSE) -f docker-compose.test.yml
DEV_COMPOSE = $(TEST_COMPOSE) -f docker-compose.dev.yml
E2E_COMPOSE = $(DEV_COMPOSE) -f docker-compose.e2e.yml

# targets
.PHONY: ? up run bash logs stop down e2e test build integration provision ci cov add rm dev dist
.PHONY: seed reset clear clean prune deps purge schema database migration templates

# utils
define iif
  @(($(1) > /dev/null 2>&1) && printf "\r* $(2)\n") || printf "\r* $(3)\n"
endef

?: Makefile
	@(figlet $(profile)! 2> /dev/null) || printf "\n  Welcome to $(profile)!\n  -- get http://www.figlet.org/ to see a nice banner ;-)\n\n"
	@awk -F':.*?##' '/^[^@:]+:.*##/{gsub("%","*",$$1);gsub("\\\\",":*",$$1);printf "\033[36m%13s\033[0m %s\n",$$1,$$2}' $<
	@printf "\n  Examples:"
	@printf "\n    make provision service=nginx"
	@printf "\n    make migrate:destroy"
	@printf "\n    make clean dev"
	@printf "\n\n"

up: ## Start service in the background  (docker)
	@docker-compose $(DEV_COMPOSE) up -d --no-deps --force-recreate $(service)

run: ## Execute from single service  (docker)
	@docker-compose $(BASE_COMPOSE) run --rm --no-deps -P $(PORT_FLAGS) $(service)

bash: ## SSH into services with /bin/bash  (docker)
	@docker-compose $(BASE_COMPOSE) exec $(service) /bin/bash --rcfile /etc/profile

logs: ## Display logs for given service  (docker)
	@docker-compose $(BASE_COMPOSE) logs -f $(service)

stop: ## Stop single services  (docker)
	@docker-compose $(BASE_COMPOSE) stop $(service)

down: ## Destroy test environment  (docker)
	@docker-compose $(TEST_COMPOSE) down

e2e: ## Headlessly run E2E tests  (docker)
	@docker-compose $(E2E_COMPOSE) exec -T web bash -c "wait-for-it -t 0 web:4000 && npm run test:e2e:ci -- e2e/cases"

test: ## Test current build of a service  (docker)
	@$(AWSSE) -- \
		docker-compose $(TEST_COMPOSE) -f services/$(service)/docker-compose.test.yml run -T $(service)

build: ## Build all or single services  (docker)
	@docker-compose $(BASE_COMPOSE) build $(service)

integration: ## Env for frontend-development and QA  (docker)
	@$(AWSSE) -- docker-compose $(E2E_COMPOSE) run --rm -d -P $(PORT_FLAGS) $(service)

provision: ## Env for production or staging servers  (docker)
	@$(AWSSE) -- \
		docker-compose $(BASE_COMPOSE) run --rm -p $(PORT):80 -d $(service)

	@echo "Please wait while the server is provisioned..."
	@echo "Once done, it will be available at http://$(shell hostname):$(PORT)/"

%!: ## Kill services by name with pkill  (host)
	@(pkill -9 $(subst !,,$@) > /dev/null 2>&1) || true

ci: deps ## Run tests and report coverage results! :wink:  (host)
	@mkdir -p $(run)_coverage
	@make -s ci output="text-lcov > $(run)_coverage/lcov.info"

cov: deps ## Report coverage after tests  (host)
	@npm run test:report -- -r $(report)

add: ## Setup dependencies  (host)
	@npm i $(pkg) --save

rm: ## Remove installed dependencies  (host)
	@npm un $(pkg)

dev: deps ## Single-shot development workspace  (host)
	@make -s up service=db
	@make -s schema templates database
	@npm run dev & npm run watch & npm run watch:mail

dist: deps ## Build artifacts for production  (host)
	@npm run build:mail && npm run schema && npm run dist

seed: deps ## Run custom seeders  (host)
	@npm run grown -- backup --models $(models) --load db/seeders/$(NODE_ENV)

reset: deps ## Run integration_seeds  (host)
	@node db/integration_seeds

clear: deps ## Run integration_seeds with --clear  (host)
	@node db/integration_seeds --clear

clean: ## Remove cache and generated artifacts  (host)
	@$(call iif,rm -r pgdata build log **/generated,Built artifacts were deleted,Artifacts already deleted)
	@$(call iif,unlink .tarima,Cache file was deleted,Cache file already deleted)

prune: ## Remove schema files and migrations  (host)
	@$(call iif,rm -rf db/schema*,Schema deleted,Schema already deleted)
	@$(call iif,rm -rf db/migrations/*.js,Migrations deleted,Migrations already deleted)

deps: ## Check for installed dependencies  (host)
	@(((ls node_modules | grep .) > /dev/null 2>&1) || npm i) || true

purge: ## Remove all from node_modules/*  (host)
	@printf "\r* Removing all dependencies... "
	@rm -rf node_modules/.{bin,cache}
	@rm -rf node_modules/*
	@echo "OK"

schema: deps ## Generate sources from given schemas  (host)
	@npm run schema

database: deps ## Start database for development  (host)
	@make -s migrate:up reset

migrate\:%: deps ## Execute pending migrations  (host)
	@npm run grown -- migrate --models $(models) --$(subst :, --,$*)

migration: deps ## Autogenerate new migration files  (host)
	@npm run grown -- migrate --models $(models) --make
	@npm run grown -- migrate --models $(models) --up
	@npm run grown -- migrate --models $(models) --apply

templates: deps ## Regenerate mailing templates  (host)
	@npm run build:mail
