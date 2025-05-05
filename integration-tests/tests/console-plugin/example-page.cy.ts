import { checkErrors } from '../../support';

const PLUGIN_TEMPLATE_NAME = 'cryostat-openshift-console-plugin';
const PLUGIN_TEMPLATE_PULL_SPEC = Cypress.env('PLUGIN_TEMPLATE_PULL_SPEC');
export const isLocalDevEnvironment = Cypress.config('baseUrl').includes('localhost');

const startOpenShift = (path: string) => {
  // first check to see if there is already an instance of OpenShift running, and if so, skip
  // run ./crc start and wait for it to complete
};

const stopOpenShift = (path: string) => {
  // run ./crc stop
};

const startConsole = (path: string) => {
  // first check to see if the console is running on port 9000, and if so, skip the next step and continue with tests
  // cd to base directory of project, and run `yarn run start-console` on a different thread
};

const startDevPlugin = (path: string) => {
  // first check to see if anything is running on port 9001, and if so, skip the next step and continue with tests
  // cd to base directory of project, and run `yarn run start` on a different thread
};

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

  beforeEach(() => {
    cy.reload();
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    // if (!isLocalDevEnvironment) {
    //   deleteHelmChart('/tmp/helm');
    // } else {
    //   deleteHelmChart('helm');
    // }
    cy.logout();
  });

  it('should visit each page without errors', () => {
    const pages = ['About', 'Dashboard', 'Topology', 'Automated Rules', 'Archives', 'Events', 'Security'];
    cy.contains('[class="pf-v5-c-nav__link"]', 'Cryostat').click();
    pages.forEach((page) => {
      cy.get('[class="pf-v5-c-nav__link"]').get('[href^="/cryostat"]').contains(page).click();
      checkErrors();
    });
  });

  it('should check out the dashboard', () => {
    cy.contains('[class="pf-v5-c-nav__link"]', 'Cryostat').click();
    cy.get('[data-test="nav"]').contains('Dashboard').click();
    cy.url().should('include', '/cryostat');

    // select the first Cryostat instance, and first target available
    cy.get('div[aria-label="cryostat-selector"]').find('button').click();
    cy.get('div[aria-label="cryostat-selector-dropdown"]').find('button[tabindex="0"]').click();

    // select the first Cryostat target available
    cy.get('button[aria-label="Select Target"').find('[class="pf-v5-c-menu-toggle__text"]').click();
    cy.get('button[tabindex="0"').find('span[class=pf-v5-c-menu__item-text').click();

    // fetch the first chart axis label, wait 11s, and then compare the new value to the initial one to check for an update
    // however, there is a chance it updates to the same value, so should also check to make sure that it's not the initial 5.0e-11 value
    cy.get('text[id="chart-axis-1-ChartLabel-0"]')
      .find('tspan')
      .first()
      .then((span) => {
        const initialValue = span.text();
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(11000); // charts update every 10 seconds
        cy.get('text[id="chart-axis-1-ChartLabel-0"]').find('tspan').first().should('not.contain.text', initialValue);
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
