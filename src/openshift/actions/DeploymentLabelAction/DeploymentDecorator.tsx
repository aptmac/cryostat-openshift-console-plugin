import {
  k8sGet,
  K8sResourceCommon,
  K8sResourceKind,
  useK8sModel,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { Node } from '@patternfly/react-topology';
import * as React from 'react';
import CryostatIcon from './CryostatIcon';

type DeploymentDecoratorProps = {
  element: Node;
  radius: number;
  x: number;
  y: number;
};

export const DeploymentDecorator: React.FC<DeploymentDecoratorProps> = ({ element, radius, x, y }) => {
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
  const [routeModel] = useK8sModel({ group: 'route.openshift.io', version: 'v1', kind: 'Route' });
  const routeUrl = React.useRef('');
  if (element['resourceKind'] && element['resourceKind'] === 'apps~v1~Deployment') {
    const resource: K8sResourceKind = element['resource'];
    const labels = resource.spec?.template.metadata.labels;
    if (
      labels['cryostat.io/name'] &&
      labels['cryostat.io/name'] !== '' &&
      labels['cryostat.io/namespace'] &&
      labels['cryostat.io/namespace'] !== ''
    ) {
      for (let i = 0; i < instances.length; i++) {
        if (
          instances[i].metadata?.name === labels['cryostat.io/name'] &&
          instances[i].metadata?.namespace === labels['cryostat.io/namespace']
        ) {
          k8sGet({
            model: routeModel,
            name: labels['cryostat.io/name'],
            ns: labels['cryostat.io/namespace'],
          })
            .catch(() => '')
            .then(
              (route: any) => {
                const ingresses = route?.status?.ingress;
                let res = '';
                if (ingresses && ingresses?.length > 0 && ingresses[0]?.host) {
                  res = `http://${ingresses[0].host}`;
                }
                routeUrl.current = res;
              },
              () => {
                routeUrl.current = '';
              },
            );
        }
      }
      return (
        <a
          class="odc-decorator__link"
          href={`${routeUrl.current}/topology`}
          target="_blank"
          rel="noopener noreferrer"
          role="button"
          aria-label="Open Cryostat"
        >
          <g class="pf-topology__node__decorator odc-decorator">
            <circle class="pf-topology__node__decorator__bg" cx={x} cy={y} r={radius}></circle>
            <g transform={`translate(${x}, ${y})`}>
              <g transform="translate(-6.5, -6.5)">
                <CryostatIcon class="svg-cryostat" width="1em" height="1em"></CryostatIcon>
              </g>
            </g>
          </g>
        </a>
      );
    }
  }
  return <></>;
};

export default DeploymentDecorator;
