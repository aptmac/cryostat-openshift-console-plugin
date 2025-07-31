import React from 'react';
import { Modal, Button } from '@patternfly/react-core';
import { K8sModel, K8sResourceKind, Patch } from '@openshift-console/dynamic-plugin-sdk';
import { isUtilsConfigSet, k8sPatchResource, setUtilsConfig } from '@openshift/dynamic-plugin-sdk-utils';
import { CryostatPluginUtilsConfig } from '@console-plugin/utils/CryostatPluginUtilsConfig';

interface CryostatModalProps {
  kind: K8sModel;
  resource: K8sResourceKind;
  isOpen: boolean;
  closeModal: () => void;
}

export const DeploymentLabelModal: React.FC<CryostatModalProps> = ({ kind, resource, closeModal }) => {
  const submit = (e) => {
    e.preventDefault();
    if (!isUtilsConfigSet()) {
      setUtilsConfig(CryostatPluginUtilsConfig);
    }
    // temp placeholders
    const instanceName = 'name';
    const instanceNamespace = 'namespace';
    // todo - base should be just adding the new labels
    // todo - handle un-registering from cryostat
    // todo - handle updating -> changing from one cryostat to another
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
  };
  return (
    <React.Fragment>
      <Modal
        title="Cryostat Action"
        isOpen={true}
        onClose={closeModal}
        actions={[
          <Button key="confirm" variant="primary" onClick={closeModal}>
            Confirm
          </Button>,
          <Button key="cancel" variant="link" onClick={closeModal}>
            Cancel
          </Button>,
        ]}
        ouiaId="CryostatModal"
      >
        Hi there, I&apos;m a Cryostat Action Modal.
        <Button onClick={submit}>Click me to add some labels..</Button>
      </Modal>
    </React.Fragment>
  );
};
