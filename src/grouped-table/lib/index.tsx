import { ColumnsType } from 'antd/es/table';
import { IGroupedTableDataItem, ITableDataItem, ITableRowType } from '../model';
import { Key } from 'antd/lib/table/interface';
import { CaretRightOutlined, CaretDownOutlined } from '@ant-design/icons';
import styles from '../style.module.scss';

export const TITLE_ROW_PREFIX = '_title-';
export const TITLE_EMPTY_ROW_PREFIX = '_empty_';

export const getChildLen = (dataItem: ITableDataItem) => {
  let len = 0;
  const loop = (it: ITableDataItem) => {
    if (Array.isArray(it.children)) {
      len += it.children.length;
      for (const child of it.children) {
        loop(child);
      }
    }
  };

  loop(dataItem);
  return len;
};

// 插入空行和标题行
export const getDataSource = (
  dataSource: ReadonlyArray<IGroupedTableDataItem>,
  expandModuleIndex: ReadonlyArray<number>
) => {
  const allDataSource = dataSource.map((v, index) => {
    const { title, enableExpand, dataSource } = v;
    const titleExpand = expandModuleIndex.includes(index);
    const allRows = [
      // 分组标题
      {
        key: `${TITLE_ROW_PREFIX}${index}`,
        _type: ITableRowType.Title,
        _title: title,
        _moduleIndex: index,
        _enableExpand: enableExpand,
      },
      // 分组数据
      ...(titleExpand ? dataSource : []),
    ];
    // 渲染空行
    allRows.unshift({
      key: `${TITLE_EMPTY_ROW_PREFIX}${index}`,
      _type: ITableRowType.Empty,
      _title: null,
    });
    return allRows;
  });
  return allDataSource.flat();
};

// 分组标题的colSpan计算，渲染标题
export const cellAndRenderTitle = (
  columns: ColumnsType<any>,
  expandModuleIndex: ReadonlyArray<number>,
  onModuleExpandChange: (index: number) => void
) => {
  const curColumns = columns.slice();
  for (let i = 0; i < curColumns.length; i++) {
    const { render } = curColumns[i];
    // 如果有左侧固定列，colSpan为固定的length
    const leftFixedColumnsLen = columns.filter(
      (v) => v?.fixed === 'left'
    ).length;
    const colSpan = i === 0 ? leftFixedColumnsLen || curColumns.length : 0;
    // 重写属性
    Object.assign(curColumns[i], {
      onCell: (row: ITableDataItem) => {
        return {
          colSpan: row?._type === ITableRowType.Title ? colSpan : 1,
        };
      },
      render: (text: string, row: ITableDataItem, index: number) => {
        if (row?._type === ITableRowType.Title) {
          const {
            _title: title,
            _enableExpand: enableExpand,
            _moduleIndex: moduleIndex,
          } = row;
          const expand = expandModuleIndex.includes(moduleIndex);
          const titleNode =
            typeof title === 'function' ? title(text, row, index) : title;
          return (
            <div className={styles.tableTitleNode}>
              {enableExpand
                ? renderExpandIcon(expand, () =>
                    onModuleExpandChange(moduleIndex)
                  )
                : null}{' '}
              {titleNode}
            </div>
          );
        }

        if (row?._type === ITableRowType.Empty) {
          const { _title: title } = row;
          return typeof title === 'function' ? title(text, row, index) : title;
        }

        return typeof render === 'function' ? render(text, row, index) : text;
      },
    });
  }

  return curColumns;
};

// 是否都是无效数据行的key
export const isAllInvalidKey = (selectedRowKeys: Array<Key>) => {
  return selectedRowKeys.every(
    (v) =>
      `${v}`.startsWith(TITLE_ROW_PREFIX) ||
      `${v}`.startsWith(TITLE_EMPTY_ROW_PREFIX)
  );
};

const renderExpandIcon = (
  isExpand: boolean,
  onModuleExpandChange: () => void
) => {
  const classNames = 'pointer';
  return isExpand ? (
    <CaretDownOutlined onClick={onModuleExpandChange} className={classNames} />
  ) : (
    <CaretRightOutlined onClick={onModuleExpandChange} className={classNames} />
  );
};
