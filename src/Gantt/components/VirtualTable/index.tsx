import {
  ColumnDef,
  Row,
  SortingState,
  flexRender,
  getCoreRowModel,
  getGroupedRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import React, { CSSProperties, ReactNode, useEffect, useMemo } from "react";
import { GroupOption } from "../..";

type AnyObject = {
  [key: string]: any;
};

type VirtualTableProps<T = AnyObject> = {
  columns: ColumnDef<T>[];
  style?: CSSProperties;
  data: T[];
  cellRender: (params: {
    content: any;
    width: number;
    isActive: boolean;
    columnIndex: number;
    columnKey: string;
    rowIndex: number;
    rowKey: string;
  }) => ReactNode;
  rowHeight: number;
  headerHeight?: number;
  isGroupView?: boolean;
  groupOptions?: Array<GroupOption<T>>;
  groupGap?: number;
};

export const VirtualTable = (props: VirtualTableProps) => {
  const {
    groupGap = 10,
    headerHeight = 40,
    columns,
    data,
    cellRender,
    rowHeight,
    isGroupView,
    groupOptions,
    style,
  } = props;

  const [sorting, setSorting] = React.useState<SortingState>([]);

  const [activePosition, setActivePosition] = React.useState<[number, number]>([
    NaN,
    NaN,
  ]);

  const { groupColumns, grouping } = useMemo(() => {
    return {
      groupColumns:
        groupOptions?.map(({ groupId, groupKey }) => {
          return { id: groupId, accessorFn: groupKey, size: 0 };
        }) ?? [],
      grouping: groupOptions?.map(({ groupId }) => groupId) ?? [],
    };
  }, [groupOptions]);

  const table = useReactTable({
    data,
    columns: [...columns, ...groupColumns],
    state: {
      sorting,
    },

    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    // debugTable: true,
  });

  useEffect(() => {
    if (isGroupView) {
      table.setGrouping(
        grouping.filter((groupId) => {
          return !!table.getColumn(groupId);
        })
      );
      setTimeout(() => {
        table.toggleAllRowsExpanded(true);
      }, 10);
    } else {
      table.setGrouping([]);
    }
  }, [table, isGroupView, grouping]);

  const { rows } = table.getRowModel();

  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const row = rows[index];
      return rowHeight;
    },
    overscan: 10,
  });

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: columns.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => columns[index].size ?? 200,
    overscan: 5,
  });

  const bodyVisibleHeight =
    (parentRef.current?.clientHeight ?? 0) - headerHeight;

  const ganttBodyHeight = rowVirtualizer.getTotalSize();
  const scrollHeight = ganttBodyHeight + headerHeight;
  const scrollWidth = table
    .getHeaderGroups()[0]
    .headers.filter((header) => !grouping.includes(header.column.id))
    .reduce((total, cur) => total + cur.getSize(), 0);

  return (
    <div
      ref={parentRef}
      className={["gantt-container", "container", "gantt-table"].join(" ")}
      style={style}
    >
      <div
        className="gantt-scroll-container"
        style={{
          height: scrollHeight,
          width: scrollWidth,
        }}
      >
        <div
          className="table-header"
          style={{
            display: "flex",
            position: "sticky",
            top: 0,
            zIndex: 1,
            flexDirection: "column",
          }}
        >
          {table.getHeaderGroups().map((headerGroup) => (
            <div key={headerGroup.id} style={{ display: "flex" }}>
              {headerGroup.headers
                .filter((header) => !grouping.includes(header.column.id))
                .map((header) => {
                  return (
                    <div
                      key={header.id}
                      // colSpan={header.colSpan}
                      style={{
                        width: header.getSize(),
                        height: 60,
                        background: "black",
                        color: "white",
                        fontWeight: "bolder",
                        overflow: "hidden",
                      }}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          {...{
                            className: header.column.getCanSort()
                              ? "cursor-pointer select-none"
                              : "",
                            onClick: header.column.getToggleSortingHandler(),
                          }}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: " 🔼",
                            desc: " 🔽",
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
        <div
          className="table-body"
          style={{
            position: "absolute",
            display: "flex",
            flexDirection: "column",
            top: headerHeight,
            width: scrollWidth,
            height: Math.max(ganttBodyHeight, bodyVisibleHeight),
            zIndex: 0,
            backgroundColor: "white",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow, index) => {
            const row = rows[virtualRow.index] as Row<(typeof data)[0]>;
            const isGroupRow = row.getIsGrouped();
            return (
              <div
                key={row.id}
                style={{
                  display: "flex",
                  height: `${virtualRow.size}px`,
                  width: "100%",
                  // transform: `translateY(${virtualRow.start}px)`,
                  borderTop: isGroupRow ? "1px solid black" : "",
                  borderBottom: "1px solid black",
                  transform: `translateY(${
                    virtualRow.start - index * virtualRow.size
                  }px)`,
                  marginTop: isGroupRow ? groupGap : "unset",
                }}
              >
                {columnVirtualizer.getVirtualItems().map((virtualColumn) => {
                  const cells = row.getVisibleCells();
                  const cell = cells[virtualColumn.index];

                  const context = cell.getContext();
                  const cellValue = context.getValue();
                  let content;
                  let width = cell.column.columnDef.size ?? virtualColumn.size;
                  let style: React.CSSProperties = {
                    position: "absolute",
                    // top: 0,
                    // left: 0,
                    width: `${width}px`,
                    height: `${virtualRow.size}px`,
                    transform: `translateX(${virtualColumn.start}px) `,
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  };
                  if (cellValue?.toString) {
                    content = cellValue.toString();
                  } else {
                    content = cellValue;
                  }

                  if (!cellRender) {
                    return (
                      <div
                        key={virtualColumn.key}
                        style={style}
                        onClick={() =>
                          setActivePosition([
                            virtualRow.index,
                            virtualColumn.index,
                          ])
                        }
                      >
                        {content}
                      </div>
                    );
                  }

                  if (
                    virtualRow.index === activePosition[0] &&
                    virtualColumn.index === activePosition[1]
                  ) {
                    content = cellRender({
                      content,
                      rowIndex: virtualRow.index,
                      rowKey: row.id,
                      columnIndex: virtualColumn.index,
                      columnKey: context.column.id,
                      width,
                      isActive: true,
                    });
                  }

                  return (
                    <div
                      key={virtualColumn.key}
                      style={style}
                      onClick={() =>
                        setActivePosition([
                          virtualRow.index,
                          virtualColumn.index,
                        ])
                      }
                    >
                      {cellRender({
                        content,
                        width,
                        isActive: false,
                        columnIndex: virtualColumn.index,
                        columnKey: context.column.id,
                        rowIndex: virtualRow.index,
                        rowKey: row.id,
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
