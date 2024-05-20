/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { Key, useEffect, useMemo, useRef, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import {
  getBarEnd,
  getBarStart,
  getFrontLinkIds,
  getLeafRowOriginalId,
  getPostLinkIds,
  getRowId,
} from './lib/utils';
import { GanttBar } from './gantt-bar';
import {
  IApiArtPip,
  IApiArtStory,
  IApiArtStoryParams,
  IApiArtTask,
  IApiArtTaskParams,
} from '../../art-task';
import {
  ART_GROUP_PREFIX,
  ART_STORY_GROUP_ID,
  getAlertOptions,
  getDefaultColumns,
  getGanttDataSource,
  getGroupOptions,
  getGroupedDataSource,
} from './lib/common';
import { Resizable } from 're-resizable';
import { useGanttExpand } from '../gantt-expand-provider';
import { GanttMode } from '../../../Gantt/components/VirtualGantt';
import { Gantt, GanttNode, GroupOption } from '../../../Gantt';
import { GroupedTable } from '../../../grouped-table';
import { ScrollSync, ScrollSyncNode } from 'scroll-sync-react';
import { isEmpty } from 'lodash';

interface IProps {
  readonly tasks: IApiArtTask[];
  readonly stories: IApiArtStory[];
  readonly artPip?: IApiArtPip;
  readonly onListChange?: () => void;
  readonly grouping?: (keyof IApiArtTask)[];
  readonly isGroupView: boolean;
  readonly setTasks: React.Dispatch<React.SetStateAction<IApiArtTask[]>>;
}

export const ArtPipGantt = (props: IProps) => {
  const {
    tasks,
    stories,
    artPip,
    onListChange,
    setTasks,
    isGroupView,
    grouping = [],
  } = props;
  const groupGap = 10;
  const rowHeight = 38;
  const headerHeight = 30;

  const users = ['用户3', '用户4', '用户5', '用户6'];

  const groupedTableRef = useRef<any>();

  const [ganttMode, setGanttMode] = React.useState<GanttMode>(
    GanttMode.WeekDay
  );

  const [groupOptions, setGroupOptions] = useState<GroupOption<IApiArtTask>[]>(
    []
  );

  const ganttAletOptions = useMemo(() => {
    return getAlertOptions(users, tasks);
  }, [users, tasks]);

  const [
    expandKeys,
    setExpandKeys,
    _expandedModuleIdx,
    setExpandedModuleIdx,
    _callback,
    setCallback,
  ] = useGanttExpand();

  const [selectedRowKeys, setSelectedRowKeys] = useState<Array<Key>>([]);

  const [selectDate, setSelectDate] = React.useState<Dayjs>(dayjs());

  const onCreateTask = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!artPip) return;
    const formData = new FormData(event.target as HTMLFormElement);

    const dataObject = Object.fromEntries(formData);

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  };

  const onCreateStory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!artPip) return;
    const formData = new FormData(event.target as HTMLFormElement);

    const dataObject = Object.fromEntries(formData);

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  };

  const groupedDataSource = getGroupedDataSource(stories, tasks, true, []);

  useEffect(() => {
    const groupedDataSource = getGroupedDataSource(stories, tasks, true, []);
    if (groupedTableRef.current?.setExpandModuleIndex) {
      setCallback({
        modules(ids) {
          const idx = ids.map((id) =>
            groupedDataSource.findIndex(({ artStoryId }) => artStoryId === id)
          );
          groupedTableRef.current?.setExpandModuleIndex(idx);
        },
      });
    }
  }, [groupedTableRef.current?.setExpandModuleIndex, tasks, stories]);

  const columns = getDefaultColumns();

  const scrollX = columns.reduce(
    (totalWidth, { width }) => width + totalWidth,
    0
  );

  const ganttData = getGanttDataSource(stories, tasks).sort(
    (a, b) => a.artStoryId - b.artStoryId
  );

  const onChange = (selectedRowKeys: React.Key[], selectedRows: any) => {
    setSelectedRowKeys(selectedRowKeys);
  };

  const onBarChange = (
    startAt: dayjs.Dayjs,
    endAt: dayjs.Dayjs,
    node: GanttNode<IApiArtTask>
  ) => {
    setTasks((tasks) => {
      return tasks.map((task) => {
        const changeTask = node.data.row.original;
        if (task.artTaskId === changeTask.artTaskId) {
          return {
            ...task,
            startAt: startAt.format('YYYY-MM-DD'),
            endAt: endAt.format('YYYY-MM-DD'),
          };
        }
        return task;
      });
    });
  };

  const ganttExpanded = useMemo(() => {
    const expandMap: { [expandKey: string]: true } = {};
    const groupKeys = groupOptions?.map(({ groupId }) => groupId) ?? [];
    if (isEmpty(groupKeys)) return expandMap;
    expandKeys.forEach((id) => {
      expandMap[`${ART_GROUP_PREFIX}${ART_STORY_GROUP_ID}:${id}` as string] =
        true;
    });
    return expandMap;
  }, [expandKeys, groupOptions]);

  useEffect(() => {
    const groupOptions = getGroupOptions(
      stories,
      grouping.filter((groupKey) => !!groupKey),
      getBarStart,
      getBarEnd,
      ART_STORY_GROUP_ID,
      ART_GROUP_PREFIX
    );
    setGroupOptions(groupOptions);
  }, [grouping, stories]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {users.join('!!!')}
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
          alertOptions={ganttAletOptions}
          GanttBar={GanttBar}
          data={ganttData}
          rowHeight={rowHeight}
          groupGap={groupGap}
          isGroupView={isGroupView}
          ganttExpanded={ganttExpanded}
          currentAt={selectDate}
          mode={ganttMode}
          groupOptions={groupOptions}
          getBarEnd={getBarEnd}
          getBarStart={getBarStart}
          getFromLinkIds={getFrontLinkIds}
          getToLinkIds={getPostLinkIds}
          getRowId={getRowId}
          getLeafRowOriginalId={getLeafRowOriginalId}
          headerHeight={[headerHeight]}
          scrollSyncClassName="ant-table-body"
          bufferMonths={[2, 2]}
          bufferDay={40}
          onBarChange={(startAt, endAt, node) => {
            onBarChange(startAt, endAt, node);
          }}
          style={{
            position: 'relative',
            overflow: 'auto',
            width: 1200,
            height: 700,
            flex: 'auto',
          }}
          table={
            <Resizable defaultSize={{ height: 700, width: 300 }}>
              <GroupedTable
                columns={columns}
                onHeaderRow={() => {
                  return {
                    height: headerHeight * 2,
                  };
                }}
                virtual={false}
                ref={groupedTableRef}
                dataSource={groupedDataSource}
                rowSelection={{
                  columnWidth: 30,
                  type: 'checkbox',
                  selectedRowKeys,
                  onChange,
                  getCheckboxProps: (record: any) => ({
                    disabled: record.name === 'Disabled User', // Column configuration not to be checked
                    name: record.name,
                  }),
                }}
                expandable={{
                  expandedRowKeys: expandKeys,
                  onExpandedRowsChange: (expandKeys: ReadonlyArray<Key>) => {
                    setExpandKeys(expandKeys.slice());
                  },
                }}
                onModuleExpandChange={(idx) => {
                  const ids = idx.map(
                    (index) => groupedDataSource[index]?.artStoryId
                  );
                  setExpandKeys(ids);
                  setExpandedModuleIdx(ids);
                }}
                rowClassName={'123'}
                bordered
                filters={[]}
                pagination={false}
                scroll={{ x: scrollX, y: 700 - 60 }}
              />
            </Resizable>
          }
        />
      </div>
    </div>
  );
};
