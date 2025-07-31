import React from 'react';
import { Modal, Button } from '@patternfly/react-core';
import { K8sModel, K8sResourceCommon, K8sResourceKind, Patch } from '@openshift-console/dynamic-plugin-sdk';
import { usePromiseHandler } from '../hooks/promise-handler';
import {
  getUtilsConfig,
  isUtilsConfigSet,
  K8sModelCommon,
  k8sPatchResource,
  K8sResourcePatchOptions,
  k8sUpdateResource,
  setUtilsConfig,
  UtilsConfig,
  WebSocketAppSettings,
  WebSocketOptions,
} from '@openshift/dynamic-plugin-sdk-utils';
import * as _ from 'lodash';
import { config } from './SDKInitialize';

interface CryostatModalProps {
  kind: K8sModel;
  resource: K8sResourceKind;
  isOpen: boolean;
  closeModal: () => void;
}

export const CryostatModal: React.FC<CryostatModalProps> = ({ kind, resource, closeModal }) => {
  const [handlePromise, errorMessage] = usePromiseHandler<K8sResourceCommon>();
  const getCSRFToken = () => {
    const cookiePrefix = 'csrf-token=';
    return (
      document &&
      document.cookie &&
      document.cookie
        .split(';')
        .map((c) => c.trim())
        .filter((c) => c.startsWith(cookiePrefix))
        .map((c) => c.slice(cookiePrefix.length))
        .pop()
    );
  };

  const applyConsoleHeaders = (url, options) => {
    const token = getCSRFToken();
    if (options.headers) {
      options.headers['X-CSRFToken'] = token;
    } else {
      options.headers = { 'X-CSRFToken': token };
    }

    // X-CSRFToken is used only for non-GET requests targeting bridge
    if (options.method === 'GET' || url.indexOf('://') >= 0) {
      delete options.headers['X-CSRFToken'];
    }
    return options;
  };

  const initDefaults = {
    headers: {},
    credentials: 'same-origin',
  };

  const validateStatus = async (response: Response, url: string, method: string, retry: boolean) => {
    console.warn('response:', response);
    if (response.ok) {
      return response;
    }

    if (retry && response.status === 429) {
      throw new Error();
    }

    if (response.status === 401) {
      const next = window.location.pathname + window.location.search + window.location.hash;
      console.warn('401');
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || contentType.indexOf('json') === -1) {
      throw new Error(response.statusText);
    }

    if (response.status === 403) {
      return response.json().then((json) => {
        throw new Error(json.message || 'Access denied due to cluster policy.');
      });
    }

    return response.json().then((json) => {
      // retry 409 conflict errors due to ClustResourceQuota / ResourceQuota
      // https://bugzilla.redhat.com/show_bug.cgi?id=1920699
      if (
        retry &&
        method === 'POST' &&
        response.status === 409 &&
        ['resourcequotas', 'clusterresourcequotas'].includes(json.details?.kind)
      ) {
        throw new Error();
      }
      const cause = json.details?.causes?.[0];
      let reason;
      if (cause) {
        reason = `Error "${cause.message}" for field "${cause.field}".`;
      }
      if (!reason) {
        reason = json.message;
      }
      if (!reason) {
        reason = json.error;
      }
      if (!reason) {
        reason = response.statusText;
      }

      throw new Error(reason);
    });
  };

  const submit = (e) => {
    console.warn('hi');
    const testConfig: UtilsConfig = {
      appFetch: async function (url: string, requestInit?: RequestInit): Promise<Response> {
        let attempt = 0;
        let response!: Promise<Response>;
        let retry = true;
        url = `/api/kubernetes${url}`;
        const op1 = applyConsoleHeaders(url, requestInit);
        const allOptions = _.defaultsDeep({}, initDefaults, op1);

        while (retry) {
          retry = false;
          attempt++;
          try {
            return await fetch(url, allOptions).then((resp) =>
              validateStatus(resp, url, allOptions.method, attempt < 3),
            );
          } catch (e) {
            console.warn(`consoleFetch failed for url ${url}`, e);
            throw e;
          }
        }
        return response;
      },
      wsAppSettings: function (
        options: WebSocketOptions & { wsPrefix?: string; pathPrefix?: string },
      ): Promise<WebSocketAppSettings> {
        throw new Error('Function not implemented.');
      },
    };
    if (!isUtilsConfigSet()) {
      setUtilsConfig(testConfig);
    }
    // setUtilsConfig(config);
    e.preventDefault();
    let deploymentResource: K8sResourceKind;
    const patch: Patch[] = [
      {
        op: 'add',
        path: '/metadata/labels',
        value: {
          test: 'test',
        },
      },
    ];
    handlePromise(
      k8sPatchResource({
        model: kind,
        queryOptions: { name: 'quarkus-cryostat-agent', ns: 'cryostat' },
        patches: patch,
      }),
    );
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
