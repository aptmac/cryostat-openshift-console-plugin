import { useCryostatTranslation } from '@i18n/i18nextUtil';
import { Action, K8sResourceKind, useK8sModel, useModal } from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import { DeploymentLabelModal } from './DeploymentLabelModal';

const DeploymentLabelActionProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel({ group: 'apps', version: 'v1', kind: 'Deployment' });
  const { t } = useCryostatTranslation();
  const launcher = useModal();
  const actions = React.useMemo<Action[]>(
    () => [
      {
        id: 'cryostat-action',
        label: t('CRYOSTAT_DEPLOYMENT_ACTION'),
        cta: () => {
          launcher(DeploymentLabelModal, { kind: kindObj, resource });
        },
      },
    ],
    [kindObj, launcher, resource, t],
  );
  return [actions, !inFlight, undefined];
};

export default DeploymentLabelActionProvider;
