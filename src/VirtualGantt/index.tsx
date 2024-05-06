import {
  ColumnDef,
  Row,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import React, { CSSProperties, ReactNode, useEffect, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { buildGanttHeader } from "./utils";
import { ScrollSyncNode } from "scroll-sync-react";

type AnyObject = {
  [key: string]: any;
};

export enum GanttMode {
  Year,
  Month,
  Week,
}

type VirtualGanttProps<T = AnyObject> = {
  startAt: Dayjs;
  endAt: Dayjs;
  mode: GanttMode;
  data: T[];
  rowRender: (data: any, start: Dayjs, end: Dayjs) => ReactNode;
  width?: number;
  style?: CSSProperties;
};

export const VirtualGantt = (props: VirtualGanttProps) => {
  const { data, startAt, endAt, mode, width, rowRender, style } = props;

  const [columns, setColumns] = useState<ColumnDef<any>[]>([]);

  useEffect(() => {
    const columns = buildGanttHeader(mode, startAt, endAt);
    setColumns(columns);
  }, [startAt, endAt, mode]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // debugTable: true,
  });

  const { rows } = table.getRowModel();

  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 34,
    overscan: 10,
  });

  return (
      <div ref={parentRef} className="container" style={{ width, ...style }}>
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize() + 60}px`,
          }}
        >
          <div
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
                {headerGroup.headers.map((header) => {
                  return (
                    <div
                      key={header.id}
                      // colSpan={header.colSpan}
                      style={{
                        width: header.getSize(),
                        height: 20,
                        flexShrink: 0,
                        background: "black",
                        color: "white",
                        fontWeight: "bolder",
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
                          style={
                            header.depth !== 3
                              ? {
                                  position: "sticky",
                                  left: 0,
                                  width: "min-content",
                                  whiteSpace: "nowrap",
                                  marginRight: 10,
                                }
                              : {}
                          }
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
            style={{
              width: table
                .getHeaderGroups()[0]
                .headers.reduce((total, cur) => total + cur.getSize(), 0),
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow, index) => {
              const row = rows[virtualRow.index] as Row<(typeof data)[0]>;
              return (
                <div
                  key={row.id}
                  style={{
                    display: "flex",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${
                      virtualRow.start - index * virtualRow.size
                    }px)`,
                    flexDirection: "column",
                    justifyContent: "center",
                    backgroundColor: index % 2 ? "lightpink" : "lightskyblue",
                  }}
                >
                  {rowRender(
                    row.original,
                    startAt.startOf("month"),
                    endAt.startOf("month")
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
  );
};

VirtualGantt.defaultProps = {
  mode: GanttMode.Month,
};
