import React, { FC } from "react";
import { NodeProps } from "reactflow";
import { GanttBarData } from "../../Gantt";
import { Task } from "../../makeData";
import dayjs from "dayjs";

export const GanttBar: FC<NodeProps<GanttBarData<Task>>> = ({ data, id }) => {
  const { height, index, row, fixedX, fixedY } = data;

  return (
    <div
      style={{
        backgroundColor: `rgba(${row.id + 20}, ${30 + index * 4}, ${
          index + row.id + 100
        }, 1)`,
        height,
        overflow: "hidden",
      }}
      className="gantt-bar"
      id={id}
    >
      {dayjs(row.original.startAt).format("YYYY-MM-DD")}-------------------
      {dayjs(row.original.endAt).format("YYYY-MM-DD")}
    </div>
  );
};
