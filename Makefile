test:
	@npm run lerna bootstrap
	@npm run lerna run -- test:ci --scope @grown/bud
	@npm run lerna run -- test:ci --scope @grown/cli
	@npm run lerna run -- test:ci --scope @grown/server
	@npm run lerna run -- test:ci --scope @grown/parsers
	@npm run lerna run -- test:ci --scope @grown/conn

clean:
	@npm run lerna clean
