import React from "react";
import {
  Handle,
  NodeResizer,
  Position,
  ResizeDragEvent,
  ResizeParams,
} from "reactflow";
import { GanttBarBoxProps } from "../..";
import { getDateFormX } from "../VirtualGantt/utils";

export const GanttBarBox = (props: GanttBarBoxProps) => {
  const { children, onBarChange, startDate, ...rest } = props;
  const { data, setNodes } = rest;
  const { height, minWidth, index } = rest.data;
  const { row } = rest.data;
  const onResizeEnd = (_event: ResizeDragEvent, params: ResizeParams) => {
    setNodes((nodes) => {
      return nodes.map((node) => {
        if (node.data.row.id === row.id) {
          const { cellWidth } = data;
          const { width, x } = params;
          // 如果拖拽右边 x 不变

          const diff = Math.ceil(width / cellWidth);
          const newX = x - (x % cellWidth);
          const newWidth = diff * cellWidth;
          const changeNode = {
            ...node,
            style: {
              ...node.style,
              width: newWidth,
            },
            position: {
              x: newX,
              y: node.position.y,
            },
          };
          if (startDate) {
            const offsetLeft = newX;
            const offsetRight =
              offsetLeft + (newWidth ? newWidth - cellWidth : 0);
            const startAt = getDateFormX(offsetLeft, cellWidth, startDate);
            const endAt = getDateFormX(offsetRight, cellWidth, startDate);
            onBarChange?.(startAt, endAt, changeNode);
          }
          return changeNode;
        }
        return node;
      });
    });
  };
  const GanttBar = children;

  return (
    <>
      <NodeResizer
        minWidth={minWidth}
        minHeight={height}
        maxHeight={height}
        lineStyle={{
          backgroundColor: "#00000000",
          width: 6,
        }}
        onResizeEnd={onResizeEnd}
      />
      <Handle type="target" position={Position.Left} />
      {GanttBar ? (
        <GanttBar {...rest} />
      ) : (
        <div
          style={{
            backgroundColor: `rgba(${row.id + 20}, ${30 + index * 4}, ${
              index + row.id + 100
            }, 1)`,
            height,
            overflow: "hidden",
          }}
          className="gantt-bar77"
        >
          {row.id}
        </div>
      )}
      <Handle type="source" position={Position.Right} />
    </>
  );
};
