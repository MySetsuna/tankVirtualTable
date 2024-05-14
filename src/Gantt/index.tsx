import React, { CSSProperties, FC } from "react";
import ScrollMirror from "scrollmirror";
import { VirtualTable } from "./components/VirtualTable";
import { TextField } from "@radix-ui/themes";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { GanttMode, VirtualGantt } from "./components/VirtualGantt";
import { Dayjs } from "dayjs";
import { Row } from "@tanstack/react-table";
import { GanttBar } from "../use/GanttBar";
import { Node, NodeProps, ReactFlowProvider } from "reactflow";
import styles from "./index.module.scss";

type AnyObject = {
  [key: string]: any;
};

type BaseGroupHeaderData = { key: string; value?: AnyObject };

export interface GanttBarData<T = any> {
  row: Row<T>;
  fixedY: number;
  fixedX?: number;
  height: number;
  width: number;
  minWidth: number;
  cellWidth: number;
  index: number;
}

export interface GroupGanttBarData<T, D> extends GanttBarData<T> {
  group: D;
}

export type GanttNode<T, D = any> = Node<
  GanttBarData<T> | GroupGanttBarData<T, D>
>;

export type CmpWithChildrenFn<T> = T & { children?: FC<T> };

export type GanttBarBoxProps<T = any> = CmpWithChildrenFn<GanttBarProps<T>>;

export type GanttBarProps<T> = NodeProps<GanttBarData<T>> & {
  setNodes: React.Dispatch<React.SetStateAction<GanttNode<T>[]>>;
};

export type GroupGanttBarProps<T, D> = NodeProps<GroupGanttBarData<T, D>> & {
  setNodes: React.Dispatch<React.SetStateAction<GanttNode<T, D>[]>>;
};

export type GroupOption<T, D extends BaseGroupHeaderData = any> = {
  groupHeaderBuilder?: (row: Row<T>) => D;
  groupKey: ((data: T) => string) | keyof T;
  groupId: string;
  isFixedX?: boolean;
  groupGanttComponent: FC<GroupGanttBarProps<T, D>>;
};

type GanttProps<T = AnyObject> = {
  data: T[];
  isGroupView?: boolean;
  groupOptions?: Array<GroupOption<T>>;
  ganttMode: GanttMode;
  selectDate: Dayjs;
  height?: CSSProperties["height"];
  getBarStart: (row: T) => Dayjs | undefined;
  getBarEnd: (row: T) => Dayjs | undefined;
  getFrontLinkIds: (row: T) => string[];
  getPostLinkIds: (row: T) => string[];
  getRowId: (row: T) => string;
};

export const Gantt = (props: GanttProps<AnyObject>) => {
  const {
    height = 800,
    data,
    groupOptions,
    isGroupView,
    ganttMode,
    selectDate,
    getBarEnd,
    getBarStart,
    getFrontLinkIds,
    getPostLinkIds,
    getRowId,
  } = props;

  React.useEffect(() => {
    new ScrollMirror(document.querySelectorAll(".gantt-container"), {
      horizontal: false,
      proportional: false,
    });
  }, []);

  return (
    <div className={styles.VirtualGantt}>
      <div style={{ display: "flex" }}>
        <VirtualTable
          style={{
            overflowX: "auto",
            overflowY: "hidden",
            height,
            width: 500,
            flexShrink: 0,
          }}
          rowHeight={40}
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
        <ReactFlowProvider>
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
            bufferMonths={[2, 2]}
            bufferDay={40}
            data={data}
            groupOptions={groupOptions}
            isGroupView={isGroupView}
            style={{
              position: "relative",
              overflow: "auto",
              width: 1200,
              height,
              flex: "auto",
            }}
          />
        </ReactFlowProvider>
      </div>
    </div>
  );
};
