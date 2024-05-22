import { Gantt, GanttNode, GroupOption } from '@/components/Gantt';
import React, {
  Dispatch,
  Key,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import dayjs, { Dayjs } from 'dayjs';
import {
  getBarEnd,
  getBarStart,
  getFromLinkIds,
  getLeafRowOriginalId,
  getRowId,
  getToLinkIds,
} from './lib/utils';
import { GanttBar } from './gantt-bar';
import {
  IApiArtPip,
  IApiArtStory,
  IApiArtStoryParams,
  IApiArtTask,
  IApiArtTaskParams,
} from '@/model/pmstation/api-modules/art-task';
import { apiEditStory, apiEditTask } from '@/api/pmstation/art-task';
import { messageError, messageSuccess } from '@/components/message';
import { GroupedTable } from '@/components/grouped-table';
import {
  ART_GROUP_PREFIX,
  ART_STORY_GROUP_ID,
  GanttAlertType,
  getAlertOptions,
  getDefaultColumns,
  getGanttDataSource,
  getGroupOptions,
  getGroupedDataSource,
} from './lib/common';
import { Resizable } from 're-resizable';
import { useGanttUpdater } from '../gantt-updater-provider';
import { Connection } from 'reactflow';
import { debounce, isEmpty, omit, throttle, uniq } from 'lodash';
import styles from './index.module.scss';
import { EdgeDeleteTitle } from './edge-delete-title';
import AddCircleIcon from '@/assets/svg/add-circle-icon.svg?react';
import {
  GanttMode,
  GanttOnDayCell,
} from '@/components/Gantt/components/VirtualGantt';
import { PortalFragment } from '@/components/portal-fragment';
import { Button, Space } from 'antd';

type CreatorOptions = {
  top?: number;
  left?: number;
  visible?: boolean;
  rowId?: string;
  confirming?: boolean;
  virtualIndex?: number;
  date?: Dayjs;
};

interface IProps {
  readonly tasks: IApiArtTask[];
  readonly stories: IApiArtStory[];
  readonly artPip?: IApiArtPip;
  readonly onListChange?: () => void;
  readonly grouping?: (keyof IApiArtTask)[];
  readonly isGroupView: boolean;
  readonly setTasks: Dispatch<SetStateAction<IApiArtTask[]>>;
  readonly setStories: Dispatch<SetStateAction<IApiArtStory[]>>;
  readonly defaultGroup?: string;
  readonly groupPrefix?: string;
  readonly users?: string[];
  readonly userRoles?: {
    user: string;
    role: string;
  }[];
}

export const ArtPipGantt = (props: IProps) => {
  const {
    tasks,
    stories,
    artPip,
    onListChange,
    isGroupView,
    grouping = [],
    defaultGroup = ART_STORY_GROUP_ID,
    groupPrefix = ART_GROUP_PREFIX,
    setTasks,
    users = [],
    userRoles = [],
  } = props;
  const groupGap = 10;
  const rowHeight = 40;
  const headerHeight = 30;
  const alertHeight = 16;
  const tableHeight = headerHeight * 2 + alertHeight;
  const ganttHeight = 700;

  const groupedTableRef = useRef<any>();

  const [ganttMode, setGanttMode] = React.useState<GanttMode>(
    GanttMode.WeekDay
  );

  const [groupOptions, setGroupOptions] = useState<GroupOption<IApiArtTask>[]>(
    []
  );

  const {
    expandKeys,
    setExpandKeys,
    setExpandCallback: setCallback,
    isHoliday,
    mouseCreatorRef,
  } = useGanttUpdater();

  const [selectedRowKeys] = useState<Array<Key>>([]);

  const [selectDate, setSelectDate] = React.useState<Dayjs>(dayjs());
  const [groupedDataSource, setGroupedDataSource] = useState<any>([]);
  const [ganttData, setGanttData] = useState<(IApiArtTask | IApiArtStory)[]>(
    []
  );
  const [creatorOptions, setCreatorOptions] = useState<CreatorOptions>({});

  const [mask, setMask] = useState<boolean>(false);

  const ganttAlertOptions = useMemo(() => {
    return getAlertOptions(users, tasks, userRoles);
  }, [users, tasks, userRoles]);

  const ganttExpanded = useMemo(() => {
    const expandMap: { [expandKey: string]: true } = {};

    const groupKeys = groupOptions?.map(({ groupId }) => groupId) ?? [];
    if (isEmpty(groupKeys)) return expandMap;
    expandKeys.forEach((id) => {
      expandMap[id] = true;
    });
    return expandMap;
  }, [expandKeys, groupOptions]);

  const onCreateTask = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!artPip) return;
    const formData = new FormData(event.target as HTMLFormElement);

    const dataObject = Object.fromEntries(formData);

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    apiEditTask({
      ...dataObject,
      artStoryId: Number(dataObject.artStoryId),
      projectId: artPip.projectId,
      artPipId: artPip?.artPipId,
      startAt: dataObject.startAt ? `${dataObject.startAt} 00:00:00` : null,
      endAt: dataObject.endAt ? `${dataObject.endAt} 00:00:00` : null,
      progress: Number(dataObject.progress),
      effort: Number(dataObject.effort),
      artCategory: '-1',
    } as IApiArtTaskParams).then((result) => {
      if (result?.artTaskId) {
        messageSuccess(`任务：${dataObject.title} 创建成功`);
        onListChange?.();
      }
    });
  };

  const onEditTask = async (task: IApiArtTask, oldTask: IApiArtTask) => {
    setTasks((tasks) =>
      tasks.map((item) => {
        return task.artTaskId === item.artTaskId ? task : item;
      })
    );
    const result = await apiEditTask(omit(task, '_depth', '_parent', '_type'));
    if (!result?.artTaskId) {
      // 日期修改失败
      messageError('任务日期修改失败');
      setTasks((tasks) =>
        tasks.map((item) => {
          return task.artTaskId === item.artTaskId ? oldTask : item;
        })
      );
    }
    return !!result?.artTaskId;
  };

  const onCreateStory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!artPip) return;
    const formData = new FormData(event.target as HTMLFormElement);

    const dataObject = Object.fromEntries(formData);

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const result = await apiEditStory({
      ...dataObject,
      projectId: artPip.projectId,
      artPipId: artPip?.artPipId,
    } as IApiArtStoryParams);
    if (result?.artStoryId) {
      messageSuccess(`需求：${dataObject.title} 创建成功`);
      onListChange?.();
    }
  };

  useEffect(() => {
    const groupedDataSource = getGroupedDataSource(stories, tasks);
    const ganttData = getGanttDataSource(stories, tasks).sort(
      (a, b) => a.artStoryId - b.artStoryId
    );
    setGroupedDataSource(groupedDataSource);
    setGanttData(ganttData);
    if (groupedTableRef.current?.setExpandModuleIndex) {
      setCallback({
        modules(ids) {
          groupedTableRef.current?.setExpandModuleKey(ids);
        },
      });
    }
  }, [groupedTableRef.current?.setExpandModuleIndex, tasks, stories]);

  const columns = getDefaultColumns();

  const scrollX = columns.reduce(
    (totalWidth, { width }) => width + totalWidth,
    0
  );

  // const onChange = (selectedRowKeys: React.Key[], selectedRows: any) => {
  //   setSelectedRowKeys(selectedRowKeys);
  // };

  const onBarChange = (
    startAt: Dayjs,
    endAt: Dayjs,
    node: GanttNode<IApiArtTask> | IApiArtTask,
    callback?: () => void
  ) => {
    let task: IApiArtTask | undefined;
    let nd: GanttNode<IApiArtTask> | undefined;
    if (Reflect.has(node, 'artTaskId')) {
      task = node as IApiArtTask;
    } else if (Reflect.has(node, 'position')) {
      nd = node as GanttNode<IApiArtTask>;
      task = nd.data?.row?.original;
    }
    console.log(nd?.data?.creating, nd, '***********');

    if (nd?.data?.creating || !task) return;
    onEditTask(
      {
        ...task,
        startAt: startAt.format('YYYY-MM-DD 00:00:00'),
        endAt: endAt.format('YYYY-MM-DD 00:00:00'),
      },
      { ...task }
    ).then(() => {
      callback?.();
    });
  };

  const onConnect = (connection: Connection) => {
    const fromId = connection.source;
    const toId = connection.target;
    const fromTask = tasks.find(({ artTaskId }) => `${artTaskId}` === fromId);
    const toTask = tasks.find(({ artTaskId }) => `${artTaskId}` === toId);
    let toConnected: boolean | Promise<boolean> = false;
    if (!!toTask && !!fromTask && toTask.artStoryId === fromTask.artStoryId) {
      toConnected = new Promise((resolve) => {
        Promise.all([
          onEditTask(
            {
              ...fromTask,
              toDependIds: uniq([...fromTask.toDependIds, Number(toId)]),
            },
            { ...fromTask }
          ),
          onEditTask(
            {
              ...toTask,
              fromDependIds: uniq([...toTask.fromDependIds, Number(fromId)]),
            },
            { ...toTask }
          ),
        ]).then((resultList) => {
          if (resultList.every((item) => !!item)) {
            console.log(777);

            return resolve(true);
          }
          return resolve(false);
        });
      });
    }
    return toConnected;
  };

  const onDisConnect = (fromId: string, toId: string) => {
    const fromTask = tasks.find(({ artTaskId }) => `${artTaskId}` === fromId);
    const toTask = tasks.find(({ artTaskId }) => `${artTaskId}` === toId);
    if (!!toTask && !!fromTask) {
      onEditTask(
        {
          ...fromTask,
          toDependIds: fromTask.toDependIds.filter((id) => id !== Number(toId)),
        },
        { ...fromTask }
      );
      onEditTask(
        {
          ...toTask,
          fromDependIds: toTask.fromDependIds.filter(
            (id) => id !== Number(fromId)
          ),
        },
        { ...toTask }
      );
    }
  };

  const openCreateBntFn = useMemo(
    () =>
      debounce((props: CreatorOptions) => {
        setCreatorOptions(props);
      }, 300),
    []
  );

  const onDayCell: GanttOnDayCell<IApiArtTask> = (
    date,
    rows,
    rowVirtualizer,
    resizeLeafNode,
    getNode
  ) => {
    const getRowData = (event: React.MouseEvent<HTMLDivElement>) => {
      const element = event.target as HTMLDivElement;
      const clientRect = element.getBoundingClientRect();

      const virtualItem = rowVirtualizer.getVirtualItemForOffset(
        event.clientY - clientRect.top
      );
      const row = rows[virtualItem.index];
      const start = getBarStart(row.original);
      const end = getBarEnd(row.original);
      return { row, start, end, virtualItem, clientRect };
    };
    const onMouseDown = debounce((event: React.MouseEvent<HTMLDivElement>) => {
      console.log(
        mouseCreatorRef.current.isQuackCreating,
        'mouseCreatorRef.current.isQuackCreating'
      );

      if (mouseCreatorRef.current.isQuackCreating) return;
      const { start, end, row, virtualItem, clientRect } = getRowData(event);
      if (start || end) return;
      if (!mouseCreatorRef.current.resizing) {
        mouseCreatorRef.current = {
          ...mouseCreatorRef.current,
          resizing: true,
        };
        setCreatorOptions((item) => ({
          ...item,
          visible: false,
          left: clientRect.left,
          date,
          rowId: getLeafRowOriginalId(row),
          top: clientRect.top + virtualItem.start,
          virtualIndex: rowVirtualizer
            .getVirtualItems()
            .findIndex(({ start }) => start === virtualItem.start),
        }));

        // todo debounce create bar
        setMask(true);
        const moveFn = (evt: MouseEvent) => {
          const width = evt.clientX - event.clientX + 60 * 0.6;

          // onNodesChange([
          //   {
          //     id,
          //     type: 'dimensions',
          //     dimensions: {
          //       width: evt.clientX - event.clientX + 60,
          //       height: node?.height ?? virtualRow.size,
          //     },
          //   },
          // ]);
          resizeLeafNode(row.id, width, date, virtualItem);
        };
        const endFn = () => {
          setMask(false);
          document.removeEventListener('mousemove', moveFn);
          mouseCreatorRef.current = {
            ...mouseCreatorRef.current,
            resizing: false,
          };
          const id = getLeafRowOriginalId(row);
          const node = getNode(id) as GanttNode<IApiArtTask>;
          console.log(node);

          if (node.data.startAt && node.data.endAt) {
            console.log(88888888888);

            onBarChange?.(
              node.data.startAt ?? date,
              node.data.endAt ?? date,
              {
                ...node,
                data: { ...(node.data ?? {}), creating: false },
              },
              () => {
                if (mouseCreatorRef.current.endFn) {
                  console.log(2222);

                  document.removeEventListener(
                    'click',
                    mouseCreatorRef.current.endFn
                  );
                }
              }
            );
          }
          setCreatorOptions((item) => ({
            ...item,
            visible: false,
            top: 0,
            left: 0,
            confirming: false,
          }));
          // 进行保存
        };
        mouseCreatorRef.current = {
          rowId: row.original.artTaskId,
          moveFn,
          endFn,
        };
        document.addEventListener('mousemove', moveFn);
        document.addEventListener('click', endFn);
      } else {
        console.log(creatorOptions.date, date);
        if (mouseCreatorRef.current.moveFn)
          document.removeEventListener(
            'mousemove',
            mouseCreatorRef.current?.moveFn
          );

        setCreatorOptions((item) => ({
          ...item,
          visible: false,
          top: 0,
          left: 0,
          confirming: true,
        }));
        // 创建
      }

      // document.addEventListener('mouseup', mouseCreatorRef.current.endFn);
    }, 300);
    return {
      onMouseDown,
      onDoubleClick: (event: React.MouseEvent<HTMLDivElement>) => {
        setCreatorOptions((item) => ({
          ...item,
          visible: false,
          top: 0,
          left: 0,
          confirming: false,
        }));
        mouseCreatorRef.current = {
          ...mouseCreatorRef.current,
          isQuackCreating: true,
        };
        if (mouseCreatorRef.current.moveFn)
          document.removeEventListener(
            'mousemove',
            mouseCreatorRef.current?.moveFn
          );
        const { row, start, end } = getRowData(event);

        if (!start && !end) {
          let diff =
            row.original.effort < 0 || !row.original.effort
              ? 1
              : row.original.effort || 1;
          let defaultEndAt = date.add(diff, 'day');
          console.log(diff, 'diff0');
          for (
            let cur = date;
            cur.isBefore(defaultEndAt, 'date');
            cur = cur.add(1, 'day')
          ) {
            if (isHoliday(cur)) {
              defaultEndAt = defaultEndAt.add(1, 'day');
            }
          }
          onBarChange?.(date, defaultEndAt.add(-1, 'day'), row.original, () => {
            mouseCreatorRef.current = {
              ...mouseCreatorRef.current,
              isQuackCreating: false,
            };
          });
        }
      },
      onMouseMove: (event: React.MouseEvent<HTMLDivElement>) => {
        if (mouseCreatorRef.current?.resizing || creatorOptions.confirming) {
          return;
        }
        const { start, end, row, virtualItem, clientRect } = getRowData(event);
        if (!start && !end && !row.groupingColumnId) {
          document.body.style.cursor = 'pointer';
          openCreateBntFn({
            visible: true,
            top: clientRect.top + virtualItem.start,
            left: clientRect.left,
          });
        } else {
          openCreateBntFn.cancel();
          setCreatorOptions({ visible: false, top: 0, left: 0 });
        }
      },
      onMouseOut: () => {
        if (mouseCreatorRef.current?.resizing || creatorOptions.confirming) {
          return;
        }
        openCreateBntFn.cancel();
        setCreatorOptions({ visible: false, top: 0, left: 0 });
      },
    };
  };

  useEffect(() => {
    const groupOptions = getGroupOptions(
      stories,
      grouping.filter((groupKey) => !!groupKey),
      getBarStart,
      getBarEnd,
      defaultGroup,
      groupPrefix
    );
    setGroupOptions(groupOptions);
  }, [grouping, stories, groupPrefix, defaultGroup]);

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      className={styles.ganttPipeline}
    >
      <div>
        <div style={{ height: 140, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <form
            onSubmit={onCreateTask}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 5,
            }}
          >
            <div>
              <label>任务标题</label>
              <input name="title" />
            </div>
            <div>
              <label>开始时间</label>
              <input name="startAt" type="date" />
            </div>
            <div>
              <label>结束时间</label>
              <input name="endAt" type="date" />
            </div>
            <div>
              <label>任务进度</label>
              <input
                name="progress"
                type="range"
                max={100}
                min={0}
                defaultValue={0}
              />
            </div>
            <div>
              <label>父需求</label>
              <select name="artStoryId">
                {stories.map((story) => {
                  return (
                    <option key={story.artStoryId} value={story.artStoryId}>
                      {story.title}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label>工时</label>
              <input name="effort" type="number" />
            </div>
            <div>
              <label>处理人</label>
              <input name="handler" type="string" />
            </div>
            <div>
              <label>状态</label>
              <input name="status" type="string" />
            </div>
            <div>
              <label>TAPD STORY ID</label>
              <input name="tapdStoryId" />
            </div>
            <button type="submit">创建任务</button>
          </form>
          <hr style={{ width: '100%' }} />
          <form
            onSubmit={onCreateStory}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 5,
            }}
          >
            <div>
              <label>需求标题</label>
              <input name="title" />
            </div>
            <div>
              <label>TAPD STORY ID</label>
              <input name="tapdStoryId" />
            </div>
            <button type="submit">创建需求</button>
          </form>
          <hr style={{ width: '100%' }} />
        </div>
        <select
          value={ganttMode}
          onChange={(event) => {
            setGanttMode(Number(event.target.value));
          }}
        >
          <option value={GanttMode.MonthDay}>日</option>
          <option value={GanttMode.WeekDay}>周</option>
        </select>
        <input
          type="date"
          value={selectDate.format('YYYY-MM-DD')}
          onChange={(event) => {
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
      </div>
      <div style={{ flex: 'auto', height: 0 }}>
        <Gantt
          alertOptions={ganttAlertOptions}
          GanttBar={GanttBar}
          data={ganttData}
          rowHeight={rowHeight}
          groupGap={groupGap}
          ganttExpanded={ganttExpanded}
          isGroupView={isGroupView}
          currentAt={selectDate}
          mode={ganttMode}
          groupOptions={groupOptions}
          getBarEnd={getBarEnd}
          getBarStart={getBarStart}
          getToLinkIds={getToLinkIds}
          getFromLinkIds={getFromLinkIds}
          getRowId={getRowId}
          getLeafRowOriginalId={getLeafRowOriginalId}
          headerHeight={[headerHeight]}
          alertHeight={alertHeight}
          scrollSyncElementQuery="div.ant-table-body"
          scrollSyncClassName="ant-table-body"
          bufferMonths={[1, 1]}
          bufferDay={20}
          overscan={20}
          onBarChange={onBarChange}
          onConnect={onConnect}
          onDisConnect={onDisConnect}
          hasLastGroupGap
          isHoliday={isHoliday}
          renderEdgeDeleteTitle={EdgeDeleteTitle}
          onDayCell={onDayCell}
          defaultAlertStyle={{
            background: 'white',
            borderBottom: '#CDD6E4 solid 1px',
          }}
          style={{
            position: 'relative',
            overflow: 'auto',
            width: 1200,
            height: ganttHeight,
            flex: 'auto',
          }}
          table={
            <Resizable
              defaultSize={{ height: ganttHeight, width: 300 }}
              minWidth={150}
              maxWidth={'80vw'}
              enable={{ right: true }}
              handleClasses={{
                right: styles.resizeLeftHandle,
              }}
            >
              <GroupedTable
                className="gantt-container"
                columns={columns}
                onHeaderRow={() => {
                  return {
                    height: tableHeight,
                  };
                }}
                virtual={false}
                ref={groupedTableRef}
                dataSource={groupedDataSource}
                onRow={(props) => {
                  return {
                    style: {
                      height: props._type === 'tr-empty' ? groupGap : rowHeight,
                    },
                  };
                }}
                rowSelection={{
                  columnWidth: 20,
                  type: 'checkbox',
                  selectedRowKeys,
                  // onChange,
                  getCheckboxProps: (record: any) => ({
                    disabled: record.name === 'Disabled User', // Column configuration not to be checked
                    name: record.name,
                  }),
                }}
                moduleConfig={{
                  onModuleExpand: (idx) => {
                    setExpandKeys(idx.map((item) => item.key));
                  },
                }}
                rowClassName={'123'}
                bordered
                // filters={[]}
                pagination={false}
                scroll={{ x: scrollX, y: ganttHeight - tableHeight }}
              />
            </Resizable>
          }
        />
      </div>
      {creatorOptions.visible && (
        <div
          style={{
            position: 'fixed',
            zIndex: 9999,
            top: creatorOptions.top,
            left: creatorOptions.left,
            padding: 6,
            pointerEvents: 'none',
          }}
        >
          <Button
            type="primary"
            ghost
            style={{ width: 72, background: 'white', padding: 4 }}
          >
            <Space size={5}>
              <AddCircleIcon width={12} height={12} />
              <span>创建排期</span>
            </Space>
          </Button>
        </div>
      )}
      {mask && (
        <PortalFragment>
          <div
            style={{
              position: 'fixed',
              height: '100vh',
              width: '100vw',
              top: 0,
              left: 0,
              cursor: 'ew-resize',
              zIndex: 999999,
            }}
          ></div>
        </PortalFragment>
      )}
    </div>
  );
};
