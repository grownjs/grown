?:
	@make -sC application ?

%:
	@make -sC application $*

web:
	@make -sC website

web\:%:
	@make -sC website $(subst :, ,$(subst web:,,$*))
