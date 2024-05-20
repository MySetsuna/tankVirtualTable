import { Table } from 'antd';
import { SchemaFilter } from './components/schema-filter';
import {
  IGroupedTableDataItem,
  ITableDataItem,
  ITableProps,
  ITableRowType,
} from './model';
import {
  TITLE_ROW_PREFIX,
  isAllInvalidKey,
  cellAndRenderTitle,
  getDataSource,
  TITLE_EMPTY_ROW_PREFIX,
} from './lib';
import { RowSelectMethod, TableRowSelection } from 'antd/es/table/interface';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import styles from './style.module.scss';
import classNames from 'classnames';
import React from 'react';

export const GroupedTable = forwardRef((props: ITableProps, ref: any) => {
  // 记录模块的展开收起
  const [expandModuleIndex, setExpandModuleIndex] = useState<
    ReadonlyArray<number>
  >([]);
  const {
    dataSource,
    columns,
    filters,
    onFilterChange = () => {},
    size = 'small',
  } = props;

  const isGrouped =
    dataSource?.length &&
    dataSource.every((v) => {
      return ['title', 'dataSource'].every((key) =>
        Object.keys(v).includes(key)
      );
    });

  const rowClassName = (
    record: ITableDataItem,
    index: number,
    indent: number
  ) => {
    const outerClassName = props?.rowClassName || '';
    return classNames(
      typeof outerClassName === 'function'
        ? outerClassName(record, index, indent)
        : outerClassName,
      record?._type || ''
    );
  };

  const onModuleExpandChange = (moduleIndex: number) => {
    const expandIndex = expandModuleIndex.slice();
    const index = expandIndex.findIndex((v) => v === moduleIndex);
    if (index !== -1) {
      expandIndex.splice(index, 1);
    } else {
      expandIndex.push(moduleIndex);
    }
    props.onModuleExpandChange?.(expandIndex);
    setExpandModuleIndex(expandIndex);
  };

  const recordExpandModules = () => {
    if (isGrouped) {
      const indexes: number[] = [];
      for (let i = 0; i < props.dataSource.length; i++) {
        const it = props.dataSource[i];
        if (it?.defaultExpand !== false) {
          indexes.push(i);
        }
      }
      setExpandModuleIndex(indexes);
    }
  };

  useEffect(() => {
    recordExpandModules();
  }, []);

  useImperativeHandle(
    ref,
    () => {
      return {
        setExpandModuleIndex: (idx: number[]) => {
          setExpandModuleIndex(idx);
        },
      };
    },
    [setExpandModuleIndex]
  );

  const rowSelection: TableRowSelection<any> | undefined = useMemo(() => {
    if (!props.rowSelection) return undefined;
    let selectedRowKeys = props.rowSelection?.selectedRowKeys;
    if (selectedRowKeys?.length) {
      if (isGrouped) {
        // 如果都是title的key 就清空
        const needClear = isAllInvalidKey(selectedRowKeys);
        if (needClear) {
          selectedRowKeys = [];
        } else {
          for (let i = 0; i < dataSource.length; i++) {
            selectedRowKeys.push(
              `${TITLE_ROW_PREFIX}${i}`,
              `${TITLE_EMPTY_ROW_PREFIX}${i}`
            );
          }
          selectedRowKeys = Array.from(new Set(selectedRowKeys));
        }
      }
    } else {
      selectedRowKeys = [];
    }

    return Object.assign({}, props.rowSelection, {
      renderCell: (
        checked: boolean,
        record: ITableDataItem,
        index: number,
        originNode: React.ReactNode
      ) => {
        // 只渲染有效数据的选择框
        if ([ITableRowType.Empty, ITableRowType.Title].includes(record._type)) {
          return null;
        }
        return originNode;
      },
      onChange: (
        selectedRowKeys: Array<string | number>,
        selectedRows: Array<ITableDataItem>,
        info: { type: RowSelectMethod }
      ) => {
        const selectedKeys = selectedRowKeys.filter(
          (v) =>
            !`${v}`.startsWith(TITLE_ROW_PREFIX) &&
            !`${v}`.startsWith(TITLE_EMPTY_ROW_PREFIX)
        );
        const selectedRow = selectedRows.filter((v) => !v?._type);
        console.log(selectedRow);
        props.rowSelection?.onChange?.(selectedKeys, selectedRow, info);
      },
      selectedRowKeys,
    });
  }, [props.rowSelection]);

  const renderTable = () => {
    if (isGrouped) {
      const allDataSource = getDataSource(
        dataSource as ReadonlyArray<IGroupedTableDataItem>,
        expandModuleIndex
      );
      const allColumns = cellAndRenderTitle(
        columns || [],
        expandModuleIndex,
        onModuleExpandChange
      );
      return (
        <Table
          {...props}
          columns={allColumns}
          dataSource={allDataSource}
          rowSelection={rowSelection}
          rowClassName={rowClassName}
          size={size}
        />
      );
    }

    return <Table {...props} size={size} />;
  };

  const renderFilters = () => {
    if (!filters || !filters?.length) {
      return null;
    }
    return <SchemaFilter onChange={onFilterChange} filters={filters} />;
  };

  return (
    <div className={styles.myTable}>
      {renderFilters()}
      {renderTable()}
    </div>
  );
});
