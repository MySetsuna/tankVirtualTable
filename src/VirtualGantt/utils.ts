import dayjs, { Dayjs } from "dayjs";
import { GanttMode } from ".";
import { ColumnDef } from "@tanstack/react-table";

export const buildGanttHeader = (
  mode: GanttMode,
  startAt: Dayjs,
  endAt: Dayjs
): ColumnDef<any>[] => {
  if (mode === GanttMode.Month) {
    const columns: ColumnDef<any>[] = [];
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

        const startDate = start0.startOf("month").get("date");
        const endDate = start0.endOf("month").get("date");
        const dateColumns: ColumnDef<any>[] = [];
        for (let start1 = startDate; start1 <= endDate; start1++) {
          dateColumns.push({
            header: `${start1}`,
            id: monthHeader + start1,
            accessorFn: () => dayjs(monthHeader + "-" + start1),
            size: 50,
          });
        }

        monthColumns.push({
          header: monthHeader,
          columns: dateColumns,
        });
      }
      columns.push({
        header: yearHeader,
        columns: monthColumns,
      });
    }

    return columns;
  }
  return [];
};
