/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ColumnDef,
  ColumnDefTemplate,
  HeaderContext,
  Row,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getGroupedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import React, {
  CSSProperties,
  FC,
  HTMLAttributes,
  Key,
  MutableRefObject,
  ReactElement,
  ReactNode,
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import dayjs, { Dayjs } from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import {
  GanttHeaderBuilder,
  WEEKDAY_MAP,
  buildGanttHeader,
  getDayDiff,
  getEdges,
  getIsModeLastDay,
  getNodes,
  getRangeAtByCurrentAt,
} from '../../utils';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import weekYear from 'dayjs/plugin/weekYear';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import 'dayjs/locale/zh-cn';
import {
  GanttBarData,
  GanttBarProps,
  GanttNode,
  GroupGanttBarProps,
  GroupOption,
} from '../..';
import {
  Connection,
  NodeChange,
  NodeProps,
  NodeTypes,
  applyNodeChanges,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from 'reactflow';
import { GanttBarBox } from '../GanttBarBox';
import GanttFlow from '../GanttFlow';
import { isEmpty, isEqual, uniqBy } from 'lodash';
import ScrollMirror from 'scrollmirror';
import { EnumType, TupleType } from 'typescript';
import { current } from '@reduxjs/toolkit';

dayjs.extend(advancedFormat);

dayjs.extend(weekOfYear);

dayjs.extend(weekYear);

dayjs.extend(weekday);

export type AnyObject = {
  [key: string]: any;
};

// todo 在内层进行分组

export enum GanttMode {
  MonthDay,
  WeekDay,
  YearWeek,
  YearMonth,
  YearQuarter,
}

export enum GanttCustomMode {
  CustomMode = 'CustomMode',
}

export type HeadRender<T> = {
  date?: (date: Dayjs) => ColumnDefTemplate<HeaderContext<T, unknown>>;
  week?: (
    date: Dayjs,
    timezone: string
  ) => ColumnDefTemplate<HeaderContext<T, unknown>>;
  month?: (date: Dayjs) => ColumnDefTemplate<HeaderContext<T, unknown>>;
};

export type BufferMonths = [number] | [number, number];

export type HeaderHeightOps =
  | [number]
  | [number, number]
  | [number, number, number];

export enum BaseGanttAlertType {
  idle = 'idle',
  conflict = 'conflict',
}

export interface GanttAlertOption<T = any> {
  [key: string]:
    | undefined
    | ({
        component?: (props: {
          type: string;
          date: Dayjs;
          rows: Row<T>[];
          data: any;
        }) => ReactNode;
        modeLastDayBorder?: CSSProperties['border'];
      } & HTMLAttributes<HTMLDivElement>);
}

export type VirtualGanttProps<T extends object = any> = {
  data: T[];
  style?: CSSProperties;
  rowHeight?: number;
  cellWidth?: number;
  overscan?: number;
  bufferDay?: number;
  headRender?: HeadRender<T>;
  isHoliday?: (date: Dayjs) => boolean;
  isInfiniteX?: boolean;
  isWeekStartMonday?: boolean;
  getBarStart: (row: T) => Dayjs | undefined;
  getBarEnd: (row: T) => Dayjs | undefined;
  getToLinkIds: (row: T) => Key[];
  getFromLinkIds: (row: T) => Key[];
  getRowId: (row: Row<T>) => string;
  getLeafRowOriginalId: (row: Row<T>) => string;
  minBarRange?: number;
  // barStyle?: CSSProperties | ((row: T, index: number) => CSSProperties);
  // barClassName?: string | ((row: T, index: number) => string);
  isGroupView?: boolean;
  groupOptions?: Array<GroupOption<T>>;
  GanttBar?: (props: GanttBarProps<T>) => ReactNode;
  groupGap?: number;
  ganttExpanded?: { [expandKey: string]: true };
  showYearRow?: boolean;
  headerHeight?: HeaderHeightOps;
  alertHeight?: number;
  table: ReactElement;
  scrollSyncElementQuery?: string;
  scrollSyncClassName: string;
  onBarChange?: (startAt: Dayjs, endAt: Dayjs, node: GanttNode<T>) => void;
  onDisConnect?: (from: string, to: string) => void;
  onConnect?: (connection: Connection) => void;
  renderEdgeDeleteTitle?: (props: {
    form: GanttNode<any>;
    to: GanttNode<any>;
  }) => ReactNode;
  getCustomModeLastDay?: (date: Dayjs, isWeekStartMonday?: boolean) => boolean;
  alertOptionMap: GanttAlertOption<T>;
  alertType: {
    fn: (
      date: Dayjs,
      rows: Row<T>[],
      params: any
    ) => { type: string; data: any };
    params: any;
  };
  showAlert?: boolean;
  defaultAlertStyle?: CSSProperties;
  defaultAlertClassName?: string;
  hasLastGroupGap?: boolean;
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
) &
  (
    | {
        mode?: GanttMode;
        customHeaderBuilder?: undefined;
      }
    | {
        mode: GanttCustomMode;
        customHeaderBuilder: GanttHeaderBuilder;
      }
  );
const VirtualGanttComponent = (props: VirtualGanttProps) => {
  const {
    mode = GanttMode.MonthDay,
    overscan = 10,
    bufferDay = 10,
    groupGap = 10,
    hasLastGroupGap = false,
    rowHeight = 34,
    cellWidth = 50,
    minBarRange = 1,
    alertHeight = 16,
    data,
    currentAt,
    startAt,
    endAt,
    headRender,
    headerHeight: headerHeightOp,
    showYearRow,
    style,
    isHoliday,
    bufferMonths: bufferM,
    isInfiniteX,
    isWeekStartMonday,
    groupOptions,
    isGroupView,
    getBarStart,
    getBarEnd,
    getToLinkIds,
    getFromLinkIds,
    getRowId,
    GanttBar,
    customHeaderBuilder,
    table: tableNode,
    scrollSyncClassName,
    scrollSyncElementQuery,
    onBarChange,
    onDisConnect,
    onConnect,
    getLeafRowOriginalId,
    ganttExpanded,
    renderEdgeDeleteTitle,
    getCustomModeLastDay,
    showAlert,
    alertOptionMap,
    defaultAlertStyle,
    defaultAlertClassName,
    alertType: getAlertType,
  } = props;
  type TData = (typeof data)[0];

  const [columns, setColumns] = useState<ColumnDef<any>[]>([]);

  const [headerHeightOps, setheaderHeightOps] = useState<
    HeaderHeightOps | undefined
  >(headerHeightOp);

  const [nodes, setNodes, onNodesChange] = useNodesState(
    [] as GanttNode<TData>[]
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [startDate, setStartDate] = useState<Dayjs | undefined>(
    startAt?.clone()
  );
  const [originStart, setOriginStart] = useState<Dayjs | undefined>(
    startAt?.clone()
  );
  const [bufferMonths, setBufferMonths] = useState<BufferMonths>(
    bufferM ?? [3, 2]
  );
  const [endDate, setEndDate] = useState<Dayjs | undefined>(endAt?.clone());
  const [currentDate, setCurrentDate] = useState<Dayjs | undefined>(currentAt);
  const scrollToTimer = useRef<NodeJS.Timeout | null>(null);
  const scrollCallback = useRef<(() => void) | null>(() => {});
  // const [viewportX, setViewportX] = useState<number>(0);

  const parentRef = React.useRef<HTMLDivElement>(null);

  const viewportX = useMemo(() => {
    return (originStart?.diff(startDate, 'day') ?? 0) * cellWidth;
  }, [originStart, startDate, cellWidth]);

  const { groupColumns, grouping } = useMemo(() => {
    return {
      groupColumns:
        groupOptions?.map(({ groupId, groupKey }) => {
          return { id: groupId, accessorFn: groupKey, size: 0 };
        }) ?? [],
      grouping: groupOptions?.map(({ groupId }) => groupId) ?? [],
    };
  }, [groupOptions]);

  const nodeTypes = useMemo(() => {
    return (groupOptions ?? []).reduce<NodeTypes>(
      (pre, { groupId, groupGanttComponent: Component }) => {
        return {
          ...pre,
          [groupId]: (props) => (
            <Component
              {...props}
              setNodes={setNodes}
              onNodesChange={onNodesChange}
              onBarChange={onBarChange}
              originStart={originStart}
            />
          ),
        };
      },
      {
        gantbar: (props) => (
          <GanttBarBox
            {...props}
            setNodes={setNodes}
            onNodesChange={onNodesChange}
            onBarChange={onBarChange}
            originStart={originStart}
            getBarStart={getBarStart}
            getBarEnd={getBarEnd}
            rows={rows}
          >
            {GanttBar}
          </GanttBarBox>
        ),
      }
    );
  }, [
    groupOptions,
    GanttBar,
    originStart,
    onBarChange,
    onNodesChange,
    getBarStart,
    getBarEnd,
  ]);

  useEffect(() => {
    if (startAt && endAt) {
      setStartDate(startAt);
      setOriginStart(startAt);
      setEndDate(endAt);
    }
  }, [startAt, endAt]);

  useEffect(() => {
    if (bufferM && !isEqual(bufferM, bufferMonths)) {
      setBufferMonths(bufferM);
    }
  }, [bufferM, bufferMonths]);

  useEffect(() => {
    if (headerHeightOp && !isEqual(headerHeightOps, headerHeightOp)) {
      setheaderHeightOps(headerHeightOp);
    }
  }, [headerHeightOps, headerHeightOp]);

  React.useEffect(() => {
    new ScrollMirror(
      document.querySelectorAll(
        scrollSyncElementQuery ?? `.${scrollSyncClassName}`
      ),
      {
        horizontal: false,
        proportional: true,
      }
    );
  }, [tableNode]);

  useEffect(() => {
    setCurrentDate(currentAt?.isValid() ? currentAt : dayjs());
  }, [currentAt]);

  const { setViewport } = useReactFlow();

  useEffect(() => {
    setViewport({
      x: viewportX,
      y: 0,
      zoom: 1,
    });
  }, [viewportX]);

  useEffect(() => {
    if (currentDate && bufferMonths) {
      const { startAt, endAt } = getRangeAtByCurrentAt(
        currentDate,
        bufferMonths
      );

      setStartDate(startAt);
      setOriginStart(startAt);
      setEndDate(endAt);
      if (parentRef.current && isInfiniteX) {
        const startOffset = currentDate.diff(startAt, 'day');
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
    state: {
      expanded: ganttExpanded,
    },
    getCoreRowModel: getCoreRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    // debugTable: true,
  });

  useEffect(() => {
    if (isGroupView) {
      table.setGrouping(
        grouping.filter((groupId) => {
          return !!table.getColumn(groupId);
        })
      );
    } else {
      table.setGrouping([]);
    }
  }, [table, isGroupView, grouping]);

  useEffect(() => {
    console.log(table.getState().expanded, 'table expanded');
  }, [table.getState().expanded]);

  const { rows } = table.getRowModel();
  // const grouingRows = useMemo(()=>{
  //   const groupingRows = [];
  //   rows
  // },[isGroupView,expandKeys,rows])

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const row = rows[index];
      return row.groupingColumnId ? rowHeight + groupGap : rowHeight;
    },
    overscan,
  });

  useEffect(() => {
    const edges = getEdges(
      rows,
      rowVirtualizer.getVirtualItems(),
      getFromLinkIds,
      getLeafRowOriginalId
    );

    setEdges(edges);
  }, [
    rows,
    rowVirtualizer.getVirtualItems(),
    getFromLinkIds,
    getLeafRowOriginalId,
  ]);

  useEffect(() => {
    if (originStart) {
      const nodes = getNodes(
        rows,
        rowVirtualizer.getVirtualItems(),
        getDayDiff,
        originStart,
        getBarStart,
        getBarEnd,
        cellWidth,
        minBarRange,
        getRowId,
        getLeafRowOriginalId,
        groupGap,
        !!isGroupView,
        groupOptions
      );
      setNodes((oldNodes) => {
        const changes = isEmpty(oldNodes)
          ? nodes
          : nodes.map((newNode) => {
              const oldNode = oldNodes.find(({ id }) => newNode.id === id);

              if (isEqual(oldNode, newNode)) {
                return oldNode as GanttNode<TData>;
              }
              if (oldNode) {
                return Object.assign(oldNode, newNode);
              }
              return newNode as GanttNode<TData>;
            });
        return changes;
      });
    }
  }, [
    originStart,
    rows,
    isGroupView,
    groupGap,
    getDayDiff,
    getBarStart,
    minBarRange,
    rowVirtualizer.getVirtualItems(),
    groupOptions,
    getLeafRowOriginalId,
    getRowId,
  ]);

  // 是否使用同步effect？使用useEffect会使内容闪烁
  useLayoutEffect(() => {
    if (startDate && endDate) {
      let columns: ColumnDef<any>[] = [];
      if (GanttCustomMode.CustomMode === mode && customHeaderBuilder) {
        columns = customHeaderBuilder<TData, GanttCustomMode>(
          mode,
          startDate,
          endDate,
          headRender,
          cellWidth,
          isWeekStartMonday
        );
      } else if (Object.values(GanttMode).some((item) => item === mode)) {
        columns = buildGanttHeader<TData>(
          mode as GanttMode,
          startDate,
          endDate,
          headRender,
          cellWidth,
          isWeekStartMonday
        );
      }
      setColumns([...columns, ...groupColumns]);
      scrollCallback.current?.();
    }
  }, [
    startDate,
    endDate,
    headRender,
    cellWidth,
    isWeekStartMonday,
    mode,
    groupColumns,
    bufferDay,
  ]);

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
        setEndDate((date) => date?.add(-bufferDay, 'day'));
        setStartDate((date) => date?.add(-bufferDay, 'day'));
        return;
      }
      if (toRight) {
        scrollCallback.current = () => {
          parentRef.current?.scrollTo({
            left: parentRef.current.scrollLeft - cellWidth * bufferDay,
          });
          scrollCallback.current = null;
        };
        setStartDate((date) => date?.add(bufferDay, 'day'));
        setEndDate((date) => date?.add(bufferDay, 'day'));
        return;
      }
    }
  }, [cellWidth, bufferDay]);

  const visibleHeaderGroups = table
    .getHeaderGroups()
    .slice(showYearRow ? 0 : 1);

  const leafHeaderGroup = visibleHeaderGroups[visibleHeaderGroups.length - 1];

  const headerHeight =
    visibleHeaderGroups.reduce((totalHeight, _headerGroup, index) => {
      const height =
        headerHeightOps?.[index] || headerHeightOps?.[0] || rowHeight;
      return totalHeight + height;
    }, 0) + (showAlert ? alertHeight : 0);

  const bodyVisibleHeight =
    (parentRef.current?.clientHeight ?? 0) - headerHeight;

  const ganttBodyHeight =
    rowVirtualizer.getTotalSize() + (hasLastGroupGap ? groupGap : 0);
  const scrollHeight = ganttBodyHeight + headerHeight;
  const scrollWidth = table
    .getHeaderGroups()[0]
    .headers.filter((header) => !grouping.includes(header.column.id))
    .reduce((total, cur) => total + cur.getSize(), 0);

  // useEffect(() => {
  //   const colMap = {};
  //   const idleMap = {};
  //   if (!!startDate && !!endDate && getAlertType) {
  //     for (
  //       let current = startDate;
  //       current?.diff(endDate, 'day') !== 0;
  //       current?.add(1, 'day')
  //     ) {
  //       const { type, data } =
  //         getAlertType.fn(current, rows, getAlertType.params) ?? {};
  //     }
  //   }
  // }, [startDate, endDate, getAlertType]);

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ position: 'fixed', color: 'red', zIndex: 99999 }}>
        {originStart?.format('YYYY-MM-DD')}::: {startDate?.format('YYYY-MM-DD')}{' '}
        :::
        {startDate?.diff(originStart, 'day')}:::
        {(startDate?.diff(originStart, 'day') ?? 0) * cellWidth}:::
        {viewportX}
      </div>
      {tableNode}
      <div
        ref={parentRef}
        className={['gantt-container', 'container', scrollSyncClassName].join(
          ' '
        )}
        style={style}
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
              display: 'flex',
              position: 'sticky',
              top: 0,
              zIndex: 3,
              flexDirection: 'column',
              // overflow: "hidden",
            }}
          >
            {visibleHeaderGroups.map((headerGroup, index) => {
              const height =
                headerHeightOps?.[index] || headerHeightOps?.[0] || rowHeight;
              return (
                <div
                  key={headerGroup.id}
                  // style={{ display: "flex", overflow: "hidden" }}
                  style={{ display: 'flex' }}
                >
                  {headerGroup.headers
                    .filter((header) => !grouping.includes(header.column.id))
                    .map((header, index) => {
                      const isLeafHeader = header.depth === 3;

                      return (
                        <div
                          key={header.id}
                          // colSpan={header.colSpan}
                          style={{
                            background: 'black',
                            color: 'white',
                            fontWeight: 'bolder',
                            width: header.getSize(),
                            height,
                            flexShrink: 0,
                            borderRight: '1px white solid',
                            borderBottom: !isLeafHeader
                              ? '1px white solid'
                              : 'unset',
                            zIndex: index,
                          }}
                        >
                          {header.isPlaceholder ? null : (
                            <div
                              style={
                                !isLeafHeader
                                  ? {
                                      position: 'sticky',
                                      left: 0,
                                      width: 0,
                                      whiteSpace: 'nowrap',
                                      height,

                                      overflow: 'visible',
                                    }
                                  : { height }
                              }
                            >
                              <div
                                style={{
                                  position: 'absolute',
                                  overflow: 'hidden',
                                  padding: '0 5px',
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
            {showAlert && (
              <div
                className="gantt-alert"
                style={{ height: alertHeight, display: 'flex', zIndex: 999 }}
              >
                {leafHeaderGroup?.headers
                  .filter((header) => !grouping.includes(header.column.id))
                  .map((header, index) => {
                    const date = dayjs(header.id);

                    const isCurrentDate =
                      currentAt?.format('YYYY-MM-DD') ===
                      date.format('YYYY-MM-DD');

                    const isModeLastDay =
                      mode === GanttCustomMode.CustomMode
                        ? getCustomModeLastDay?.(date, isWeekStartMonday) ??
                          false
                        : getIsModeLastDay(mode, date, isWeekStartMonday);
                    const dayLineTop =
                      headerHeightOps?.[headerHeightOps.length - 1] ||
                      headerHeightOps?.[0] ||
                      rowHeight;

                    const dayLineHeight = Math.max(
                      ganttBodyHeight,
                      bodyVisibleHeight
                    );

                    const { type, data } =
                      getAlertType.fn(date, rows, getAlertType.params) ?? {};

                    const alertOption = alertOptionMap[type];

                    const {
                      modeLastDayBorder,
                      component: AlertComponent,
                      ...rest
                    } = alertOption ?? {};

                    return (
                      <div
                        className={defaultAlertClassName}
                        key={header.id}
                        {...rest}
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          width: header.getSize(),
                          height: '100%',
                          // backgroundColor: "red",
                          // pointerEvents: "none",
                          // backgroundColor: 'red',
                          // zIndex: isCurrentDate ?  : -1,
                          zIndex: 888,
                          position: 'relative',
                          ...defaultAlertStyle,

                          borderRight: isModeLastDay
                            ? modeLastDayBorder ?? '1px solid black'
                            : 'unset',
                          ...rest.style,
                        }}
                      >
                        {AlertComponent && (
                          <AlertComponent
                            type={type}
                            date={date}
                            rows={rows}
                            data={data}
                          />
                        )}
                        {isCurrentDate && (
                          <>
                            <div
                              style={{
                                height: dayLineHeight,
                                width: 5,
                                backgroundColor: 'transparent',
                                position: 'absolute',
                                top: -dayLineTop,
                                display: 'flex',
                                justifyContent: 'start',
                                flexDirection: 'column',
                                alignItems: 'center',
                                cursor: 'pointer',
                              }}
                            >
                              <div
                                style={{
                                  background: '#5764F0',
                                  borderRadius: '100%',
                                  width: 6,
                                  height: 6,
                                  position: 'relative',
                                }}
                              ></div>
                              <div
                                style={{
                                  height: '100%',
                                  width: 2,
                                  backgroundColor: '#5764F0',
                                  position: 'absolute',
                                  display: 'flex',
                                  justifyContent: 'start',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                }}
                              ></div>
                            </div>
                            <div
                              style={{
                                color: 'lightblue',
                                position: 'absolute',
                                left: '100%',
                              }}
                            ></div>
                          </>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          <div
            className="gantt-flow"
            style={{
              position: 'absolute',
              display: 'flex',
              top: headerHeight,
              width: scrollWidth,
              height: Math.max(ganttBodyHeight, bodyVisibleHeight),
              zIndex: 2,
              backgroundColor: 'white',
              // pointerEvents: "none",
            }}
          >
            <GanttFlow
              renderEdgeDeleteTitle={renderEdgeDeleteTitle}
              nodes={nodes}
              setNodes={setNodes}
              cellWidth={cellWidth}
              nodeTypes={nodeTypes}
              originStartDate={originStart}
              onBarChange={onBarChange}
              edges={edges}
              setEdges={setEdges}
              onEdgesChange={onEdgesChange}
              onDisConnect={onDisConnect}
              onConnect={onConnect}
            >
              <div
                className="gantt-background"
                style={{
                  position: 'absolute',
                  display: 'flex',
                  // top: headerHeight,
                  width: scrollWidth,
                  height: Math.max(ganttBodyHeight, bodyVisibleHeight),
                  // height: 0,
                  zIndex: 3,
                  backgroundColor: 'white',
                  // pointerEvents: "none",
                }}
              >
                {leafHeaderGroup?.headers
                  .filter((header) => !grouping.includes(header.column.id))
                  .map((header, index) => {
                    const date = dayjs(header.id);
                    const dayNumber = date.get('day');
                    const isWeekend = dayNumber === 0 || dayNumber === 6;
                    const isRest = isHoliday ? isHoliday?.(date) : isWeekend;

                    const isCurrentDate =
                      currentAt?.format('YYYY-MM-DD') ===
                      date.format('YYYY-MM-DD');

                    return (
                      <div
                        key={header.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          width: header.getSize(),
                          height: '100%',
                          // backgroundColor: "red",
                          borderRight: '1px solid black',
                          // pointerEvents: "none",
                          backgroundColor: isRest ? '#acacac60' : 'white',
                          // zIndex: isCurrentDate ?  : -1,
                          zIndex: -1,
                          position: 'relative',
                        }}
                      ></div>
                    );
                  })}
              </div>
            </GanttFlow>
          </div>
        </div>
      </div>
    </div>
  );
};

const defaultProps: Partial<VirtualGanttProps> = {
  mode: GanttMode.MonthDay,
  bufferMonths: [2, 2],
  showYearRow: false,
  rowHeight: 34,
  overscan: 10,
  bufferDay: 20,
  cellWidth: 60,
  isInfiniteX: true,
  isWeekStartMonday: true,
  minBarRange: 1,
  headerHeight: [30],
  showAlert: true,
  headRender: {
    date: (date) => {
      return () => {
        const day = date.get('day');
        const dateStr = date.format('D');
        return (
          <div
            title={date.format('YYYY-MM-DD w')}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              whiteSpace: 'nowrap',
              padding: '0 5px',
            }}
          >
            <span>{dateStr}</span>
            <span>{WEEKDAY_MAP[day]}</span>
          </div>
        );
      };
    },
    month: (date) => {
      return () => {
        return date.format('YYYY年M月');
      };
    },
    week: (date, timezone) => {
      return () => {
        const end = date.add(6, 'day');
        const format =
          end.get('year') !== date.get('year') ? 'YYYY-MM-DD' : 'MM-DD';

        return (
          `${date.locale(timezone).weekYear()}年` +
          ' ' +
          `${date.locale(timezone).week()}周 ` +
          `${date.format(format)}~${date.add(6, 'day').format(format)}`
        );
      };
    },
  },
};

VirtualGanttComponent.defaultProps = defaultProps;

export const VirtualGantt = memo(VirtualGanttComponent);
