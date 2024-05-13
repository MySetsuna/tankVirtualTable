import React, { ReactNode, useEffect, useState } from "react";
import ScrollMirror from "scrollmirror";
import { VirtualTable } from "../VirtualTable";
import { makeData } from "../makeData";
import { TextField } from "@radix-ui/themes";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { BufferMonths, GanttMode, VirtualGantt } from "../VirtualGantt";
import dayjs, { Dayjs } from "dayjs";
import { get, groupBy } from "lodash";
import Xarrow, { useXarrow, Xwrapper } from "react-xarrows";
import Draggable from "react-draggable";
import {
  getBarEnd,
  getBarStart,
  getFrontLinkIds,
  getPostLinkIds,
  getRowId,
} from "./use-lib";
import { Row } from "@tanstack/react-table";
import { GanttBar } from "../use/GanttBar";

type AnyObject = {
  [key: string]: any;
};

type BaseGroupHeaderData = { key: string; value?: AnyObject };

export type GroupOption<T, G extends BaseGroupHeaderData = any> = {
  groupHeaderBuilder?: (data: {
    id: string;
    subRows: Row<T>[];
    leafRows: Row<T>[];
  }) => G;
  groupKey: ((data: T) => string) | keyof T;
  groupId: string;
  fixedX?: boolean;
  groupGanttComponent: (
    data: any,
    groupHeaderBuilder?: (data: {
      id: string;
      subRows: Row<T>[];
      leafRows: Row<T>[];
    }) => G
  ) => ReactNode;
};

export const EMPTY_TAG = "空";
export const SPLIT_TAG = "%-@-%";

type GanttProps<T = AnyObject> = {
  data: T[];
  isGroupView?: boolean;
  groupOptions?: Array<GroupOption<T>>;
  ganttMode: GanttMode;
  selectDate: Dayjs;
};

export const Gantt = (props: GanttProps) => {
  // const [data, setData] = React.useState(mdata);
  const { data, groupOptions, isGroupView, ganttMode, selectDate } = props;
  type TData = (typeof data)[0];
  type GData = ReturnType<
    NonNullable<NonNullable<typeof groupOptions>[0]["groupHeaderBuilder"]>
  >;

  React.useEffect(() => {
    new ScrollMirror(document.querySelectorAll(".gantt-container"), {
      horizontal: false,
      proportional: false,
    });
  }, []);

  return (
    <div>
      <div style={{ display: "flex" }}>
        <VirtualTable
          rowHeight={40}
          width={600}
          isGroupView={isGroupView}
          groupOptions={groupOptions}
          columns={[
            {
              accessorKey: "id",

              header: "ID",
              size: 160,
            },
            {
              accessorKey: "firstName",
              cell: (info) => info.getValue(),
              size: 160,
            },
            {
              accessorFn: (row) => row.lastName,
              id: "lastName",
              cell: (info) => info.getValue(),
              header: () => <span>Last Name</span>,
              size: 160,
            },
            {
              accessorKey: "age",
              size: 150,
              header: () => "Age",
              aggregatedCell: ({ getValue }) =>
                Math.round(getValue<number>() * 100) / 100,
              aggregationFn: "median",
            },
            {
              accessorKey: "visits",
              header: () => <span>Visits</span>,
              size: 150,
            },
            {
              accessorKey: "status",
              header: "Status",
              size: 100,
            },
            {
              accessorKey: "progress",
              header: "Profile Progress",
              size: 180,
            },

            {
              accessorKey: "createdAt",
              header: "Created At",
              cell: (info) => info.getValue<Date>().toLocaleString(),
              size: 200,
            },
            {
              accessorKey: "progress1",
              header: "Profile Progress",
              size: 180,
            },
          ]}
          cellRender={({ content, width, isActive: isEditing }) => {
            if (isEditing) {
              return (
                <TextField.Root
                  placeholder="Search the docs…"
                  defaultValue={content}
                  style={{
                    display: "flex",
                    width: `${width}px`,
                  }}
                >
                  <TextField.Slot>
                    <MagnifyingGlassIcon height="16" width="16" />
                  </TextField.Slot>
                </TextField.Root>
              );
            }
            return content;
          }}
          data={data}
        />
        <VirtualGantt
          GanttBar={GanttBar}
          rowHeight={40}
          getFrontLinkIds={getFrontLinkIds}
          getPostLinkIds={getPostLinkIds}
          getRowId={getRowId}
          getBarEnd={getBarEnd}
          getBarStart={getBarStart}
          mode={ganttMode}
          currentAt={selectDate}
          bufferMonths={[2]}
          bufferDay={40}
          data={data}
          width={1200}
          groupOptions={groupOptions}
          isGroupView={isGroupView}
          style={{
            position: "relative",
          }}
        />
      </div>
    </div>
  );
};
