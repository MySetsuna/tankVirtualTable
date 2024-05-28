import React, { FC, Key, MemoExoticComponent, memo, useMemo } from 'react';
import { VirtualGantt, VirtualGanttProps } from './components/virtual-gantt';
import { Dayjs } from 'dayjs';
import { Row } from '@tanstack/react-table';
import { Node, NodeProps, ReactFlowProvider } from 'reactflow';
import styles from './index.module.scss';

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
  hidden: boolean;
  emptyRange: boolean;
  startAt?: Dayjs;
  endAt?: Dayjs;
  creating?: boolean;
}

export interface GroupGanttBarData<T, D> extends GanttBarData<T> {
  group: D;
}

export type GanttNode<T, D = any> = Node<
  GanttBarData<T> | GroupGanttBarData<T, D>
>;

export type CmpWithChildrenFn<T> = T & {
  children?:
    | ((props: T) => JSX.Element)
    | MemoExoticComponent<(props: T) => JSX.Element>;
};

export type GanttBarBoxProps<T = any> = CmpWithChildrenFn<GanttBarProps<T>>;

export type GanttBarProps<T> = NodeProps<GanttBarData<T>> & {
  setNodes: React.Dispatch<React.SetStateAction<GanttNode<T>[]>>;
  onNodesChange?: (changes: any) => void;
  onBarChange?: (startAt: Dayjs, endAt: Dayjs, node: GanttNode<T>) => void;
  originStart?: Dayjs;
  onLeftConnect?: (from: GanttNode<T>, to: GanttNode<T>) => void;
  onRightConnect?: (from: GanttNode<T>, to: GanttNode<T>) => void;
  getBarStart: (row: T) => Dayjs | undefined;
  getBarEnd: (row: T) => Dayjs | undefined;
  rows: Row<T>[];
  groupOptions: GroupOption<any>[] | undefined;
  rowsById: Record<string, Row<T>>;
};

export type GroupGanttBarProps<T, D> = NodeProps<GroupGanttBarData<T, D>> & {
  setNodes: React.Dispatch<React.SetStateAction<GanttNode<T, D>[]>>;
  onNodesChange: (changes: any) => void;
  onBarChange?: (startAt: any, endAt: any, node: GanttNode<T>) => void;
  originStart?: Dayjs;
  rowsById: Record<string, Row<T>>;
};

export type GroupOption<T, D = BaseGroupHeaderData> = {
  groupHeaderBuilder?: (row: Row<T>) => BaseGroupHeaderData;
  groupKey: ((data: T) => Key) | keyof T;
  groupId: string;
  isFixedX?: boolean;
  groupGanttComponent: FC<GroupGanttBarProps<T, D>>;
};

export const Gantt = memo(
  (
    props: VirtualGanttProps & { tableBodyHeight: number; ganttHeight: number }
  ) => {
    const { table, tableBodyHeight, ganttHeight, ...rest } = props;
    return (
      <div className={styles.VirtualGantt}>
        <ReactFlowProvider>
          <VirtualGantt
            {...rest}
            table={useMemo(
              () => table,
              [props.data, tableBodyHeight, ganttHeight]
            )}
          />
        </ReactFlowProvider>
      </div>
    );
  }
);
