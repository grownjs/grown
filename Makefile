src=./application

help:
	@echo "Search any $(src) commands, prefix with ':' to execute them!"
	@echo
	@echo "Usage:"
	@echo "  make [SEARCH|:SUBMAKE|web:SUBMAKE] [...]"
	@echo
	@echo "Examples:"
	@echo "  make :\033[36mhelp\033[0m       -- To display all $(src) commands "
	@echo "  make :\033[36mclean\033[0m:\033[36mdev\033[0m  -- Run more commands separated by ':'"
	@echo "  make \033[36mweb\033[0m:\033[36mdev\033[0m     -- Run scripts from webapp"

%:
	@make -sC $(src) | grep -i "$*"

\:%:
	@make -sC $(src) $(subst :, ,$*)

web\:%:
	@cd website && npm run $(subst :, ,$*)
