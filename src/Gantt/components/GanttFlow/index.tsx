/* eslint-disable no-param-reassign */
import React, { ReactNode, useCallback } from 'react';
import ReactFlow, {
  MarkerType,
  NodeChange,
  NodeTypes,
  addEdge,
  applyNodeChanges,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { AnyObject } from '../VirtualGantt';
import { GanttNode } from '../..';
import { isNumber } from 'lodash';

type GanttFlowProps = {
  children: ReactNode;
  nodes?: GanttNode<AnyObject>[];
  cellWidth: number;
  nodeTypes: NodeTypes;
  setNodes: React.Dispatch<React.SetStateAction<GanttNode<AnyObject>[]>>;
};

function GanttFlow(props: GanttFlowProps) {
  const { children, nodes, cellWidth, nodeTypes, setNodes } = props;
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback(
    (connection: any) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => {
      const parsedChanges = changes.map((change) => {
        if (
          change.type === 'position' &&
          change.position &&
          change.positionAbsolute
        ) {
          const fixedY = nds.find((node) => change.id === node.id)?.data.fixedY;

          const fixedX = nds.find((node) => change.id === node.id)?.data.fixedX;

          if (fixedY || fixedX) {
            change.position = {
              x: fixedX ?? change.position.x,
              y: fixedY ?? change.position.y,
            };
            change.positionAbsolute = {
              x: fixedX ?? change.positionAbsolute.x,
              y: fixedY ?? change.positionAbsolute.x,
            };
          }
        }
        return change;
      });

      return applyNodeChanges(parsedChanges, nds);
    });
  }, []);

  const onNodesDragStop = useCallback(
    (
      _event,
      changeNode: GanttNode<AnyObject>
      // nodes: GanttNode<AnyObject>[]
    ) => {
      if (isNumber(changeNode.data.fixedX)) return;
      setNodes((nodes) => {
        return nodes.map((node) => {
          if (node.id === changeNode.id) {
            return {
              ...changeNode,
              position: {
                x: changeNode.position.x - (changeNode.position.x % cellWidth),
                y: node.position.y,
              },
            };
          }
          return node;
        });
      });
    },
    []
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      defaultEdgeOptions={{
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        style: {
          stroke: 'black',
        },
        // type:"step"
        // type:'simplebezier'
      }}
      onNodesChange={onNodesChange}
      onNodeDragStop={onNodesDragStop}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      panOnDrag={false}
      panOnScroll={false}
      zoomOnScroll={false}
      zoomOnPinch={false}
      zoomOnDoubleClick={false}
      preventScrolling={false}
      zoomActivationKeyCode={null}
      nodeTypes={nodeTypes}
      autoPanOnNodeDrag={false}
      autoPanOnConnect={false}
      panActivationKeyCode={null}
      style={{ backgroundColor: 'red' }}
    >
      {children}
    </ReactFlow>
  );
}

export default GanttFlow;
