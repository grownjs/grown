@before=resize
@path=/

Feature: Login

Scenario: Login with user and password
  When I click on @login
  Then I should navigate to @loginPage
