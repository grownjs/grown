src=./application

help:
	@echo "Search any $(src) commands, prefix with ':' to execute them!"
	@echo
	@echo "Usage:"
	@echo "  make [SEARCH|:SUBMAKE] [...]"
	@echo
	@echo "Examples:"
	@echo "  make :\033[36mhelp\033[0m       -- To display all $(src) commands "
	@echo "  make :\033[36mclean\033[0m:\033[36mdev\033[0m  -- Run more commands separated by ':'"

%:
	@make -sC $(src) | grep -i "$*"

\:%:
	@make -sC $(src) $(subst :, ,$@)
