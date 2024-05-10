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
import Xarrow from "react-xarrows";
import React, {
  CSSProperties,
  ReactNode,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import dayjs, { Dayjs } from "dayjs";
import weekday from "dayjs/plugin/weekday";
import {
  WEEKDAY_MAP,
  buildGanttHeader,
  getGanttStyleByStart,
  getRangeAtByCurrentAt,
} from "./utils";
import { debounce } from "lodash";
import weekOfYear from "dayjs/plugin/weekOfYear";
import weekYear from "dayjs/plugin/weekYear";
import advancedFormat from "dayjs/plugin/advancedFormat";
import "dayjs/locale/zh-cn";
import { GroupOption } from "../Gantt";

dayjs.extend(advancedFormat);

dayjs.extend(weekOfYear);

dayjs.extend(weekYear);

dayjs.extend(weekday);

type AnyObject = {
  [key: string]: any;
};

// todo 在内层进行分组

export enum GanttMode {
  Month,
  Week,
}

export type HeadRender<T> = {
  showYearRow?: boolean;
  height?: [number] | [number, number] | [number, number, number];
  date?: (date: Dayjs) => ColumnDefTemplate<HeaderContext<T, unknown>>;
  week?: (
    date: Dayjs,
    timezone: string
  ) => ColumnDefTemplate<HeaderContext<T, unknown>>;
  month?: (date: Dayjs) => ColumnDefTemplate<HeaderContext<T, unknown>>;
};

export type BufferMonths = [number] | [number, number];

type VirtualGanttProps<T = AnyObject> = {
  mode?: GanttMode;
  data: T[];
  rowRender: (
    data: any,
    start: Dayjs,
    end: Dayjs,
    cellWidth: number,
    getGanttStyleByStart: (
      bartStartAt: Dayjs,
      startDate: Dayjs,
      cellWidth: number
    ) => { style: CSSProperties; diff: number }
  ) => ReactNode;
  width?: number;
  style?: CSSProperties;
  rowHeight?: number;
  cellWidth?: number;
  overscan?: number;
  bufferDay?: number;
  headRender?: HeadRender<T>;
  isHoliday?: (date: Dayjs) => boolean;
  isInfiniteX?: boolean;
  isWeekStartMonday?: boolean;
  groupOptions?: Array<GroupOption<T>>;
} & (
  | {
      startAt: Dayjs;
      endAt: Dayjs;
      currentAt?: undefined;
      bufferMonths?: undefined;
    }
  | {
      startAt?: undefined;
      endAt?: undefined;
      currentAt: Dayjs;
      bufferMonths: BufferMonths;
    }
);

export const VirtualGantt = forwardRef((props: VirtualGanttProps, ref) => {
  const {
    mode = GanttMode.Month,
    overscan = 10,
    bufferDay = 10,
    rowHeight = 34,
    cellWidth = 50,
    data: originData,
    currentAt,
    startAt,
    endAt,
    width,
    rowRender,
    headRender,
    style,
    isHoliday,
    bufferMonths: bufferM,
    isInfiniteX,
    isWeekStartMonday,
    groupOptions,
  } = props;
  type TData = (typeof originData)[0];

  const [columns, setColumns] = useState<ColumnDef<any>[]>([]);
  const [startDate, setStartDate] = useState<Dayjs | undefined>(
    startAt?.clone()
  );
  const [bufferMonths, setBufferMonths] = useState<BufferMonths>(
    bufferM ?? [3, 2]
  );
  const [endDate, setEndDate] = useState<Dayjs | undefined>(endAt?.clone());
  const [currentDate, setCurrentDate] = useState<Dayjs | undefined>(currentAt);
  const scrollToTimer = useRef<NodeJS.Timeout | null>(null);
  const scrollCallback = useRef<(() => void) | null>(() => {});
  const [data, setData] = useState<TData | any>(originData);

  const parentRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {}, [groupOptions, data]);

  // 是否使用同步effect？使用useEffect会使内容闪烁
  useLayoutEffect(() => {
    if (startDate && endDate) {
      const columns = buildGanttHeader<TData>(
        mode,
        startDate,
        endDate,
        headRender,
        cellWidth,
        isWeekStartMonday
      );
      setColumns(columns);
      scrollCallback.current?.();
    }
  }, [startDate, endDate, headRender, cellWidth, isWeekStartMonday, mode]);

  useEffect(() => {
    if (startAt && endAt) {
      setStartDate(startAt);
      setEndDate(endAt);
    }
  }, [startAt, endAt]);

  useEffect(() => {
    setCurrentDate(currentAt?.isValid() ? currentAt : dayjs());
  }, [currentAt]);

  useEffect(() => {
    if (currentDate && bufferMonths) {
      const { startAt, endAt } = getRangeAtByCurrentAt(
        currentDate,
        bufferMonths
      );

      setStartDate(startAt);
      setEndDate(endAt);
      if (parentRef.current && isInfiniteX) {
        const startOffset = currentDate.diff(startAt, "day");
        scrollCallback.current = () =>
          parentRef.current?.scrollTo({
            left: (startOffset > 3 ? startOffset - 3 : startOffset) * cellWidth,
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
  }, [currentDate, bufferMonths, cellWidth]);

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

  const lineMap = useRef(new Map());

  const handleScroll = useCallback(() => {
    if (!scrollCallback.current && isInfiniteX && parentRef.current) {
      const toLeft = parentRef.current?.scrollLeft === 0;
      const toRight =
        parentRef.current?.scrollLeft + parentRef.current?.clientWidth ===
        parentRef.current?.scrollWidth;

      if (toLeft) {
        scrollCallback.current = () => {
          parentRef.current?.scrollTo({
            left: cellWidth * bufferDay,
          });
          scrollCallback.current = null;
        };
        setEndDate((date) => date?.add(-bufferDay, "day"));
        setStartDate((date) => date?.add(-bufferDay, "day"));
        return;
      }
      if (toRight) {
        scrollCallback.current = () => {
          parentRef.current?.scrollTo({
            left: parentRef.current.scrollLeft - cellWidth * bufferDay,
          });
          scrollCallback.current = null;
        };
        setStartDate((date) => date?.add(bufferDay, "day"));
        setEndDate((date) => date?.add(bufferDay, "day"));
        return;
      }
    }
  }, [cellWidth, bufferDay]);

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

  const bodyVisibleHeight =
    (parentRef.current?.clientHeight ?? 0) - headerHeight;

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
        style={{
          position: "fixed",
          color: "red",
          zIndex: 99999,
          top: 0,
          left: 0,
        }}
      >
        {startDate?.format("YYYY-MM-DD")}---{endDate?.format("YYYY-MM-DD")}
      </div>
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
            // overflow: "hidden",
          }}
        >
          {visibleHeaderGroups.map((headerGroup, index) => {
            const height =
              headRender?.height?.[index] ||
              headRender?.height?.[0] ||
              rowHeight;
            return (
              <div
                key={headerGroup.id}
                // style={{ display: "flex", overflow: "hidden" }}
                style={{ display: "flex" }}
              >
                {headerGroup.headers.map((header, index) => {
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
                        zIndex: index,
                      }}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          style={
                            !isLeafHeader
                              ? {
                                  position: "sticky",
                                  left: 0,
                                  width: 0,
                                  whiteSpace: "nowrap",
                                  height,

                                  overflow: "visible",
                                }
                              : { height }
                          }
                        >
                          <div
                            style={{
                              position: "absolute",
                              overflow: "hidden",
                              padding: "0 5px",
                              width: header.getSize(),
                            }}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </div>
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
            height: ganttBodyHeight,
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
                  overflow: "hidden",
                }}
              >
                {!!startDate &&
                  !!endDate &&
                  rowRender(
                    row.original,
                    startDate,
                    endDate,
                    cellWidth,
                    getGanttStyleByStart
                  )}
              </div>
            );
          })}
        </div>
        <div
          className="gantt-background"
          style={{
            position: "absolute",
            display: "flex",
            top: headerHeight,
            width: scrollWidth,
            height: Math.max(ganttBodyHeight, bodyVisibleHeight),
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

            const isCurrentDate =
              currentAt?.format("YYYY-MM-DD") === date.format("YYYY-MM-DD");

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
                  zIndex: isCurrentDate ? 2 : -1,
                  position: "relative",
                }}
              >
                {isCurrentDate && (
                  <>
                    <div
                      style={{
                        height: "100%",
                        width: 5,
                        backgroundColor: "green",
                      }}
                    ></div>
                    <div
                      style={{
                        color: "green",
                        position: "absolute",
                        left: "100%",
                      }}
                    >
                      this is CurrentDate
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

VirtualGantt.defaultProps = {
  mode: GanttMode.Month,
  bufferMonths: [2, 2],
  showYearRow: false,
  rowHeight: 34,
  overscan: 10,
  bufferDay: 20,
  cellWidth: 60,
  isInfiniteX: true,
  isWeekStartMonday: true,
  headRender: {
    showYearRow: false,
    height: [30],
    date: (date) => {
      return (_props) => {
        const day = date.get("day");
        const dateStr = date.format("D");
        return (
          <div
            title={date.format("YYYY-MM-DD w")}
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
    week: (date, timezone) => {
      return (props) => {
        // const monthNumber = date.get("month");
        // return date.format(
        //   props.header.index && monthNumber ? "M月" : "YYYY-MM"
        // );
        const end = date.add(6, "day");
        const format =
          end.get("year") != date.get("year") ? "YYYY-MM-DD" : "MM-DD";

        return (
          `${date.locale(timezone).weekYear()}年` +
          " " +
          `${date.locale(timezone).week()}周 ` +
          `${date.format(format)}~${date.add(6, "day").format(format)}`
        );
      };
    },
  },
} as Partial<VirtualGanttProps>;
