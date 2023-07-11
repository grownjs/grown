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

test:
	@make -s test-ci

test-ci:
	@make -s check test-all

test-all:
	@make -s $(RUNNER):bud $(RUNNER):cli $(RUNNER):grpc $(RUNNER):graphql $(RUNNER):model
	@make -s $(RUNNER):repl $(RUNNER):test $(RUNNER):conn $(RUNNER):server $(RUNNER):access $(RUNNER):session
	@make -s $(RUNNER):cache $(RUNNER):logger $(RUNNER):render $(RUNNER):router $(RUNNER):static $(RUNNER):upload

ci:
	@make -s test
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

release: install test-ci
	@rm -f packages/*/package-lock.json package-lock.json
	@lerna publish || true

install:
	@(((which lerna) > /dev/null 2>&1) || npm i -g lerna) || true

setup: install
	@npm i --no-audit

web\:%:
	@make -C website $*

dev\:%:
	@cd packages/$(subst dev:,,$*) && npm run dev

test\:%:
	@lerna run $(TASK) --scope @grown/$*

clean:
	@lerna clean -y --scope grown
	@lerna clean -y --ignore grown
	@sh -c 'rm -f packages/*/package-lock.json'

check:
	@npm run lint
	@echo "Done."

deps:
	@npm i -g ts-node typescript tsconfig-paths
