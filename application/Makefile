# current working directory
PWD=$(shell pwd)

# default settings
run := unit
exec := /bin/bash
from := lib/models
report := html
target := develop
profile := $(notdir $(PWD))

# common ports
PORT := 4001
WEBMAIL := 1080
POSTGRES := 5431

# environment
NODE_ENV ?= development
EXEC_FLAGS ?= --rcfile /etc/profile
ENV_FLAGS ?= --name $(profile) --hostname $(profile)
ENV_VARS ?= -e DB_HOST=db -e POSTGRES_PASSWORD=*secret*
PORTS ?= $(PORT):4000,$(WEBMAIL):1080,$(POSTGRES):5432,9505:9505,9506:9506,35729:35729

ifneq ($(service),)
	ENV_FLAGS=--name $(service) --hostname $(service)
endif

ifneq ($(PORTS),)
	PORT_FLAGS=-p $(subst $(shell echo ','), -p ,$(PORTS))
endif

# export common vars
export PORT
export NODE_ENV

# dotenv support
ifneq ($(wildcard .env),)
	include .env
endif

# docker-compose configuration
BASE_COMPOSE=-f $(PWD)/docker-compose.yml
TEST_COMPOSE=$(BASE_COMPOSE) -f $(PWD)/docker-compose.test.yml
DEV_COMPOSE=$(TEST_COMPOSE) -f $(PWD)/docker-compose.dev.yml
E2E_COMPOSE=$(DEV_COMPOSE) -f $(PWD)/docker-compose.e2e.yml

help: Makefile
	@awk -F':.*?##' '/^[a-z\\%!:-]+:.*##/{gsub("%","*",$$1);gsub("\\\\",":*",$$1);printf "\033[36m%13s\033[0m %s\n",$$1,$$2}' $<

vm: Dockerfile ## Build base images from Dockerfile  (docker)
	@printf "Building vm image '$(target)' from $< ...\r"

	@docker build --target $(target) -t $(target) -q $(PWD) && \
		echo "Type \`make dev\` inside to spawn all services at once! ;-)"

env: vm ## Spin into development container  (docker)
	@docker run -it -v /var/run/docker.sock:/var/run/docker.sock \
		-v $(PWD):/home/dev/src -v $(HOME)/.gitconfig:/home/dev/.gitconfig \
		-v $(HOME)/.ssh:/home/dev/.ssh -v $(HOME)/.config:/home/dev/.config -v $(HOME)/.npm:/home/dev/.npm \
		--env-file $(PWD)/.env -e VM=YES $(ENV_VARS) $(ENV_FLAGS) --privileged --rm -P $(PORT_FLAGS) $(target) $(exec) $(EXEC_FLAGS)

e2e: ## Headlessly run E2E tests  (docker)
	@docker-compose $(E2E_COMPOSE) exec -T web bash -c "wait-for-it -t 0 web:4000 && npm run test:e2e:ci -- e2e/cases"

all: ## Build all or single services  (docker)
	@docker-compose $(BASE_COMPOSE) build $(service)

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

test: ## Test current build of a service  (docker)
	@$(AWSSE) -- \
		docker-compose $(TEST_COMPOSE) -f $(PWD)/services/$(service)/docker-compose.test.yml run -T $(service)

integration: ## Env for frontend-development and QA  (docker)
	@$(AWSSE) -- docker-compose $(E2E_COMPOSE) run --rm -d -P $(PORT_FLAGS) $(service)

provision: ## Env for production or staging servers  (docker)
	@$(AWSSE) -- \
		docker-compose $(BASE_COMPOSE) run --rm -p $(PORT):80 -d $(service)

	@echo "Please wait while the server is provisioned..."
	@echo "Once done, it will be available at http://$(shell hostname):$(PORT)/"

!%: ## Kill services by name with pkill  (host)
	@(pkill -9 $(subst !,,$@) > /dev/null 2>&1) || true

ci: dependencies ## Run tests and report coverage results! :wink:  (host)
	@mkdir -p $(run)_coverage
	@make -s ci output="text-lcov > $(run)_coverage/lcov.info"

cov: dependencies ## Report coverage after tests  (host)
	@npm run test:report -- -r $(report)

add: ## Setup dependencies  (host)
	@npm i $(pkg) --save

rm: ## Remove installed dependencies  (host)
	@npm un $(pkg)

dev: dependencies ## Single-shot development workspace  (host)
	@make -s up service=db
	@make -s database && make -s templates
	@npm run dev & npm run watch & npm run watch:mail

dist: dependencies ## Build artifacts for production  (host)
	@npm run build:mail && npm run schema && npm run dist

seed: dependencies ## Run custom seeders  (host)
	@npm run grown -- backup --models $(from) --load $(PWD)/db/seeders/$(NODE_ENV)

reset: dependencies ## Run integration_seeds  (host)
	@node $(PWD)/db/integration_seeds

clear: dependencies ## Run integration_seeds with --clear  (host)
	@node $(PWD)/db/integration_seeds --clear

prune: ## Remove schema files and migrations  (host)
	@((rm $(PWD)/db/schema* > /dev/null 2>&1) && echo "Schema deleted") || echo "Schema already deleted"
	@((rm $(PWD)/db/migrations/*.js > /dev/null 2>&1) && echo "Migrations deleted") || echo "Migrations already deleted"

check: ## Find duplicated code on the project  (host)
	@jscpd . -g -i '**/migrations/**,**/scripts/**' -t 10

remove: ## Delete all node_modules and more  (host)
	@rm -rf $(PWD)/node_modules
	@rm -rf $(PWD)/pgdata
	@rm -rf $(PWD)/build
	@rm -rf $(PWD)/log
	@rm -rf $(PWD)/.tarima
	@rm -rf $(PWD)/lib/mailer/generated
	@rm -rf $(PWD)/api/schema/generated

database: dependencies ## Start database for development  (host)
	@make -s migrate reset

migrate: dependencies ## Execute pending migrations  (host)
	@npm run grown -- migrate --models $(from) --up

rollback: dependencies ## Rollback executed migrations  (host)
	@npm run grown -- migrate --models $(from) --down

migration: dependencies ## Autogenerate new migration files  (host)
	@npm run grown -- migrate --models $(from) --make
	@npm run grown -- migrate --models $(from) --up
	@npm run grown -- migrate --models $(from) --apply

templates: dependencies ## Regenerate mailing templates  (host)
	@npm run build:mail

# Ensure dependencies are installed before
.PHONY: help env dev
dependencies: ## Check node_modules for updates  (host)
	@echo FIXME
#@(((ls node_modules | grep . && npm ls --depth=0 | grep 'UNMET DEPENDENCY') > /dev/null 2>&1) || npm info grown) || true
