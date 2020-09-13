TASK ?= test
RUNNER ?= test

ifdef CI
	TASK=test:ci
	RUNNER=testc
endif

ifneq ($(wildcard .env),)
include .env
endif

.EXPORT_ALL_VARIABLES:

test-ci:
	@make lint test-all

test-all:
	@make $(RUNNER):bud $(RUNNER):cli $(RUNNER):grpc $(RUNNER):graphql $(RUNNER):model
	@make $(RUNNER):repl $(RUNNER):test $(RUNNER):conn $(RUNNER):server $(RUNNER):access $(RUNNER):session
	@make $(RUNNER):logger $(RUNNER):render $(RUNNER):router $(RUNNER):static $(RUNNER):tarima $(RUNNER):upload

ci: deps
	@make -s clean setup test-ci codecov

testc\:%:
	@make -s test:$(subst testc:,,$*) coverage:$(subst testc:,,$*)

codecov:
	@curl -s https://codecov.io/bash > codecov.sh
	@chmod +x codecov.sh
	@./codecov.sh -p build/coverage -f '*.info' -F unit

coverage\:%:
	@mkdir -p build/coverage
	@((sed 's|$(PWD)/packages/$(subst coverage:,,$*)/||g' packages/$(subst coverage:,,$*)/coverage/lcov.info \
			| sed 's|^SF:|SF:packages/$(subst coverage:,,$*)/|g' \
			> build/coverage/$(subst coverage:,,$*).info) > /dev/null 2>&1) || true

publish:
	@make -C website dist deploy

release: install
	@mv lerna.json lerna.json_backup
	@cat lerna.json_backup | grep -v application > lerna.json
	@git update-index --assume-unchanged lerna.json
	@lerna publish || true
	@mv lerna.json_backup lerna.json
	@git update-index --no-assume-unchanged lerna.json

install: deps
	@(((which lerna) > /dev/null 2>&1) || npm i -g lerna) || true

setup: install
	@lerna bootstrap

app\:%:
	@make -C application $*

web\:%:
	@make -C website $*

link\:%:
	@rm -rf $(PWD)/application/node_modules/@grown/$*
	@ln -s $(PWD)/packages/$* $(PWD)/application/node_modules/@grown/

dev\:%:
	@cd packages/$(subst dev:,,$*) && npm run dev

test\:%:
	@lerna run $(TASK) --scope @grown/$(subst test:,,$@)

clean: install
	@lerna clean -y

check: deps
	@npm run lint
	@make -C application lint
	@make -C website test
	@echo "Done."

deps: package*.json
	@(((ls node_modules | grep .) > /dev/null 2>&1) || npm i) || true
