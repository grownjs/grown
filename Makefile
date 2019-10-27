TASK ?= test

ifdef CI
	TASK=test:ci
endif

test-all:
	@make test:bud test:cli test:server test:parsers test:conn

test-ci:
	@make -C application lint
	@make test-all

ci:
	@make -s clean setup test-ci

release:
	@mv lerna.json lerna.json_backup
	@cat lerna.json_backup | grep -v application > lerna.json
	@git update-index --assume-unchanged lerna.json
	@lerna publish || true
	@mv lerna.json_backup lerna.json
	@git update-index --no-assume-unchanged lerna.json

install:
	@npm i -g lerna

setup:
	@lerna bootstrap

dev\:%:
	@cd packages/$(subst dev:,,$*) && npm run dev

test\:%:
	@cd packages/$(subst test:,,$@) && npm run $(TASK)

clean:
	@lerna clean -y
