import React from "react";
import {
  Handle,
  NodeResizer,
  Position,
  ResizeDragEvent,
  ResizeParams,
} from "reactflow";

export const GanttBarBox = ({ data, children }) => {
  const { height, minWidth, index } = data;
  const row = data.original;
  const onResizeEnd = (event: ResizeDragEvent, params: ResizeParams) => {
    console.log(params);
  };
  console.log(row, "row", children, "children");
  const GanttBar = children;

  return (
    <>
      <NodeResizer
        minWidth={minWidth}
        minHeight={height}
        maxHeight={height}
        lineStyle={{
          backgroundColor: "red",
          width: 9,
        }}
        onResizeEnd={onResizeEnd}
      />
      <Handle type="target" position={Position.Left} />
      {GanttBar ? (
        <GanttBar data={data} />
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
