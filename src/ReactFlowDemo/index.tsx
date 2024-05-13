import React, { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  NodeChange,
  addEdge,
  applyNodeChanges,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { GanttBarBox } from "../GanttBarBox";

function Flow({ children, initialNodes, celWidth, nodeTypes }) {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => {
      const parsedChanges = changes.map((change) => {
        if (
          change.type === "position" &&
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

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
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
      panActivationKeyCode={null}
    >
      {children}
    </ReactFlow>
  );
}

export default Flow;
