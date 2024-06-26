import dayjs, { Dayjs } from "dayjs";
import { AnyObject, GanttMode, HeadRender } from ".";
import { ColumnDef } from "@tanstack/react-table";
import { CSSProperties } from "react";
import { Node } from "reactflow";
import { VirtualItem } from "@tanstack/react-virtual";
import { Row } from "@tanstack/react-table";
import weekOfYear from "dayjs/plugin/weekOfYear";
import weekYear from "dayjs/plugin/weekYear";
import "dayjs/locale/zh-cn";
import advancedFormat from "dayjs/plugin/advancedFormat";
import { GanttBarData, GanttNode, GroupGanttBarData, GroupOption } from "../..";
dayjs.extend(advancedFormat);
dayjs.extend(weekOfYear);
dayjs.extend(weekYear);

export interface GroupingRow<TData> {
  leafRows: Row<TData[]>;
  subRows: Row<TData[]>;
  groupingColumnId: string;
  groupingValue: any;
}

export type GanttHeaderBuilder = typeof buildGanttHeader;

export const WEEKDAY_MAP = {
  0: "日",
  1: "一",
  2: "二",
  3: "三",
  4: "四",
  5: "五",
  6: "六",
};

export const buildGanttHeader = <T, M = GanttMode>(
  mode: M,
  startAt: Dayjs,
  endAt: Dayjs,
  headRender?: HeadRender<T>,
  cellWidth = 50,
  isWeekStartMonday = true
): ColumnDef<any>[] => {
  const timezone = isWeekStartMonday ? "zh-cn" : "en";
  if (mode === GanttMode.MonthDay) {
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
            header: headRender?.date?.(dayjs(current)) || `${start1}`,
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
  if (GanttMode.WeekDay === mode) {
    const columns: ColumnDef<any>[] = [];
    const startAtWeekOfYear = startAt.locale(timezone).format("YYYY-w");
    const endAtWeekOfYear = endAt.locale(timezone).format("YYYY-w");
    for (
      let start = startAt;
      start.get("year") <= endAt.get("year");
      start = start.add(1, "year")
    ) {
      const yearHeader = start.format("YYYY");
      const monthColumns: ColumnDef<any>[] = [];

      const startWeek = start === startAt ? startAt : start.startOf("year");
      const endWeek =
        endAt.get("year") > startWeek.get("year")
          ? startWeek.endOf("year")
          : endAt;

      for (
        let start0 = startWeek;
        Number(
          `${start0.locale(timezone).weekYear()}${start0
            .locale(timezone)
            .format("ww")}`
        ) <=
          Number(
            `${endWeek.locale(timezone).weekYear()}${endWeek
              .locale(timezone)
              .format("ww")}`
          ) && start0.get("year") <= endWeek.get("year");
        start0 = start0.add(7, "day")
      ) {
        const weekHeader = start0.locale(timezone).format("YYYY-w");

        const startDateWeek = start0.locale(timezone).startOf("week");
        const endDateWeek = start0.locale(timezone).endOf("week");

        if (startDateWeek.get("year") !== start.get("year")) {
          continue;
        }
        const dateColumns: ColumnDef<any>[] = [];
        const begin =
          startAtWeekOfYear === weekHeader ? startAt : startDateWeek;
        const stop = endAtWeekOfYear === weekHeader ? endAt : endDateWeek;
        for (
          let start1 = begin;
          start1.startOf("date").valueOf() <= stop.startOf("date").valueOf();
          start1 = start1.add(1, "day")
        ) {
          const id = start1.format("YYYY-MM-DD");
          dateColumns.push({
            header:
              headRender?.date?.(start1) ||
              `${start1.locale(timezone).weekday()}`,
            id,
            size: cellWidth,
          });
        }

        monthColumns.push({
          id: weekHeader,
          header: headRender?.week?.(begin, timezone) || weekHeader,
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
  bufferMonths: [number] | [number, number]
) => {
  const preBuffer = bufferMonths[0];
  const nextBuffer = bufferMonths[1] || bufferMonths[0];
  const startAt = currentAt.add(-preBuffer, "month");
  const endAt = currentAt.add(nextBuffer, "month");
  return { startAt, endAt };
};

export const getDayDiff = (
  date?: Dayjs,
  offsetDate?: Dayjs,
  defaultDiff = 0
) => {
  if (date && offsetDate) {
    let diff = date.startOf("date").diff(offsetDate.startOf("date"), "day");
    if (diff < 0) {
      diff -= 1;
    }
    return diff;
  } else if (date || offsetDate) {
    return defaultDiff;
  }
  return 0;
};

export type GanttStyleByStartParams = {
  barStart?: Dayjs;
  barEnd?: Dayjs;
  startDate: Dayjs;
  cellWidth: number;
  minBarRange: number;
};

export const getGanttStyleByStart = ({
  barStart,
  barEnd,
  startDate,
  cellWidth,
  minBarRange,
}: GanttStyleByStartParams) => {
  if ((barStart && barEnd) || ((barStart || barEnd) && minBarRange)) {
    const diff = getDayDiff(
      barStart ?? barEnd?.add(-minBarRange, "day"),
      startDate,
      0
    );
    const style: CSSProperties = {
      position: "absolute",
      // transform: `translateX(${}px) `,
      left: diff * cellWidth,
    };
    return { style, diff };
  }
  return {
    style: {
      display: "none",
    },
    diff: 0,
  };
};

export const getNodes = <T>(
  rows: Row<T>[],
  virtualItems: VirtualItem[],
  getDayDiff: (
    date?: Dayjs,
    offsetDate?: Dayjs,
    defaultDiff?: number
  ) => number,
  startDate: Dayjs,
  getBarStart: (row: T) => Dayjs | undefined,
  getBarEnd: (row: T) => Dayjs | undefined,
  cellWidth: number,
  minBarRange: number,
  getRowId: (row: Row<T>) => string,
  groupGap: number,
  isGroupView: boolean,
  groupOptions?: GroupOption<T>[],
  margin = 4
): GanttNode<T>[] => {
  const nodes: Node<GanttBarData<T> | GroupGanttBarData<T, any>>[] = [];
  virtualItems.forEach((virtualRow, index) => {
    /**
     * 
groupingColumnId
: 
"month"
groupingValue
: 
"2024-06"
     */
    const row = rows[virtualRow.index] as Row<T>;
    const option = groupOptions?.find(
      ({ groupId }) => groupId === row.groupingColumnId
    );
    const group = option?.groupHeaderBuilder?.(row);
    const isGroupRow = isGroupView && !!group;
    const id = getRowId(row);
    const barStart = isGroupRow ? group?.startAt : getBarStart(row.original);
    const barEnd = isGroupRow ? group?.endAt : getBarEnd(row.original);
    const height = virtualRow.size - margin * 2 - (isGroupRow ? groupGap : 0);
    const y = virtualRow.start + margin + (isGroupRow ? groupGap : 0);
    const width = (getDayDiff(barEnd, barStart, minBarRange) + 1) * cellWidth;
    const diff = getDayDiff(barStart ?? barEnd?.add(-1, "day"), startDate, 0);

    nodes.push({
      id,
      // height,
      // width,
      data: {
        group: option ? option.groupHeaderBuilder?.(row) : undefined,
        row,
        fixedY: y,
        fixedX: option?.isFixedX ? diff * cellWidth : undefined,
        height,
        width,
        minWidth: minBarRange * cellWidth,
        index: virtualRow.index,
        cellWidth,
      },
      position: {
        x: diff * cellWidth,
        y,
      },
      style: {
        height,
        width,
        cursor: option?.isFixedX ? "auto" : "grab",
      },
      type: row.groupingColumnId ?? "gantbar",
    });
  });
  return nodes;
};

export const getStartAndEnd = <T>(
  leafRows: Row<T>[],
  getStart: (data: T) => Dayjs | undefined,
  getEnd: (data: T) => Dayjs | undefined
) => {
  let startAt: Dayjs | undefined = undefined;
  let endAt: Dayjs | undefined = undefined;
  leafRows.forEach(({ original }) => {
    const start = getStart(original);
    const end = getEnd(original);
    if ((!startAt && start) || start?.isBefore(startAt)) {
      startAt = start;
    }
    if ((!end && end) || end?.isAfter(endAt)) {
      endAt = end;
    }
  });
  return {
    startAt,
    endAt,
  };
};
