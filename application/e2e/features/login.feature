@before=resize
@path=/

Feature: User authorization

@snapshot=loginForm,body
Scenario: Login with user and password
  When I click on <login>
  Then I should navigate to <loginPage>

  When I fill <loginEmail> with "[EMAIL]"
  Then I fill <loginPassword> with "[PASSWORD]"
  Then I click on <loginSubmitButton>
  Then I see "[SUCCESS]"

  Examples:
    EMAIL             | PASSWORD             | SUCCESS
    <adminUser.email> | <adminUser.password> | Glad you're back!
