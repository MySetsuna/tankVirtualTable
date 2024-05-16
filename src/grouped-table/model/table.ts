import { TableProps } from 'antd';
import { ITableFilter } from './filter';
import React from 'react';

export interface ITableProps extends TableProps {
  // 两种形式的数据结构，支持分组
  readonly dataSource:
    | ReadonlyArray<ITableDataItem>
    | ReadonlyArray<IGroupedTableDataItem>;
  // 筛选条件相关
  readonly filters?: ReadonlyArray<ITableFilter>;
  readonly onFilterChange?: (values: ITableDataItem) => void;
  readonly onModuleExpandChange?: (idx: number[]) => void;
}

export interface ITableDataItem {
  readonly [key: string]: any;
}

export interface IGroupedTableDataItem {
  readonly title:
    | string
    | ((
        text: string,
        row: ITableDataItem,
        index: number
      ) => React.ReactNode | string);
  readonly dataSource: ReadonlyArray<ITableDataItem>;
  readonly enableExpand?: boolean; // 标题是否支持展开
  readonly defaultExpand?: boolean; // 默认全部展开，只有为false时才会被应用
  // readonly emptyRow?: () => React.ReactNode | string; // title行的前置渲染
}

export enum ITableRowType {
  Empty = 'tr-empty',
  Title = 'tr-title',
}
