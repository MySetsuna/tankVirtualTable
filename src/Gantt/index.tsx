import React, { useEffect, useState } from "react";
import ScrollMirror from "scrollmirror";
import { VirtualTable } from "../VirtualTable";
import { makeData } from "../makeData";
import { TextField } from "@radix-ui/themes";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { BufferMonths, GanttMode, VirtualGantt } from "../VirtualGantt";
import dayjs, { Dayjs } from "dayjs";
import { get, groupBy } from "lodash";
import Xarrow, { useXarrow, Xwrapper } from "react-xarrows";
import Draggable from "react-draggable";
import { MyGnttBar } from "../MyGanttBar";
import {
  getBarEnd,
  getBarStart,
  getFrontLinkIds,
  getPostLinkIds,
  getRowId,
} from "./use-lib";

type AnyObject = {
  [key: string]: any;
};

type BaseGroupHeaderData = { key: string; value?: AnyObject };

export type GroupOption<T, G extends BaseGroupHeaderData = any> = {
  groupHeaderBuilder?: (groupData: T[]) => G;
  groupKey: ((data: T) => string) | keyof T;
};

export const EMPTY_TAG = "空";
export const SPLIT_TAG = "%-@-%";

type GanttProps<T = AnyObject> = {
  data: T[];
  groupOptions?: Array<GroupOption<T>>;
};

export const Gantt = (props: GanttProps) => {
  // const [data, setData] = React.useState(mdata);
  const { data, groupOptions } = props;
  type TData = (typeof data)[0];
  type GData = ReturnType<
    NonNullable<NonNullable<typeof groupOptions>[0]["groupHeaderBuilder"]>
  >;

  const [groupData, setGroupData] = useState<
    Array<TData | GData> | undefined
  >();

  useEffect(() => {
    if (groupOptions) {
      const allGroupMap = new Map<string, TData[]>();
      const keys: Array<{ key: string }> = [];
      data.forEach((item) => {
        const groupKeys = groupOptions.map(({ groupKey }) => {
          let key: string = EMPTY_TAG;
          if (typeof groupKey === "string" || typeof groupKey === "number") {
            key = get(item, groupKey, EMPTY_TAG);
          } else {
            key = groupKey(item);
          }

          return key;
        });
        const uninKey = groupKeys.join("%-@-%");
        const group = allGroupMap.get(uninKey) ?? [];
        group.push(item);
        // groupKeys.forEach((groupKey) => {
        //   const group = allGroupMap.get(groupKey) ?? [];
        //   group.push(item);
        // });
      });
      Array.from(allGroupMap.entries()).sort(([aKey], [bKey]) => {
        return aKey.localeCompare(bKey);
      });
    }
  }, [groupOptions, data]);

  React.useEffect(() => {
    new ScrollMirror(document.querySelectorAll(".gantt-container"), {
      horizontal: false,
      proportional: false,
    });
  }, []);

  const [ganttMode, setGanttMode] = useState<GanttMode>(GanttMode.Week);

  const [selectDate, setSelectDate] = useState<Dayjs>(dayjs());

  return (
    <div>
      <select
        value={ganttMode}
        onChange={(event) => {
          setGanttMode(Number(event.target.value));
        }}
      >
        <option value={GanttMode.Month}>月</option>
        <option value={GanttMode.Week}>周</option>
      </select>
      <input
        type="date"
        value={selectDate.format("YYYY-MM-DD")}
        onChange={(event) => {
          console.log(event, "event");

          setSelectDate(dayjs(event.target.value));
        }}
      />
      <button
        onClick={() => {
          setSelectDate(dayjs());
        }}
      >
        Go to Today
      </button>
      <div style={{ display: "flex" }}>
        <VirtualTable
          rowHeight={40}
          width={600}
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
        <Xwrapper>
          <VirtualGantt
            rowHeight={40}
            getFrontLinkIds={getFrontLinkIds}
            getPostLinkIds={getPostLinkIds}
            getRowId={getRowId}
            getBarEnd={getBarEnd}
            getBarStart={getBarStart}
            mode={ganttMode}
            currentAt={selectDate}
            bufferMonths={[1, 2]}
            bufferDay={40}
            // endAt={dayjs("2025-06-28")}
            data={data}
            width={1200}
            style={{
              position: "relative",
              left: -17,
            }}
           
          />
        </Xwrapper>
      </div>
    </div>
  );
};
