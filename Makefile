TASK ?= test
RUNNER ?= test
NODE_ENV ?= test

ifdef CI
	TASK=test:ci
	RUNNER=testc
endif

ifneq ($(wildcard .env),)
	include .env
endif

GIT_REVISION=$(shell git rev-parse --short=7 HEAD)

export NODE_ENV GIT_REVISION

test-ci:
	@make -s check test-all

test-all:
	@make -s $(RUNNER):bud $(RUNNER):cli $(RUNNER):grpc $(RUNNER):graphql $(RUNNER):model
	@make -s $(RUNNER):repl $(RUNNER):test $(RUNNER):conn $(RUNNER):access $(RUNNER):session
	@make -s $(RUNNER):logger $(RUNNER):render $(RUNNER):router $(RUNNER):static $(RUNNER):upload

ci: deps
	@make -s clean setup test-ci
	@make -s test:server U_WEBSOCKETS_SKIP=true
	@make -s test:server
ifdef CI
	@make -s codecov
endif

testc\:%:
	@make -s test:$* coverage:$*

coverage\:%:
	@mkdir -p build/coverage
	@((sed 's|$(PWD)/packages/$(subst coverage:,,$*)/||g' packages/$(subst coverage:,,$*)/coverage/lcov.info \
			| sed 's|^SF:|SF:packages/$(subst coverage:,,$*)/|g' \
			> build/coverage/$(subst coverage:,,$*).info) > /dev/null 2>&1) || true

codecov:
	@curl -s https://codecov.io/bash > codecov.sh
	@chmod +x codecov.sh
	@./codecov.sh -p build/coverage -f '*.info' -F unit

publish:
	@make -C website dist deploy

release: install
	@lerna publish || true

install: deps
	@(((which lerna) > /dev/null 2>&1) || npm i -g lerna) || true

setup: install
	@lerna bootstrap

web\:%:
	@make -C website $*

dev\:%:
	@cd packages/$(subst dev:,,$*) && npm run dev

test\:%:
	@lerna run $(TASK) --scope @grown/$*

clean: install
	@lerna clean -y --ignore grown

check: deps
	@npm run lint
	@echo "Done."

deps: package*.json
	@(((ls node_modules | grep .) > /dev/null 2>&1) || npm i) || true
