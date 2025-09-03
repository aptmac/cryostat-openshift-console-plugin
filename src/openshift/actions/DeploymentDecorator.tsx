import { Node } from '@patternfly/react-topology';
import * as React from 'react';
import CryostatIcon from './CryostatIcon';

type DeploymentDecoratorProps = {
  element: Node;
  radius: number;
  x: number;
  y: number;
}

export const DeploymentDecorator: React.FC<DeploymentDecoratorProps> = ({
  element,
  radius,
  x,
  y,
}) => {
  return (
      <a class="odc-decorator__link" href="https://localhost:9000/cryostat" target="_blank" rel="noopener noreferrer" role="button" aria-label="Open Cryostat">
        <g class="pf-topology__node__decorator odc-decorator">
          <circle class="pf-topology__node__decorator__bg" cx={x} cy={y} r={radius}></circle>
          <g transform={`translate(${x}, ${y})`}>
            <g transform="translate(-6.5, -6.5)">
              <CryostatIcon class="pf-v6-svg" role="img" width="1em" height="1em"></CryostatIcon>
            </g>
          </g>
        </g>
      </a>
  );
};

export default DeploymentDecorator;