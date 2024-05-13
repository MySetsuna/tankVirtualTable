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
import { GanttMode, VirtualGantt } from "./VirtualGantt";
import dayjs, { Dayjs } from "dayjs";
import { Gantt, GroupOption } from "./Gantt";
import Flow from "./ReactFlowDemo";

const mdata = makeData(50);

const groupOptionMap: { [key: string]: GroupOption<(typeof mdata)[0]> } = {
  month: {
    groupId: "month",
    groupKey(data) {
      return dayjs(data.createdAt).format("YYYY-MM");
    },
    groupHeaderBuilder({ id, subRows, leafRows }) {
      return { id, rows: leafRows };
    },
    groupGanttComponent: (data, groupHeaderBuilder) => <>77777</>,
  },
  date: {
    groupId: "date",
    groupKey(data) {
      return dayjs(data.createdAt).format("YYYY-MM-DD");
    },
    groupHeaderBuilder: ({ id, subRows, leafRows }) => {
      return { id, rows: leafRows };
    },
    groupGanttComponent: (data, groupHeaderBuilder) => <>88888</>,
  },
};

function App() {
  const [isGroupView, setIsGroupView] = React.useState<boolean>(false);
  const [groupOptions, setGroupOptions] = React.useState<
    GroupOption<(typeof mdata)[0]>[]
  >([]);

  const [ganttMode, setGanttMode] = React.useState<GanttMode>(GanttMode.Week);

  const [selectDate, setSelectDate] = React.useState<Dayjs>(dayjs());

  return (
    <>
      <div style={{ height: 50 }}></div>
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
      <input
        type="checkbox"
        checked={groupOptions.some(({ groupId }) => groupId === "date")}
        onChange={(event) => {
          setGroupOptions((pre) => {
            return pre
              .filter(({ groupId }) => groupId !== "date")
              .concat(event.target.checked ? [groupOptionMap.date] : []);
          });
        }}
      />
      开始日期
      <input
        checked={groupOptions.some(({ groupId }) => groupId === "month")}
        type="checkbox"
        onChange={(event) => {
          console.log(event.target.checked, "event.target.checked ");

          setGroupOptions((pre) => {
            return pre
              .filter(({ groupId }) => groupId !== "month")
              .concat(event.target.checked ? [groupOptionMap.month] : []);
          });
        }}
      />
      开始月份
      <button onClick={() => setIsGroupView((pre) => !pre)}>
        {isGroupView ? "取消分组" : "确定分组"}
      </button>
      <Gantt
        data={mdata}
        isGroupView={isGroupView}
        selectDate={selectDate}
        ganttMode={ganttMode}
        groupOptions={groupOptions}
      />
    </>
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
