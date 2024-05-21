/* eslint-disable no-param-reassign */
import React, { ReactNode, useCallback, useMemo } from 'react';
import ReactFlow, {
  Connection,
  Edge,
  EdgeProps,
  MarkerType,
  Node,
  NodeChange,
  NodeTypes,
  OnEdgesChange,
  addEdge,
  applyNodeChanges,
  getOutgoers,
  useReactFlow,
  // applyEdgeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { AnyObject } from '../VirtualGantt';
import { GanttNode } from '../..';
import { debounce, isNumber, throttle } from 'lodash';
import { getDateFormX, onFitPosWhenResizeEnd } from '../../utils';
import { Dayjs } from 'dayjs';
import DeletableEdges from './DeletableEdges';

type GanttFlowProps<T = any> = {
  children: ReactNode;
  nodes?: GanttNode<T>[];
  edges: Edge<any>[];
  cellWidth: number;
  nodeTypes: NodeTypes;
  setNodes: React.Dispatch<React.SetStateAction<GanttNode<T>[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge<any>[]>>;
  originStartDate?: Dayjs;
  onEdgesChange: OnEdgesChange;
  onBarChange?: (startAt: Dayjs, endAt: Dayjs, original: T) => void;
  onDisConnect?: (from: string, to: string) => void;
  onConnect?: (connection: Connection) => boolean | Promise<boolean>;
  renderEdgeDeleteTitle?: (props: {
    form: GanttNode<any>;
    to: GanttNode<any>;
  }) => ReactNode;
};

function GanttFlow(props: GanttFlowProps) {
  const {
    children,
    nodes,
    edges,
    cellWidth,
    nodeTypes,
    setNodes,
    setEdges,
    originStartDate,
    onBarChange,
    onEdgesChange,
    onConnect,
    onDisConnect,
    renderEdgeDeleteTitle,
  } = props;

  // const updateNodeInternals = useUpdateNodeInternals();

  const { getNodes, getEdges } = useReactFlow();

  const isValidConnection = useCallback(
    (connection: Connection) => {
      // we are using getNodes and getEdges helpers here
      // to make sure we create isValidConnection function only once
      const nodes = getNodes();
      const edges = getEdges();
      const target = nodes.find((node) => node.id === connection.target);
      const hasCycle = (node: Node<any>, visited = new Set()) => {
        if (visited.has(node.id)) return false;

        visited.add(node.id);

        for (const outgoer of getOutgoers(node, nodes, edges)) {
          if (outgoer.id === connection.source) return true;
          if (hasCycle(outgoer, visited)) return true;
        }
      };

      if (target?.id === connection.source) return false;
      return !hasCycle(target!);
    },
    [getNodes, getEdges]
  );

  const edgeTypes = useMemo(() => {
    return {
      'deletable-smoothstep': (props: EdgeProps) => (
        <DeletableEdges
          {...props}
          onDisConnect={onDisConnect}
          renderTitle={renderEdgeDeleteTitle}
        />
      ),
    };
  }, [onDisConnect]);

  const onConnectFn = useCallback(
    (connection: Connection) => {
      const isConnectable = onConnect?.(connection);

      if (isConnectable === true) {
        setEdges((eds) => addEdge(connection, eds));
        return;
      }
      if (isConnectable) {
        setEdges((eds) => addEdge(connection, eds));
        isConnectable.then((result) => {
          if (!result) {
            setEdges((eds) =>
              eds.filter(
                (edge) =>
                  edge.target !== connection.target &&
                  edge.source !== connection.source
              )
            );
          }
        });
      }
    },
    [setEdges, onConnect]
  );

  const onNodesChange = useCallback(
    throttle((changes: NodeChange[]) => {
      setNodes((nds) => {
        const newNds: GanttNode<any>[] = [...nds];
        const parsedChanges = changes.map((change) => {
          if (change.type === 'dimensions') {
            const changeNode = newNds.find((node) => change.id === node.id);
            if (changeNode) {
              if (change.resizing === false && !changeNode.hidden) {
                onFitPosWhenResizeEnd(
                  cellWidth,
                  changeNode,
                  originStartDate,
                  onBarChange
                );
              }
              // updateNodeInternals(changeNode.id);
            }
          }

          if (
            change.type === 'position' &&
            change.position &&
            change.positionAbsolute
          ) {
            const changeNode = nds.find((node) => change.id === node.id);
            const fixedY = changeNode?.data.fixedY;

            const fixedX = changeNode?.data.fixedX;

            if (isNumber(fixedY) || isNumber(fixedX)) {
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
        return applyNodeChanges(parsedChanges, newNds);
      });
    }, 5),
    [originStartDate, onBarChange]
  );

  const onNodesDragStop = useCallback(
    debounce(
      (
        _event: any,
        changeNode: GanttNode<AnyObject>
        // nodes: GanttNode<AnyObject>[]
      ) => {
        if (isNumber(changeNode.data.fixedX)) return;
        const oldNode = nodes?.find(({ id }) => changeNode.id === id);
        const newChangeNode = {
          ...changeNode,
          position: {
            x: changeNode.position.x - (changeNode.position.x % cellWidth),
            y: oldNode?.position.y ?? changeNode.position.y,
          },
        };
        if (originStartDate) {
          const offsetLeft =
            changeNode.position.x - (changeNode.position.x % cellWidth);
          const offsetRight =
            offsetLeft +
            (changeNode?.width ? changeNode?.width - cellWidth : -0);
          const startAt = getDateFormX(offsetLeft, cellWidth, originStartDate);
          const endAt = getDateFormX(offsetRight, cellWidth, originStartDate);
          onBarChange?.(startAt, endAt, newChangeNode.data.row.original);
        }

        setNodes((nodes) => {
          const parsedChanges = nodes.map((node) => {
            if (node.id === changeNode.id) {
              return newChangeNode;
            }
            return node;
          });
          return parsedChanges;
        });
      },
      100
    ),
    [originStartDate, nodes]
  );

  const onEdgeMouseLeave = (_event: any, edge: any) => {
    const edgeId = edge.id;

    // Updates edge
    setEdges((prevElements) =>
      prevElements.map((element) =>
        element.id === edgeId
          ? {
              ...element,

              data: {
                ...element.data,

                isHovered: false,
              },
            }
          : element
      )
    );
  };

  const onEdgeMouseEnter = (_event: any, edge: any) => {
    const edgeId = edge.id;

    // Updates edge
    setEdges((prevElements) =>
      prevElements.map((element) =>
        element.id === edgeId
          ? {
              ...element,

              data: {
                ...element.data,

                isHovered: true,
              },
            }
          : element
      )
    );
  };

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      defaultEdgeOptions={{
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'black',
        },
        style: {
          stroke: 'black',
        },
        type: 'deletable-smoothstep',
      }}
      onNodesChange={onNodesChange}
      onNodeDragStop={onNodesDragStop}
      onEdgesChange={onEdgesChange}
      onConnect={onConnectFn}
      panOnDrag={false}
      panOnScroll={false}
      zoomOnScroll={false}
      zoomOnPinch={false}
      zoomOnDoubleClick={false}
      preventScrolling={false}
      zoomActivationKeyCode={null}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onEdgeMouseEnter={onEdgeMouseEnter}
      onEdgeMouseLeave={onEdgeMouseLeave}
      autoPanOnNodeDrag={false}
      autoPanOnConnect={false}
      panActivationKeyCode={null}
      isValidConnection={isValidConnection}
    >
      {children}
    </ReactFlow>
  );
}

export default GanttFlow;
