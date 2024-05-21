import React, { FC, Key, memo } from 'react';
import { VirtualGantt, VirtualGanttProps } from './components/VirtualGantt';
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
  onBarChange?: (startAt: Dayjs, endAt: Dayjs, node: GanttNode<T>) => void;
  originStart?: Dayjs;
  onLeftConnect?: (from: GanttNode<T>, to: GanttNode<T>) => void;
  onRightConnect?: (from: GanttNode<T>, to: GanttNode<T>) => void;
  getBarStart: (row: T) => Dayjs | undefined;
  getBarEnd: (row: T) => Dayjs | undefined;
  rows: Row<T>[];
};

export type GroupGanttBarProps<T, D> = NodeProps<GroupGanttBarData<T, D>> & {
  setNodes: React.Dispatch<React.SetStateAction<GanttNode<T, D>[]>>;
  onNodesChange: (changes: any) => void;
  onBarChange?: (startAt: any, endAt: any, node: any) => void;
  originStart?: Dayjs;
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

export const Gantt = memo((props: VirtualGanttProps) => {
  return (
    <div className={styles.VirtualGantt}>
      <ReactFlowProvider>
        <VirtualGantt {...props} />
      </ReactFlowProvider>
    </div>
  );
});
