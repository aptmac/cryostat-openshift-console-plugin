import React from 'react';
import { Modal, Button, Stack } from '@patternfly/react-core';
import {
  K8sModel,
  K8sResourceCommon,
  K8sResourceKind,
  Patch,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { isUtilsConfigSet, k8sPatchResource, setUtilsConfig } from '@openshift/dynamic-plugin-sdk-utils';
import { CryostatPluginUtilsConfig } from '@console-plugin/utils/CryostatPluginUtilsConfig';

interface CryostatModalProps {
  kind: K8sModel;
  resource: K8sResourceKind;
  isOpen: boolean;
  closeModal: () => void;
}

export const DeploymentLabelModal: React.FC<CryostatModalProps> = ({ kind, resource, closeModal }) => {
  const [instances] = useK8sWatchResource<K8sResourceCommon[]>({
    isList: true,
    namespaced: true,
    namespace: undefined,
    groupVersionKind: {
      group: '',
      kind: 'Service',
      version: 'v1',
    },
    selector: {
      matchLabels: {
        'app.kubernetes.io/part-of': 'cryostat',
        'app.kubernetes.io/component': 'cryostat',
      },
    },
  });

  function addLabels(instance: K8sResourceCommon) {
    if (!isUtilsConfigSet()) {
      setUtilsConfig(CryostatPluginUtilsConfig);
    }
    console.warn('hitting addLabels() with', instance);
    const instanceName = instance.metadata?.name;
    const instanceNamespace = instance.metadata?.namespace;
    const patch: Patch[] = [
      {
        op: 'add',
        path: '/metadata/labels',
        value: {
          'cryostat.io/name': instanceName,
          'cryostat.io/namespace': instanceNamespace,
        },
      },
    ];
    k8sPatchResource({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      model: kind,
      queryOptions: { name: resource.metadata?.name, ns: resource.metadata?.namespace },
      patches: patch,
    });
  }

  return (
    <React.Fragment>
      <Modal
        title="Cryostat Action"
        isOpen={true}
        onClose={closeModal}
        actions={[
          <Button key="exit" variant="primary" onClick={closeModal}>
            Close
          </Button>,
        ]}
        ouiaId="CryostatModal"
      >
        <Stack>
          {instances.map((i) => {
            return (
              <button
                key={`button-${i.metadata?.uid}`}
                onClick={() => addLabels(i)}
              >{`${i.metadata?.name} (${i.metadata?.namespace})`}</button>
            );
          })}
        </Stack>
      </Modal>
    </React.Fragment>
  );
};
