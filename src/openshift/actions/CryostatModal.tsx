import React from 'react';
import { Modal, Button } from '@patternfly/react-core';
import { K8sModel, K8sResourceCommon, K8sResourceKind } from '@openshift-console/dynamic-plugin-sdk';
import { usePromiseHandler } from '../hooks/promise-handler';
import { K8sModelCommon, k8sPatchResource, K8sResourcePatchOptions } from '@openshift/dynamic-plugin-sdk-utils';

interface CryostatModalProps {
  kind: K8sModel;
  resource: K8sResourceKind;
  isOpen: boolean;
  closeModal: () => void;
}

export const CryostatModal: React.FC<CryostatModalProps> = ({ kind, resource, closeModal }) => {
  const [handlePromise, errorMessage] = usePromiseHandler<K8sResourceCommon>();
  console.warn(kind, resource);
  console.warn(resource?.metadata?.labels);
  const submit = (e) => {
    console.warn('hi');
    e.preventDefault();
    const data = [
      {
        op: 'test',
        path: 'test',
        value: 'thisisatest',
      },
    ];
    const m: K8sModelCommon = {
      apiVersion: kind.apiVersion,
      kind: kind.id || '',
      plural: kind.plural,
    };
    const options: K8sResourcePatchOptions = {
      model: {} as K8sModelCommon,
      patches: [],
    };
    k8sPatchResource(options)
      // k8sPatchResource({ model: m, patches: [], queryOptions: {} })
      .then((e) => {
        console.warn('hi', e);
      })
      .catch((e) => {
        console.warn('error: ', e);
      });
    // handlePromise(promise).then(close);
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
        Hi there, I'm a Cryostat Action Modal.
        <Button onClick={submit}>Click me to add some labels..</Button>
      </Modal>
    </React.Fragment>
  );
};
