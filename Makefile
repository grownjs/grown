TASK ?= test

ifdef CI
	TASK=test:ci
endif

test-all:
	@make test:bud test:cli test:server test:parsers test:conn

test-ci:
	@make -C application lint
	@make test-all

release:
	@mv lerna.json lerna.json_backup
	@echo '{"lerna": "2.8.0","packages":[".","packages/*"],"version": "independent"}' > lerna.json
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
