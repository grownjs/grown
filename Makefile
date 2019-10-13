TASK ?= test

ifdef CI
	TASK=test:ci
endif

test-all:
	@make test:bud test:cli test:server test:parsers test:conn

test-ci:
	@make install test-all

install:
	@npm run lerna clean
	@npm run lerna bootstrap

test\:%:
	@cd packages/$(subst test:,,$@) && npm run $(TASK)

clean:
	@npm run lerna clean -- -y
