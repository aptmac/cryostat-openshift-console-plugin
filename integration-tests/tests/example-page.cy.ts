import { checkErrors } from '../support';

const PLUGIN_TEMPLATE_NAME = 'cryostat-openshift-console-plugin';
const PLUGIN_TEMPLATE_PULL_SPEC = Cypress.env('PLUGIN_TEMPLATE_PULL_SPEC');
export const isLocalDevEnvironment = Cypress.config('baseUrl').includes('localhost');

const installHelmChart = (path: string) => {
  cy.exec(
    `cd ../../openshift-console-plugin-test && ${path} upgrade -i ${PLUGIN_TEMPLATE_NAME} charts/openshift-console-plugin -n ${PLUGIN_TEMPLATE_NAME} --create-namespace --set plugin.image=${PLUGIN_TEMPLATE_PULL_SPEC}`,
    {
      failOnNonZeroExit: false,
    },
  )
    .get('[data-test="refresh-web-console"]', { timeout: 300000 })
    .should('exist')
    .then((result) => {
      cy.reload();
      cy.visit(`/dashboards`);
      cy.log('Error installing helm chart: ', result.stderr);
      cy.log('Successfully installed helm chart: ', result.stdout);
    });
};
const deleteHelmChart = (path: string) => {
  cy.exec(
    `cd ../../console-plugin-template && ${path} uninstall ${PLUGIN_TEMPLATE_NAME} -n ${PLUGIN_TEMPLATE_NAME} && oc delete namespaces ${PLUGIN_TEMPLATE_NAME}`,
    {
      failOnNonZeroExit: false,
    },
  ).then((result) => {
    cy.log('Error uninstalling helm chart: ', result.stderr);
    cy.log('Successfully uninstalled helm chart: ', result.stdout);
  });
};

describe('Console plugin template test', () => {
  before(() => {
    cy.login();

    // if (!isLocalDevEnvironment) {
    //   console.log('this is not a local env, installing helm');

    //   cy.exec('cd ../../console-plugin-template && ./install_helm.sh', {
    //     failOnNonZeroExit: false,
    //   }).then((result) => {
    //     cy.log('Error installing helm binary: ', result.stderr);
    //     cy.log('Successfully installed helm binary in "/tmp" directory: ', result.stdout);

    //     installHelmChart('/tmp/helm');
    //   });
    // } else {
    //   console.log('this is a local env, not installing helm');

    //   installHelmChart('helm');
    // }
  });

  afterEach(() => {
    // checkErrors();
  });

  after(() => {
    // if (!isLocalDevEnvironment) {
    //   deleteHelmChart('/tmp/helm');
    // } else {
    //   deleteHelmChart('helm');
    // }
    cy.logout();
  });

  // currently expects:
  // - cryostat operator to be installed
  // - cryostat project/instance to be configured and available
  // - at least one target to exist in the cryostat project
  it('should check out the dashboard', () => {
    cy.contains('[class="pf-v5-c-nav__link"]', 'Cryostat').click();
    cy.get('[data-test="nav"]').contains('Navigation.Dashboard').click(); // todo: fix i18n within the test runs
    cy.url().should('include', '/cryostat');

    // select the first Cryostat instance, and first target available
    cy.get('button[class="pf-v5-c-menu-toggle"]').click();
    cy.get('button[tabindex="0"]').click();
    cy.get('button[aria-label="Select Target"]').click();
    cy.get('button[tabindex="0"').click();

    // fetch the first chart axis label, wait 11s, and then compare the new value to the initial one to check for an update
    // however, there is a chance it updates to the same value, so should also check to make sure that it's not the initial 5.0e-11 value
    cy.get('text[id="chart-axis-1-ChartLabel-0"]')
      .find('tspan')
      .first()
      .then(($span) => {
        let value1 = $span.text();
        cy.wait(11000);
        cy.get('text[id="chart-axis-1-ChartLabel-0"]').find('tspan').first().should('not.contain.text', value1);
      });
  });

  // it('should install the cryostat operator', () => {
  //   cy.get('[data-quickstart-id="qs-nav-operators"]').click();
  //   cy.get('[data-test="nav"]').contains('OperatorHub').click();
  //   cy.get('input[class="pf-v5-c-text-input-group__text-input"').type('Cryostat', { force: true });
  //   cy.get('a[id="cryostat-operator-redhat-operators-openshift-marketplace"]').click();
  //   cy.get('a[data-test-id="operator-install-btn"').click({ force: true });
  //   // check to see if it's installed, if not, install it, if so, then continue
  //   cy.get('[data-test="install-operator"]').should('not.to.be.disabled');
  // });
});
