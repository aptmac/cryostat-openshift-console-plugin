import { CryostatPluginUtilsConfig } from '@console-plugin/utils/CryostatPluginUtilsConfig';
import { isUtilsConfigSet, k8sPatchResource, setUtilsConfig } from '@openshift/dynamic-plugin-sdk-utils';
import {
  K8sModel,
  K8sResourceCommon,
  K8sResourceKind,
  Patch,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { Modal, Button, ModalVariant, FormSelect, FormGroup, Form, FormSelectOption, FormHelperText, HelperText, HelperTextItem, ValidatedOptions } from '@patternfly/react-core';
import React from 'react';

interface CryostatModalProps {
  kind: K8sModel;
  resource: K8sResourceKind;
  isOpen: boolean;
  closeModal: () => void;
}

export const DeploymentLabelModal: React.FC<CryostatModalProps> = ({ kind, resource, closeModal }) => {
  const [formSelectValue, setFormSelectValue] = React.useState('-1');
  const [initialValue, setInitialValue] = React.useState('-1');
  const [helperText, setHelperText] = React.useState('');
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

  React.useLayoutEffect(() => {
    const deploymentLabels = resource.spec?.template.metadata.labels;
    const name = deploymentLabels['cryostat.io/name'];
    const namespace = deploymentLabels['cryostat.io/namespace'];
    for (let i = 0; i < instances.length; i++) {
      if (instances[i].metadata?.name === name && instances[i].metadata?.namespace === namespace) {
        setFormSelectValue(i.toString());
        setInitialValue(i.toString());
        return;
      }
    }
  }, [resource, instances]);

  function addLabels() {
    const instance = instances[formSelectValue];
    if (!isUtilsConfigSet()) {
      setUtilsConfig(CryostatPluginUtilsConfig);
    }
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

  function confirm() {
    if (formSelectValue !== initialValue) {
      if (formSelectValue !== '-1') {
        addLabels();
      } else {
        removeLabels();
      }
    }
    closeModal();
  }

  const onChange = (_event: React.FormEvent<HTMLSelectElement>, value: string) => {
    setFormSelectValue(value);
    setHelperText('');
    if (value === initialValue) {
      setHelperText('Deployment is already registered with this option');
    }
  };

  return (
    <React.Fragment>
      <Modal
        variant={ModalVariant.small}
        title={`Register ${resource.metadata?.name} with Cryostat`}
        isOpen={true}
        onClose={closeModal}
        actions={[
          <Button key="confirm" variant="primary" onClick={confirm}>
            Confirm
          </Button>,
          <Button key="cancel" variant="secondary" onClick={closeModal}>
            Cancel
          </Button>
        ]}
        ouiaId="CryostatModal"
      >
        <Form>
          <FormGroup label="Select a Cryostat instance:" type="string" fieldId="selection">
            <FormSelect
              id="cryostat-selection"
              value={formSelectValue}
              onChange={onChange}
              aria-label="Cryostat FormSelect Input">
              <FormSelectOption key={'-1'} value={'-1'} label={'<No labels>'}/>
              {instances.map((instance, index) => {
                return (
                  <FormSelectOption
                    key={index}
                    value={index}
                    label={`${instance.metadata?.name} (ns: ${instance.metadata?.namespace})`}
                  />
                );
              })}
            </FormSelect>
            <FormHelperText>
              <HelperText>
                <HelperTextItem>{helperText}</HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>
        </Form>
      </Modal>
    </React.Fragment>
  );
};
