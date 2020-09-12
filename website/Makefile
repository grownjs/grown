#
# Current working directory
#
PWD=$(shell pwd)

#
# Defaults
#
src=build
from=master
target=gh-pages
message=Release: $(shell date)

# environment vars
ROOT=/
NODE_ENV=development

# export vars
export NODE_ENV ROOT

#
# Targets
#
.PHONY: ? add rm dev test deps clean prune dist pages deploy

#
# Utils
#
define iif
	@(($1 > /dev/null 2>&1) && printf "\r* $2\n") || printf "\r* $3\n"
endef

#
# Display all targets in this file
#
?: Makefile
	@awk -F':.*?##' '/^[a-z\\%!:-]+:.*##/{gsub("%","*",$$1);gsub("\\\\",":*",$$1);printf "\033[36m%8s\033[0m %s\n",$$1,$$2}' $<

#
# Development tasks
#
dev: deps ## Start development
	@npm run dev

#
# Testing tasks
#
test: deps ## Test for syntax issues
	@npm run check

#
# Build task
#
dist: deps ## Compile sources for production
	@NODE_ENV=production npm run dist -- -f

#
# Check dependencies
#
deps: ## Check for installed dependencies
	@(((ls node_modules | grep .) > /dev/null 2>&1) || npm i) || true

#
# Cleanup
#
clean: ## Remove cache and generated artifacts
	@$(call iif,rm -r $(src),Built artifacts were deleted,Artifacts already deleted)
	@$(call iif,unlink .tarima,Cache file was deleted,Cache file already deleted)

#
# Clean dependencies
#
prune: clean ## Remove all stuff from node_modules/*
	@printf "\r* Removing all dependencies... "
	@rm -rf node_modules/.{bin,cache}
	@rm -rf node_modules/*
	@echo "OK"

#
# GitHub Pages branch
#
pages: ## Fetch or create the target branch
	@(git fetch origin $(target) 2> /dev/null || (\
		git checkout --orphan $(target);\
		git rm -rf . > /dev/null;\
		git commit --allow-empty -m "initial commit";\
		git checkout $(from)))

#
# Deployment to GitHub Pages
#
deploy: pages ## Prepare and push changes on target branch
	@(mv $(src) .backup > /dev/null 2>&1) || true
	@(git worktree remove $(src) --force > /dev/null 2>&1) || true
	@(git worktree add $(src) $(target) && (cp -r .backup/* $(src) > /dev/null 2>&1)) || true
	@cd $(src) && git add . && git commit -m "$(message)" || true
	@(mv .backup $(src) > /dev/null 2>&1) || true
	@git push origin $(target) -f || true
