# current working directory
PWD := $(shell pwd)

# default settings
run := unit
app := default
report := html
dbpath := apps/$(app)/db
models := apps/$(app)/api/models

# dotenv support
ifneq ($(wildcard .env),)
	include .env
endif

# environment
GIT_REVISION ?= $(shell git rev-parse --short=7 HEAD)
POSTGRES_USER ?= $(shell whoami)

BASE_URL ?= http://localhost:4001
NODE_ENV ?= development
MAILDEV ?= YES

.EXPORT_ALL_VARIABLES:

ifneq ($(PORTS),)
	PORT_FLAGS := -p $(subst $(shell echo ','), -p ,$(PORTS))
endif

# docker-compose configuration
DOCKER_COMPOSE := -f e2e/docker/docker-compose.yml
TEST_COMPOSE := $(DOCKER_COMPOSE) -f e2e/docker/docker-compose.test.yml
PRE_COMPOSE := $(DOCKER_COMPOSE) -f e2e/docker/docker-compose.pre.yml
DEV_COMPOSE := $(TEST_COMPOSE) -f e2e/docker/docker-compose.dev.yml
E2E_COMPOSE := $(DEV_COMPOSE) -f e2e/docker/docker-compose.e2e.yml

# targets
.PHONY: ? sh up run logs stop down test chrome test-e2e build backend integration provision
.PHONY: ci test-ci cov all dev e2e lint kill dist repl seed reset clear watch clean prune deps
.PHONY: purge schema templates database migration

# utils
define ls
	@(((ls $(1) | grep .) > /dev/null 2>&1) || $(2)) || true
endef

define iif
  @(($(1) > /dev/null 2>&1) && printf "\r* $(2)\n") || printf "\r* $(3)\n"
endef

?: Makefile
	@awk -F':.*?##' '/^[^ @:]+:.*##/{gsub("%","*",$$1);gsub("\\\\",":*",$$1);printf "\033[36m%13s\033[0m %s\n",$$1,$$2}' $<

	@printf "\n  Examples:"
	@printf "\n    make build provision  -- Build webapp, start nginx proxy-server"
	@printf "\n    make clean dev        -- Clean local artifacts, start local-development"
	@printf "\n    make up test          -- Start all docker-services, run E2E tests remotely"
	@printf "\n\n"

sh: check ## SSH into services with current SHELL  (docker)
	@docker exec -it $(shell docker ps | grep $(service) | awk '/.*/{print $$1}') $(SHELL) $(SHELL_FLAGS)

up: check ## Start service in the background  (docker)
	@docker-compose $(DEV_COMPOSE) up -d --force-recreate $(service)

run: check ## Execute from single service  (docker)
	@docker-compose $(DOCKER_COMPOSE) run -T --rm $(PORT_FLAGS) $(service)

logs: check ## Display logs for given service  (docker)
	@docker-compose $(DOCKER_COMPOSE) logs -f $(service)

stop: check ## Stop single services  (docker)
	@docker-compose $(DOCKER_COMPOSE) stop $(service)

down: check ## Destroy test environment  (docker)
	@docker-compose $(TEST_COMPOSE) down

test: check ## Run all E2E test-cases remotely  (docker)
	@make -s test-e2e command="npm run test:e2e:remote -- e2e/cases"
	@make -s test-e2e command="npm run bdd -- npm run test:e2e:remote"

chrome: check
	@docker-compose $(E2E_COMPOSE) up -d --no-deps --force-recreate chrome

test-e2e: chrome
	@docker-compose $(E2E_COMPOSE) exec -e BASE_URL=http://nginx -T web $(command)

build: check ## Build all or single services  (docker)
	@docker-compose $(DOCKER_COMPOSE) build $(service)

check: ## Verify and setup docker dependencies  (docker)
	@(((docker images | grep application/nodejs) > /dev/null 2>&1) || make backend) || true

