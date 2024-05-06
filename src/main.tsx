import * as React from "react";
import { createRoot } from "react-dom/client";
import { ScrollArea, TextField, Theme } from "@radix-ui/themes";
import { useVirtualizer } from "@tanstack/react-virtual";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { makeData, Person } from "./makeData";
import "./index.css";
import "@radix-ui/themes/styles.css";
import { VirtualTable } from "./VirtualTable";
import { VirtualGantt } from "./VirtualGantt";
import dayjs from "dayjs";
import { ScrollSync, ScrollSyncNode } from "scroll-sync-react";
import ScrollMirror from "scrollmirror";

function ReactTableVirtualized() {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const [position, setPosition] = React.useState<[number, number]>([NaN, NaN]);

  const [columns, setColumns] = React.useState<ColumnDef<Person>[]>(() => [
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
      header: () => "Age",
      size: 150,
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
  ]);

  const [data, setData] = React.useState(() => makeData(50_000));

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
  });

  const { rows } = table.getRowModel();

  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 34,
    overscan: 20,
  });

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: columns.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => columns[index].size ?? 200,
    overscan: 3,
  });

  const onAddColumn = () => {
    setColumns((pre) => {
      return [
        ...pre,
        {
          accessorKey: "progress2",
          header: "Profile Progress2",
          size: 180,
        },
      ];
    });
  };

  return (
    <div>
      <button onClick={onAddColumn}>添加</button>

      {/* <ScrollArea
        ref={parentRef}
        type="auto"
        scrollbars="vertical"
        className="container"
        style={{ width: 600 }}
      > */}
      <div ref={parentRef} className="container" style={{ width: 600 }}>
        <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
          <div
            style={{ display: "flex", position: "sticky", top: 0, zIndex: 1 }}
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
                        height: 35,
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
          <div>
            {rowVirtualizer.getVirtualItems().map((virtualRow, index) => {
              const row = rows[virtualRow.index] as Row<Person>;
              return (
                <div
                  key={row.id}
                  style={{
                    display: "flex",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${
                      virtualRow.start - index * virtualRow.size
                    }px)`,
                  }}
                >
                  {columnVirtualizer.getVirtualItems().map((virtualColumn) => {
                    const cells = row.getVisibleCells();
                    const cell = cells[virtualColumn.index];

                    const cellValue = cell.getContext().getValue();
                    let content;
                    let style: React.CSSProperties = {
                      position: "absolute",
                      // top: 0,
                      // left: 0,
                      width: `${
                        cell.column.columnDef.size ?? virtualColumn.size
                      }px`,
                      height: `${virtualRow.size}px`,
                      transform: `translateX(${virtualColumn.start}px) `,
                      flexShrink: 0,
                    };
                    if (cellValue?.toString) {
                      content = cellValue.toString();
                    } else {
                      content = cellValue;
                    }
                    if (
                      true ||
                      (virtualRow.index === position[0] &&
                        virtualColumn.index === position[1])
                    ) {
                      content = (
                        <TextField.Root
                          placeholder="Search the docs…"
                          defaultValue={content}
                          style={{
                            display: "flex",
                            width: `${
                              cell.column.columnDef.size ?? virtualColumn.size
                            }px`,
                          }}
                        >
                          <TextField.Slot>
                            <MagnifyingGlassIcon height="16" width="16" />
                          </TextField.Slot>
                        </TextField.Root>
                      );
                    }

                    return (
                      <div
                        key={virtualColumn.key}
                        style={style}
                        onClick={() =>
                          setPosition([virtualRow.index, virtualColumn.index])
                        }
                      >
                        {content}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* </ScrollArea> */}
    </div>
  );
}

function App() {
  const [data, setData] = React.useState(() => makeData(50_000));
  React.useEffect(() => {
    new ScrollMirror(document.querySelectorAll(".container"), {
      horizontal: false,
    });
  }, []);
  return (
    <Theme>
      <div>
        <p>
          For tables, the basis for the offset of the translate css function is
          from the row's initial position itself. Because of this, we need to
          calculate the translateY pixel count different and base it off the the
          index.
        </p>
        <div style={{ display: "flex" }}>
          <VirtualTable
            width={700}
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
                header: () => "Age",
                size: 150,
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
            startAt={dayjs("2024-03")}
            endAt={dayjs("2025-06")}
            data={data}
            width={800}
            style={{
              position: "relative",
              left: -17,
            }}
            rowRender={(row, startDate, endDate) => {
              const rowStart = dayjs(row.createdAt);
              const diff = rowStart.diff(startDate, "day");
              if (rowStart.valueOf() > endDate.valueOf()) {
                return null;
              }
              return (
                <div
                  title={rowStart.format("YYYY-MM-DD")}
                  style={{
                    position: "absolute",
                    height: 20,
                    margin: "auto",
                    width: 300,
                    transform: `translateX(${diff * 50}px) `,
                    backgroundColor: "pink",
                  }}
                >
                  {diff}-{rowStart.format("YYYY-MM-DD")}
                </div>
              );
            }}
          />
        </div>
        <br />
        <br />
        {process.env.NODE_ENV === "development" ? (
          <p>
            <strong>Notice:</strong> You are currently running React in
            development mode. Rendering performance will be slightly degraded
            until this application is build for production.
          </p>
        ) : null}
      </div>
    </Theme>
  );
}

const container = document.getElementById("root");
const root = createRoot(container!);
const { StrictMode } = React;

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
