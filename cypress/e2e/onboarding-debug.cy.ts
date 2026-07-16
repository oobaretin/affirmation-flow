describe('onboarding finish', () => {
  it('completes onboarding and reaches Today', () => {
    cy.visit('/');
    cy.window().then((win) => win.localStorage.removeItem('affirmation-flow-settings'));
    cy.reload();
    cy.get('input').first().type('TestUser', { force: true });
    cy.contains('ion-button', 'Continue').click({ force: true });
    cy.contains('ion-button', 'Continue').click({ force: true });
    cy.contains('ion-button', 'Continue').click({ force: true });
    cy.contains('ion-button', 'Start My Journey').click({ force: true });
    cy.contains('Hello, TestUser', { timeout: 10000 }).should('be.visible');
    cy.get('ion-tab-bar').should('be.visible');
  });
});
