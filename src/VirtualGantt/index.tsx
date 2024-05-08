import {
  ColumnDef,
  ColumnDefTemplate,
  HeaderContext,
  Row,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import React, {
  CSSProperties,
  ReactNode,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import dayjs, { Dayjs } from "dayjs";
import weekday from "dayjs/plugin/weekday";
import {
  WEEKDAY_MAP,
  buildGanttHeader,
  buildGanttHeaderWithCurrentDate,
} from "./utils";
import { ScrollSyncNode } from "scroll-sync-react";

dayjs.extend(weekday);

type AnyObject = {
  [key: string]: any;
};

export enum GanttMode {
  Month,
  Week,
}
export type HeadRender<T> = {
  showYearRow?: boolean;
  height?: [number] | [number, number] | [number, number, number];
  date?: (date: Dayjs) => ColumnDefTemplate<HeaderContext<T, unknown>>;
  month?: (date: Dayjs) => ColumnDefTemplate<HeaderContext<T, unknown>>;
};

type BufferMonths = [number] | [number, number];

type VirtualGanttProps<T = AnyObject> = {
  mode?: GanttMode;
  data: T[];
  rowRender: (
    data: any,
    start: Dayjs,
    end: Dayjs,
    cellWidth: number
  ) => ReactNode;
  width?: number;
  style?: CSSProperties;
  rowHeight?: number;
  cellWidth?: number;
  overscan?: number;
  headRender?: HeadRender<T>;
  isHoliday?: (date: Dayjs) => boolean;
} & (
  | {
      startAt: Dayjs;
      endAt: Dayjs;
      currentAt?: undefined;
      bufferMonths?: undefined;
      maxDayNumber?: undefined;
    }
  | {
      startAt?: undefined;
      endAt?: undefined;
      currentAt: Dayjs;
      maxDayNumber: number;
      bufferMonths: BufferMonths;
    }
);

export const VirtualGantt = forwardRef((props: VirtualGanttProps, ref) => {
  const {
    mode = GanttMode.Month,
    overscan = 10,
    rowHeight = 34,
    cellWidth = 50,
    data,
    currentAt,
    startAt,
    endAt,
    width,
    rowRender,
    headRender,
    style,
    isHoliday,
    bufferMonths,
    maxDayNumber,
  } = props;
  type TData = (typeof data)[0];

  const [columns, setColumns] = useState<ColumnDef<any>[]>([]);
  const [startDate, setStartDate] = useState<Dayjs>(dayjs().startOf("month"));
  const [endDate, setEndDate] = useState<Dayjs>(dayjs().endOf("month"));
  const scrollToTimer = useRef<NodeJS.Timeout | null>(null);
  const scrollCallback = useRef<(() => void) | null>(null);
  const [currentBufferMonths, setCurrentBufferMonths] = useState<BufferMonths>(
    bufferMonths || [2]
  );

  const parentRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (startAt && endAt) {
      const columns = buildGanttHeader<TData>(
        mode,
        startAt,
        endAt,
        headRender,
        cellWidth
      );
      setColumns(columns);
      setStartDate(startAt);
      setEndDate(endAt);
    }
  }, [startAt, endAt, mode, headRender, cellWidth]);

  useEffect(() => {
    if (currentAt) {
      const { columns, startAt, endAt } = buildGanttHeaderWithCurrentDate(
        mode,
        currentAt,
        bufferMonths,
        headRender,
        cellWidth
      );
      setColumns(columns);
      setStartDate(startAt);
      setEndDate(endAt);
      if (parentRef.current) {
        const startOffset = currentAt.diff(startAt, "day");
        scrollCallback.current = () =>
          parentRef.current?.scrollTo({
            left: (startOffset > 3 ? startOffset - 3 : startOffset) * cellWidth,
            behavior: "smooth",
          });
        const onScroll = () => {
          if (scrollToTimer.current) clearTimeout(scrollToTimer.current);
          scrollToTimer.current = setTimeout(() => {
            scrollCallback.current?.();
            scrollCallback.current = null;
          }, 10);
        };
        const observer = new ResizeObserver(onScroll);
        observer.observe(parentRef.current);
        return () => {
          observer.disconnect();
          if (scrollToTimer.current) clearTimeout(scrollToTimer.current);
        };
      }
    }
  }, [currentAt, mode, bufferMonths, headRender, maxDayNumber, cellWidth]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // debugTable: true,
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
  });

  const handleScroll = useCallback(() => {
    if (!scrollCallback.current && currentAt && parentRef.current) {
      const toLeft = parentRef.current?.scrollLeft < cellWidth * 3;
      if (toLeft) {
        const bufferMonths: BufferMonths = [
          currentBufferMonths[0] + 1,
          currentBufferMonths[1] || currentBufferMonths[0],
        ];
        setCurrentBufferMonths(bufferMonths);
        const { columns, startAt, endAt } = buildGanttHeaderWithCurrentDate(
          mode,
          currentAt,
          bufferMonths,
          headRender,
          cellWidth
        );
        setColumns(columns);
        setStartDate(startAt);
        setEndDate(endAt);
        // parentRef.current.scrollLeft =
        //   cellWidth * startDate.diff(startAt, "day");
      }
    }
  }, [currentBufferMonths, startDate]);

  const visibleHeaderGroups = table
    .getHeaderGroups()
    .slice(headRender?.showYearRow ? 0 : 1);

  const leafHeaderGroup = visibleHeaderGroups[visibleHeaderGroups.length - 1];

  const headerHeight = visibleHeaderGroups.reduce(
    (totalHeight, _headerGroup, index) => {
      const height =
        headRender?.height?.[index] || headRender?.height?.[0] || rowHeight;
      return totalHeight + height;
    },
    0
  );

  const ganttBodyHeight = rowVirtualizer.getTotalSize();
  const scrollHeight = ganttBodyHeight + headerHeight;
  const scrollWidth = table
    .getHeaderGroups()[0]
    .headers.reduce((total, cur) => total + cur.getSize(), 0);

  useImperativeHandle(ref, () => {
    return {};
  });

  return (
    <div
      ref={parentRef}
      className="gantt-container container"
      style={{ width, ...style }}
      onScroll={handleScroll}
    >
      <div
        className="gantt-scroll-container"
        style={{
          height: scrollHeight,
          width: scrollWidth,
        }}
      >
        <div
          className="gantt-header"
          style={{
            display: "flex",
            position: "sticky",
            top: 0,
            zIndex: 3,
            flexDirection: "column",
          }}
        >
          {visibleHeaderGroups.map((headerGroup, index) => {
            const height =
              headRender?.height?.[index] ||
              headRender?.height?.[0] ||
              rowHeight;
            return (
              <div key={headerGroup.id} style={{ display: "flex" }}>
                {headerGroup.headers.map((header) => {
                  const isLeafHeader = header.depth === 3;
                  return (
                    <div
                      key={header.id}
                      // colSpan={header.colSpan}
                      style={{
                        background: "black",
                        color: "white",
                        fontWeight: "bolder",
                        width: header.getSize(),
                        height,
                        flexShrink: 0,
                        borderRight: "1px white solid",
                        borderBottom: !isLeafHeader
                          ? "1px white solid"
                          : "unset",
                      }}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          style={
                            !isLeafHeader
                              ? {
                                  position: "sticky",
                                  left: 0,
                                  width: "min-content",
                                  whiteSpace: "nowrap",
                                  height,
                                  padding: "0 5px",
                                }
                              : { height }
                          }
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div
          className="gantt-body"
          style={{
            width: scrollWidth,
            zIndex: 2,
            position: "relative",
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
                }}
              >
                {rowRender(row.original, startDate, endDate, cellWidth)}
              </div>
            );
          })}
        </div>
        <div
          style={{
            position: "absolute",
            display: "flex",
            top: headerHeight,
            width: scrollWidth,
            height: ganttBodyHeight,
            zIndex: 1,
            backgroundColor: "white",
            pointerEvents: "none",
          }}
        >
          {leafHeaderGroup?.headers.map((header) => {
            const date = dayjs(header.id);
            const dayNumber = date.get("day");
            const isWeekend = dayNumber === 0 || dayNumber === 6;
            const isRest = isHoliday?.(date) || isWeekend;
            return (
              <div
                key={header.id}
                style={{
                  display: "flex",
                  justifyContent: "center",
                  width: header.getSize(),
                  height: "100%",
                  // backgroundColor: "red",
                  borderRight: "1px solid black",
                  // pointerEvents: "none",
                  backgroundColor: isRest ? "#acacac60" : "white",
                  zIndex: -1,
                }}
              ></div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

VirtualGantt.defaultProps = {
  mode: GanttMode.Month,
  bufferMonths: [1, 2],
  maxDayNumber: 1000,
  showYearRow: false,
  rowHeight: 34,
  overscan: 10,
  cellWidth: 60,
  headRender: {
    showYearRow: false,
    height: [30],
    date: (date) => {
      return (_props) => {
        const day = date.get("day");
        const dateStr = date.format("D");
        return (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              whiteSpace: "nowrap",
              padding: "0 5px",
            }}
          >
            <span>{dateStr}</span>
            <span>{WEEKDAY_MAP[day]}</span>
          </div>
        );
      };
    },
    month: (date) => {
      return (props) => {
        // const monthNumber = date.get("month");
        // return date.format(
        //   props.header.index && monthNumber ? "M月" : "YYYY-MM"
        // );
        return date.format("YYYY年M月");
      };
    },
  },
} as Partial<VirtualGanttProps>;
