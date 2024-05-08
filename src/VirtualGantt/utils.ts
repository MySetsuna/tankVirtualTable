import dayjs, { Dayjs } from "dayjs";
import { GanttMode, HeadRender } from ".";
import {
  ColumnDef,
  ColumnDefTemplate,
  HeaderContext,
} from "@tanstack/react-table";
import { ReactNode } from "react";

export const WEEKDAY_MAP = {
  0: "日",
  1: "一",
  2: "二",
  3: "三",
  4: "四",
  5: "五",
  6: "六",
};

export const buildGanttHeader = <T>(
  mode: GanttMode,
  startAt: Dayjs,
  endAt: Dayjs,
  headRender?: HeadRender<T>,
  cellWidth = 50
): ColumnDef<any>[] => {
  if (mode === GanttMode.Month) {
    const columns: ColumnDef<any>[] = [];
    const startAtMonth = startAt.format("YYYY-MM");
    const startAtDateNumber = startAt.get("date");
    const endAtMonth = endAt.format("YYYY-MM");
    const endAtDateNumber = endAt.get("date");
    for (
      let start = startAt;
      start.get("year") <= endAt.get("year");
      start = start.add(1, "year")
    ) {
      const yearHeader = start.format("YYYY");
      const monthColumns: ColumnDef<any>[] = [];

      const startMonth = start === startAt ? startAt : start.startOf("year");
      const endMonth =
        endAt.get("year") > startMonth.get("year")
          ? startMonth.endOf("year")
          : endAt;
      for (
        let start0 = startMonth;
        start0.get("month") <= endMonth.get("month") &&
        start0.get("year") <= endMonth.get("year");
        start0 = start0.add(1, "month")
      ) {
        const monthHeader = start0.format("YYYY-MM");

        const startDateNumber = start0.startOf("month").get("date");
        const endDateNumber = start0.endOf("month").get("date");
        const dateColumns: ColumnDef<any>[] = [];
        const beginNumber =
          startAtMonth === monthHeader ? startAtDateNumber : startDateNumber;
        const stopNumber =
          endAtMonth === monthHeader ? endAtDateNumber : endDateNumber;
        for (let start1 = beginNumber; start1 <= stopNumber; start1++) {
          const current = monthHeader + "-" + start1;
          dateColumns.push({
            header: headRender?.date?.(dayjs(current)) || `${startDateNumber}`,
            id: current,
            size: cellWidth,
          });
        }

        monthColumns.push({
          id: monthHeader,
          header: headRender?.month?.(dayjs(monthHeader)) || monthHeader,
          columns: dateColumns,
        });
      }
      columns.push({
        header: yearHeader,
        columns: monthColumns,
        id: yearHeader,
      });
    }

    return columns;
  }
  return [];
};

export const getRangeAtByCurrentAt = <T>(
  currentAt: Dayjs,
  bufferMonths: [number] | [number, number],
) => {
  const preBuffer = bufferMonths[0];
  const nextBuffer = bufferMonths[1] || bufferMonths[0];
  const startAt = currentAt.add(-preBuffer, "month");
  const endAt = currentAt.add(nextBuffer, "month");
  return { startAt, endAt };
};
