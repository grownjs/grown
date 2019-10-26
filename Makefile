TASK ?= test

ifdef CI
	TASK=test:ci
endif

test-all:
	@make test:bud test:cli test:server test:parsers test:conn

test-ci:
	@make -C application lint
	@make test-all

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
