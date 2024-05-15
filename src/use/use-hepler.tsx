import React, { Key } from "react";
import { Row } from "@tanstack/react-table";
import { GroupOption } from "../Gantt";
import { getStartAndEnd } from "../Gantt/components/VirtualGantt/utils";
import dayjs, { Dayjs } from "dayjs";
import { Task } from "../makeData";
import { GroupKeyer } from "../typing/gantt";

export const getGroupOptions = (
  grouping: GroupKeyer<Task>[],
  getStart: (t: Task) => Dayjs | undefined,
  getEnd: (t: Task) => Dayjs | undefined
): GroupOption<Task>[] => [
  {
    groupId: "group__storyId",
    groupKey(task) {
      return task.storyId;
    },
    groupHeaderBuilder(row: Row<Task>) {
      const { startAt, endAt } = getStartAndEnd(
        row.getLeafRows(),
        getStart,
        getEnd
      );
      return { data: row, startAt, endAt };
    },
    groupGanttComponent: ({ data }) => {
      const { row, group } = data;

      return (
        <div
          onClick={() => {
            row.toggleExpanded();
            console.log(group, "group");
          }}
          style={{ background: "lightskyblue", width: "100%", height: "100%" }}
        >
          <span>{row.getIsExpanded() ? "👇" : "👉"}</span>
          <span>{row.groupingValue as string}</span>
        </div>
      );
    },
    isFixedX: true,
  },
  ...grouping.map(({ key: groupKey, groupId }) => {
    return {
      groupId,
      groupKey,
      groupHeaderBuilder(row: Row<Task>) {
        const { startAt, endAt } = getStartAndEnd(
          row.getLeafRows(),
          getStart,
          getEnd
        );
        return { data: row, startAt, endAt };
      },
      groupGanttComponent: () => <>88888</>,
      isFixedX: true,
    };
  }),
];
