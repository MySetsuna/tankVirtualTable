import * as React from "react";
import { createRoot } from "react-dom/client";
import { Row } from "@tanstack/react-table";
import { makeData, Task } from "./makeData";
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
import { getStartAndEnd } from "./Gantt/components/VirtualGantt/utils";
import { GroupKeyer } from "./typing/gantt";
import { getGroupOptions } from "./use/use-hepler";

const mdata = makeData(50);
function App() {
  const [isGroupView, setIsGroupView] = React.useState<boolean>(true);
  const [groupOptions, setGroupOptions] = React.useState<
    GroupOption<(typeof mdata)[0]>[]
  >([]);

  const [ganttMode, setGanttMode] = React.useState<GanttMode>(
    GanttMode.WeekDay
  );

  const [selectDate, setSelectDate] = React.useState<Dayjs>(dayjs());

  const [groupKeyers, setGroupKeyers] = React.useState<GroupKeyer<Task>[]>([]);
  const [grouping, setGrouping] = React.useState<(keyof Task)[]>([]);

  React.useEffect(() => {
    const groupOptions = getGroupOptions(groupKeyers, getBarStart, getBarEnd);
    setGroupOptions(groupOptions);
  }, [groupKeyers]);

  React.useEffect(() => {
    setGroupKeyers(
      grouping.map((key) => {
        return {
          key,
          groupId: `group__${key}`,
        };
      })
    );
  }, [grouping]);

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
        value={grouping}
        onChange={(e) => {
          const keys = e.target.value
            .split(",")
            .filter((item) => !!item) as (keyof Task)[];
          setGrouping(keys);
        }}
      />
      <button onClick={() => setIsGroupView((pre) => !pre)}>
        {isGroupView ? "取消分组" : "确定分组"}
      </button>
      <Gantt
        groupGap={10}
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
