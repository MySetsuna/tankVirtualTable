import React from "react";
import {
  Handle,
  NodeResizer,
  Position,
  ResizeDragEvent,
  ResizeParams,
} from "reactflow";

export const GanttBarBox = ({ data }) => {
  const { height, minWidth, index } = data;
  const row = data.original;
  const onResizeEnd = (event: ResizeDragEvent, params: ResizeParams) => {
    console.log(params);
  };
  return (
    <>
      <NodeResizer
        minWidth={minWidth}
        minHeight={height}
        maxHeight={height}
        handleStyle={{
          color: "red",
        }}
        onResizeEnd={onResizeEnd}
      />
      <Handle type="target" position={Position.Left} />
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
        {row.name}
      </div>
      <Handle type="source" position={Position.Right} />
    </>
  );
};
