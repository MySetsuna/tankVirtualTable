/* eslint-disable @typescript-eslint/no-unused-vars */
import { Gantt, GroupOption } from '@/components/Gantt';
import React, { Key, useEffect, useRef, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { GanttMode } from '@/components/Gantt/components/VirtualGantt';
import {
  getBarEnd,
  getBarStart,
  getFrontLinkIds,
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
} from '@/model/pmstation/api-modules/art-task';
import { apiEditStory, apiEditTask } from '@/api/pmstation/art-task';
import { messageSuccess } from '@/components/message';
import { GroupedTable } from '@/components/grouped-table';
import {
  getDefaultColumns,
  getGanttDataSource,
  getGroupOptions,
  getGroupedDataSource,
} from './lib/common';
import { Resizable } from 're-resizable';
import { useGanttExpand } from '../gantt-expand-provider';

interface IProps {
  readonly tasks: IApiArtTask[];
  readonly stories: IApiArtStory[];
  readonly artPip?: IApiArtPip;
  readonly onListChange?: () => void;
  readonly grouping?: (keyof IApiArtTask)[];
  readonly isGroupView: boolean;
}

export const ArtPipGantt = (props: IProps) => {
  const {
    tasks,
    stories,
    artPip,
    onListChange,
    isGroupView,
    grouping = [],
  } = props;
  const groupGap = 10;
  const rowHeight = 38;
  const headerHeight = 30;

  const groupedTableRef = useRef<any>();

  const [ganttMode, setGanttMode] = React.useState<GanttMode>(
    GanttMode.WeekDay
  );

  const [groupOptions, setGroupOptions] = useState<GroupOption<IApiArtTask>[]>(
    []
  );

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
    apiEditTask({
      ...dataObject,
      artStoryId: Number(dataObject.artStoryId),
      projectId: artPip.projectId,
      artPipId: artPip?.artPipId,
      startAt: `${dataObject.startAt} 00:00:00`,
      endAt: `${dataObject.endAt} 00:00:00`,
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

  useEffect(() => {
    const groupOptions = getGroupOptions(
      stories,
      grouping.filter((groupKey) => !!groupKey),
      getBarStart,
      getBarEnd
    );
    setGroupOptions(groupOptions);
  }, [grouping, stories]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
          GanttBar={GanttBar}
          data={ganttData}
          rowHeight={rowHeight}
          groupGap={groupGap}
          isGroupView={isGroupView}
          selectDate={selectDate}
          ganttMode={ganttMode}
          groupOptions={groupOptions}
          getBarEnd={getBarEnd}
          getBarStart={getBarStart}
          getFrontLinkIds={getFrontLinkIds}
          getPostLinkIds={getPostLinkIds}
          getRowId={getRowId}
          headerHeight={[headerHeight]}
          scrollSyncClassName="ant-table-body"
          bufferMonths={[2, 2]}
          bufferDay={40}
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
                  columnWidth: 20,
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
