import React from "react";
import ScrollMirror from "scrollmirror";
import { VirtualTable } from "../VirtualTable";
import { makeData } from "../makeData";
import { TextField } from "@radix-ui/themes";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { VirtualGantt } from "../VirtualGantt";
import dayjs from "dayjs";

export const Gantt = () => {
  const [data, setData] = React.useState(() => makeData(50_00));
  React.useEffect(() => {
    new ScrollMirror(document.querySelectorAll(".gantt-container"), {
      horizontal: false,
      proportional: false,
    });
  }, []);
  return (
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
        currentAt={dayjs("2024-03-25")}
        bufferMonths={[1, 3]}
        maxDayNumber={1000}
        // endAt={dayjs("2025-06-28")}
        data={data}
        width={800}
        style={{
          position: "relative",
          left: -17,
        }}
        rowRender={(row, startDate, endDate, cellWidth) => {
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
                transform: `translateX(${diff * cellWidth}px) `,
                backgroundColor: "pink",
              }}
            >
              {rowStart.format("YYYY-MM-DD")} -offset : {diff}
            </div>
          );
        }}
      />
    </div>
  );
};
