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
POSTGRES_USER ?= postgres

ifneq ($(PORTS),)
	PORT_FLAGS = -p $(subst $(shell echo ','), -p ,$(PORTS))
endif

# dotenv support
ifneq ($(wildcard .env),)
	include .env
endif

# docker-compose configuration
BASE_COMPOSE = -f docker/docker-compose.yml
PROD_COMPOSE = $(BASE_COMPOSE) -f docker/docker-compose.prod.yml
TEST_COMPOSE = $(BASE_COMPOSE) -f docker/docker-compose.test.yml
DEV_COMPOSE = $(TEST_COMPOSE) -f docker/docker-compose.dev.yml
E2E_COMPOSE = $(DEV_COMPOSE) -f docker/docker-compose.e2e.yml

# targets
.PHONY: ? up run logs stop down e2e test build integration provision ci cov add rm dev dist
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
	@printf "\n    make build provision"
	@printf "\n    make migrate-destroy"
	@printf "\n    make clean dev"
	@printf "\n\n"

sh: ## SSH into services with current SHELL  (docker)
	@docker exec -it $(shell docker ps | grep $(service) | awk '/.*/{print $$1}') $(SHELL) $(SHELL_FLAGS)

up: ## Start service in the background  (docker)
	@docker-compose $(DEV_COMPOSE) up -d --force-recreate $(service)

run: ## Execute from single service  (docker)
	@docker-compose $(BASE_COMPOSE) run -T --rm $(PORT_FLAGS) $(service)

logs: ## Display logs for given service  (docker)
	@docker-compose $(BASE_COMPOSE) logs -f $(service)

stop: ## Stop single services  (docker)
	@docker-compose $(BASE_COMPOSE) stop $(service)

down: ## Destroy test environment  (docker)
	@docker-compose $(TEST_COMPOSE) down

test: ## Test all services at once, even E2E  (docker)
	@make -s test-e2e command="npm run test:e2e:remote -- e2e/cases"
	@make -s test-e2e command="npm run bdd -- npm run test:e2e:remote"

chrome:
	@docker-compose $(E2E_COMPOSE) up -d --no-deps --force-recreate chrome

test-e2e: chrome
	@docker-compose $(E2E_COMPOSE) exec -e BASE_URL=http://nginx -T web $(command)

build: ## Build all or single services  (docker)
	@docker-compose $(BASE_COMPOSE) build $(service)

backend: ## Build base docker-image  (docker)
	@docker build -t application/nodejs --target nodejs -f docker/Dockerfile.backend .

integration: ## Env for frontend-development and QA  (docker)
	@docker-compose $(E2E_COMPOSE) up -d --force-recreate $(PORT_FLAGS)

provision: ## Env for production or staging servers  (docker)
	@docker-compose $(PROD_COMPOSE) run --rm -p $(PORT):80 -e BASE_URL=http://$(shell hostname):$(PORT) -d nginx

	@printf "\nPlease wait while the server is being provisioned... "
	@printf "\nOnce done, it will be available at http://$(shell hostname):$(PORT)/"
	@printf "\n\nIf takes longer, execute \`make logs\` to understand what's going on."
	@printf "\n\n"

%!: ## Kill services by name or port number with fkill  (host)
	@fkill -s $*

%\:%: ## Invoke tasks by service name  (host)
%\:sh %\:up %\:run %\:logs %\:stop %\:down %\:test %\:build:
	@make -s service=$(subst :, ,$@)

npm\:%: ## Invoke NPM commands  (host)
	@npm $(subst :, ,$*) $(NPM_FLAGS)

ci: deps ## Run all-tests and report coverage results! :wink:  (host)
	@make -s test-ci run=unit
	@make -s test-ci run=functional

test-ci: deps
	@mkdir -p $(run)_coverage && npm run test:coverage:$(run)
	@make -s cov report="text-lcov > $(run)_coverage/lcov.info"

cov: deps ## Report coverage after tests  (host)
	@npm run test:report -- -r $(report)

all: deps ## Single-shot development workspace  (host)
	@make -s up service=db
	@make -s schema templates database node

dev: deps ## Develop NodeJS application only  (host)
	@make -s watch & npm run dev

e2e: deps ## Headlessly run E2E tests  (host)
	@npm run test:e2e -- e2e/cases
	@npm run test:bdd -- --take-snapshot -S -s e2e/screenshots

lint: deps ## Run ESLint on all source files  (host)
	@npm run lint

kill: deps ## Stop started services by port-number  (host)
	@make -s :4001! :3000! :1080! :1081! :1025!

dist: deps ## Build artifacts for production  (host)
	@npm run build:mail && npm run schema && npm run dist

repl: deps ## Interactive console  (host)
	@npm run grown -- repl models:$(models)

seed: deps ## Run custom seeders  (host)
	@npm run grown -- backup models:$(models) --load db/seeders/$(NODE_ENV)

reset: deps ## Run integration_seeds  (host)
	@node db/integration_seeds

clear: deps ## Run integration_seeds with --clear  (host)
	@node db/integration_seeds --clear

watch: deps ## Enable nodemon watching of sources  (host)
	@(npm run watch 2>&1 | npm run logs) & npm run watch:mail

clean: ## Remove cache and generated artifacts  (host)
	@$(call iif,rm -r pgdata build api/schema/generated lib/mailer/generated,Built artifacts were deleted,Artifacts already deleted)
	@$(call iif,unlink .tarima,Cache file was deleted,Cache file already deleted)
	@$(call iif,rm -f logs/*.log,Logs were deleted,Logs already deleted)

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

install: ## Install global dependencies  (host)
	@npm i -g fkill-cli nodemon ndb

schema: deps ## Generate sources from given schemas  (host)
	@npm run schema

templates: deps ## Regenerate mailing templates  (host)
	@npm run build:mail

database: deps ## Start database for development  (host)
	@make -s migrate-up reset

migrate-%: deps ## Execute pending migrations  (host)
	@npm run grown -- migrate models:$(models) --$(subst :, --,$*)

migration: deps ## Autogenerate new migration files  (host)
	@make -s migrate-make
	@make -s migrate-up
	@make -s migrate-apply
