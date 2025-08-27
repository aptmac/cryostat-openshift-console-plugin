import { CryostatPluginUtilsConfig } from '@console-plugin/utils/CryostatPluginUtilsConfig';
import { isUtilsConfigSet, k8sPatchResource, setUtilsConfig } from '@openshift/dynamic-plugin-sdk-utils';
import {
  K8sModel,
  K8sResourceCommon,
  K8sResourceKind,
  Patch,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { Modal, Button, Stack } from '@patternfly/react-core';
import React from 'react';

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
        op: 'replace',
        path: '/spec/template/metadata/labels/cryostat.io~1name',
        value: instanceName
      },
      {
        op: 'replace',
        path: '/spec/template/metadata/labels/cryostat.io~1namespace',
        value: instanceNamespace
      },
    ];
    console.warn('kind', kind);
    console.warn('resource', resource);
    k8sPatchResource({
      // @ts-ignore
      model: kind,
      queryOptions: { name: resource.metadata?.name, ns: resource.metadata?.namespace },
      patches: patch,
    });
  }

  function removeLabels() {
       if (!isUtilsConfigSet()) {
      setUtilsConfig(CryostatPluginUtilsConfig);
    }
    const patch: Patch[] = [
      {
        op: 'replace',
        path: '/spec/template/metadata/labels/cryostat.io~1name',
        value: undefined
      },
      {
        op: 'replace',
        path: '/spec/template/metadata/labels/cryostat.io~1namespace',
        value: undefined
      },
    ];
    k8sPatchResource({
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
          <button key={`button-remove-labels`} onClick={() => removeLabels()}>Remove Labels</button>
        </Stack>
      </Modal>
    </React.Fragment>
  );
};