backend: ## Build base docker-image  (docker)
	@docker build -t application/nodejs --target nodejs -f e2e/docker/Dockerfile.backend .

integration: check ## Env for frontend-development and QA  (docker)
	@docker-compose $(E2E_COMPOSE) up -d --force-recreate $(PORT_FLAGS)

provision: check ## Env for production or staging servers  (docker)
	@docker-compose $(PRE_COMPOSE) run --rm -p 4001:80 -d nginx

	@printf "\nPlease wait while the server is being provisioned... "
	@printf "\nOnce done, it will be available at $(BASE_URL)/"
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
	@mkdir -p coverage/$(run) && npm run test:coverage:$(run)
	@make -s cov report="text-lcov > coverage/$(run)/lcov.info"

cov: deps ## Report coverage after tests  (host)
	@npm run test:report -- -r $(report)

all: deps ## Single-shot development workspace  (host)
	@make -s up service=db
	@make -s schema templates database dev

dev: kill ## Develop NodeJS application only  (host)
	@make -s watch & npm run dev

api: kill
	@npm run watch

e2e: deps ## Headlessly run E2E tests  (host)
	@npm run test:e2e -- e2e/cases
	@npm run test:bdd -- --take-snapshot -S -s e2e/screenshots

lint: deps ## Run ESLint on all source files  (host)
	@npm run lint

kill: deps ## Stop started services by port-number  (host)
	@make -s :4001! :3000! :1080! :1081! :1025!

dist: deps ## Build artifacts for production  (host)
	@npm run build:mail && npm run schema && npm run dist

%\:repl:
	@make -S repl app=$*
repl: deps ## Interactive console  (host)
	@npm run grown -- repl models:$(models)

%\:seed:
	@make -S seed app=$*
seed: deps ## Run custom seeders  (host)
	@npm run grown -- backup models:$(models) --load $(dbpath)/seeders/$(NODE_ENV)

reset: deps ## Run integration_seeds  (host)
	@node exec $(dbpath)/integration_seeds

clear: deps ## Run integration_seeds with --clear  (host)
	@node exec $(dbpath)/integration_seeds --clear

exec: deps ## Run local scripts through the system  (host)
	@node exec $(script)

watch: deps ## Enable nodemon watching of sources  (host)
	@(npm run watch 2>&1 | npm run logs) & npm run watch:mail

clean: ## Remove cache and generated artifacts  (host)
	@$(call iif,rm -r pgdata build etc/schema/generated etc/mailer/generated,Built artifacts were deleted,Artifacts already deleted)
	@$(call iif,unlink .tarima,Cache file was deleted,Cache file already deleted)
	@$(call iif,rm -f logs/*.log,Logs were deleted,Logs already deleted)

prune: ## Remove schema files and migrations  (host)
	@$(call iif,rm -r $(dbpath)/migrations/*.js,Migrations deleted,Migrations already deleted)
	@$(call iif,rm -r $(dbpath)/schema*,Schema deleted,Schema already deleted)

deps: ## Check for installed dependencies  (host)
	@$(call ls,node_modules,npm i)

purge: ## Remove all from node_modules/*  (host)
	@printf "\r* Removing all dependencies... "
	@rm -rf node_modules/.{bin,cache}
	@rm -rf node_modules/*
	@echo "OK"

schema: deps ## Generate sources from given schemas  (host)
	@npm run schema

templates: deps ## Regenerate mailing templates  (host)
	@npm run build:mail

database: deps ## Start database for development  (host)
	@make -s migrate-up reset

migrate-%: deps ## Generic method to run migrate-tasks  (host)
	@npm run grown -- migrate models:$(models) --$(subst :, --,$*)

%\:migrate:
	@make -S migrate app=$*
migrate: deps ## Run & apply pending migrations	  (host)
	@make -s migrate-up
	@make -s migrate-apply

%\:models:
	@make -S models app=$*
models: deps ## Autogenerate new migration files  (host)
	@make -s migrate-make
