import React, { CSSProperties, FC, Key, ReactElement, ReactNode } from "react";
import ScrollMirror from "scrollmirror";
import {
  BufferMonths,
  GanttMode,
  VirtualGantt,
} from "./components/VirtualGantt";
import { Dayjs } from "dayjs";
import { Row } from "@tanstack/react-table";
import { Node, NodeProps, ReactFlowProvider } from "reactflow";
import styles from "./index.module.scss";

export type BaseGroupHeaderData<G = any> = {
  id: Key;
  data: G;
  startAt?: Dayjs;
  endAt?: Dayjs;
};

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
  onNodesChange?: (changes: any) => void;
  onBarChange?: (startAt: any, endAt: any, node: any) => void;
  startDate?: Dayjs;
};

export type GroupGanttBarProps<T, D> = NodeProps<GroupGanttBarData<T, D>> & {
  setNodes: React.Dispatch<React.SetStateAction<GanttNode<T, D>[]>>;
  onNodesChange: (changes: any) => void;
  onBarChange?: (startAt: any, endAt: any, node: any) => void;
  startDate?: Dayjs;
  // setExpandKeys: React.Dispatch<React.SetStateAction<readonly React.Key[]>>;
  // expandKeys: readonly React.Key[];
};

export type GroupOption<T, D = BaseGroupHeaderData> = {
  groupHeaderBuilder?: (row: Row<T>) => BaseGroupHeaderData;
  groupKey: ((data: T) => Key) | keyof T;
  groupId: string;
  isFixedX?: boolean;
  groupGanttComponent: FC<GroupGanttBarProps<T, D>>;
};

type GanttProps<T extends object = any> = {
  data: T[];
  rowHeight?: number;
  isGroupView?: boolean;
  groupOptions?: Array<GroupOption<T>>;
  ganttMode: GanttMode;
  selectDate: Dayjs;
  getBarStart: (row: T) => Dayjs | undefined;
  getBarEnd: (row: T) => Dayjs | undefined;
  getFrontLinkIds: (row: T) => Key[];
  getPostLinkIds: (row: T) => Key[];
  getRowId: (row: Row<T>) => string;
  groupGap?: number;
  GanttBar: (props: GanttBarProps<T>) => ReactNode;
  table: ReactElement;
  headerHeight?: [number] | [number, number] | [number, number, number];
  style?: CSSProperties;
  bufferMonths?: BufferMonths;
  bufferDay?: number;
  scrollSyncClassName: string;
  onBarChange?: (startAt, endAt, node) => void;
};

export const Gantt = (props: GanttProps) => {
  const {
    groupGap = 10,
    style = {
      position: "relative",
      overflow: "auto",
      width: 1200,
      height: 800,
      flex: "auto",
    },
    bufferDay = 40,
    bufferMonths = [2, 2],
    rowHeight,
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
    GanttBar,
    table,
    headerHeight,
    scrollSyncClassName,
    onBarChange,
  } = props;

  React.useEffect(() => {
    new ScrollMirror(document.querySelectorAll(`.${scrollSyncClassName}`), {
      horizontal: false,
      // proportional: false,
    });
  }, []);

  return (
    <div className={styles.VirtualGantt}>
      <ReactFlowProvider>
        <VirtualGantt
          GanttBar={GanttBar}
          groupGap={groupGap}
          rowHeight={rowHeight}
          headerHeight={headerHeight}
          getFrontLinkIds={getFrontLinkIds}
          getPostLinkIds={getPostLinkIds}
          getRowId={getRowId}
          getBarEnd={getBarEnd}
          getBarStart={getBarStart}
          mode={ganttMode}
          currentAt={selectDate}
          bufferMonths={bufferMonths}
          bufferDay={bufferDay}
          data={data}
          groupOptions={groupOptions}
          isGroupView={isGroupView}
          style={style}
          scrollSyncClassName={scrollSyncClassName}
          onBarChange={onBarChange}
          table={table}
        />
      </ReactFlowProvider>
    </div>
  );
};
