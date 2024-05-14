import * as React from "react";
import { createRoot } from "react-dom/client";
import { Row } from "@tanstack/react-table";
import { makeData, Person } from "./makeData";
import "./index.css";
import "@radix-ui/themes/styles.css";
import { GanttMode } from "./Gantt/components/VirtualGantt";
import dayjs, { Dayjs } from "dayjs";
import { Gantt, GroupOption } from "./Gantt";
import {
  getBarEnd,
  getBarStart,
  getFrontLinkIds,
  getPostLinkIds,
  getRowId,
} from "./use/use-lib";

const mdata = makeData(50_0);
type TData = (typeof mdata)[0];

const groupOptionMap: { [key: string]: GroupOption<TData> } = {
  month: {
    groupId: "month",
    groupKey(data) {
      return dayjs(data.createdAt).format("YYYY-MM");
    },
    groupHeaderBuilder(row: Row<TData>) {
      return row;
    },
    groupGanttComponent: () => <>77777</>,
    isFixedX: true,
  },
  date: {
    groupId: "date",
    groupKey(data) {
      return dayjs(data.createdAt).format("YYYY-MM-DD");
    },
    groupHeaderBuilder(row: Row<TData>) {
      return row;
    },
    groupGanttComponent: () => <>88888</>,
    isFixedX: true,
  },
};

function App() {
  const [isGroupView, setIsGroupView] = React.useState<boolean>(false);
  const [groupOptions, setGroupOptions] = React.useState<
    GroupOption<(typeof mdata)[0]>[]
  >([]);

  const [ganttMode, setGanttMode] = React.useState<GanttMode>(GanttMode.WeekDay);

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
        <option value={GanttMode.MonthDay}>月</option>
        <option value={GanttMode.WeekDay}>周</option>
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
        getBarEnd={getBarEnd}
        getBarStart={getBarStart}
        getFrontLinkIds={getFrontLinkIds}
        getPostLinkIds={getPostLinkIds}
        getRowId={getRowId}
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
