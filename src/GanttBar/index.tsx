import React from "react";
import {
  Handle,
  NodeResizer,
  Position,
  ResizeDragEvent,
  ResizeParams,
} from "reactflow";

export const GanttBar = ({ data }) => {
  const { maxHeight, minWidth, minHeight } = data;
  const onResizeEnd = (event: ResizeDragEvent, params: ResizeParams) => {
    console.log(params);
  };
  return (
    <>
      <NodeResizer
        minWidth={minWidth}
        minHeight={minHeight}
        maxHeight={maxHeight}
        keepAspectRatio={false}
        onResizeEnd={onResizeEnd}
      />
      <Handle type="target" position={Position.Left} />
      <div style={{ padding: 10 }}>{data.original.id}</div>
      <Handle type="source" position={Position.Right} />
    </>
  );
};
