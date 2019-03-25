src=./application

help:
	@echo "Search any $(src) commands, prefix with ':' to execute them!"
	@echo
	@echo "Usage:"
	@echo "  make [SEARCH|:SUBMAKE] [...]"
	@echo
	@echo "Examples:"
	@echo "  make :help       -- To display all $(src) commands "
	@echo "  make :clean:dev  -- Run more commands separated by ':'"

%:
	@make -sC $(src) | grep $*

\:%:
	@make -sC $(src) $(subst :, ,$@)
