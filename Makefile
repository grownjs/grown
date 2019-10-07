test-all:
	@npm run lerna bootstrap
	@make test:bud test:cli test:server test:parsers test:conn

test\:%:
	@cd packages/$(subst test:,,$@) && npm run test:ci

clean:
	@npm run lerna clean -- -y
