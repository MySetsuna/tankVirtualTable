import { GroupOption } from '@/components/Gantt';
import { ITableDataItem } from '@/components/grouped-table/model';
import {
  IApiArtStory,
  IApiArtTask,
} from '@/model/pmstation/api-modules/art-task';
import { TrademarkCircleOutlined } from '@ant-design/icons';
import { groupBy } from 'lodash';
import { FixedType } from 'rc-table/lib/interface';
import { Key } from 'react';
import { Row } from '@tanstack/react-table';
import { Dayjs } from 'dayjs';
import { getStartAndEnd } from '@/components/Gantt/components/VirtualGantt/utils';
import { GroupGanttBar } from '../group-gantt-bar';

export const getDefaultColumns = () => {
  return [
    {
      dataIndex: 'title',
      key: 'artStoryId',
      title: (
        <>
          <TrademarkCircleOutlined />
          标题
        </>
      ),
      width: 150,
      fixed: 'left' as FixedType,
      render: (text: string, row: ITableDataItem) => {
        return row?.isAdd ? (
          <a onClick={() => alert('add clicked')}>add</a>
        ) : (
          text
        );
      },
      ellipsis: true,
    },
    {
      dataIndex: 'startAt',
      title: '开始时间',
      width: 100,
      render: (text: string) => {
        return text;
      },
      ellipsis: true,
    },
    {
      dataIndex: 'endAt',
      title: '结束时间',
      width: 100,
      render: (text: string) => {
        return text;
      },
      ellipsis: true,
    },
  ];
};

export const ART_STORY_GROUP_ID = 'group__artStoryId';

export const getGroupOptions = (
  stories: IApiArtStory[],
  grouping: (keyof IApiArtTask)[],
  getStart: (t: IApiArtTask) => Dayjs | undefined,
  getEnd: (t: IApiArtTask) => Dayjs | undefined
): GroupOption<IApiArtTask>[] => {
  return [
    {
      groupId: ART_STORY_GROUP_ID,
      groupKey: (task) => task.artStoryId,
      groupHeaderBuilder(row: Row<IApiArtTask>) {
        const { startAt, endAt } = getStartAndEnd(
          row.getLeafRows(),
          getStart,
          getEnd
        );
        const story = stories.find(
          (story) => story.artStoryId === row.original.artStoryId
        ) ?? { title: '未分类', artStoryId: 0 };
        return {
          id: story.artStoryId,
          data: story,
          startAt,
          endAt,
        };
      },
      groupGanttComponent: GroupGanttBar,
      isFixedX: true,
    },
    ...grouping.map<GroupOption<IApiArtTask>>((key) => {
      return {
        groupId: `group__${key}`,
        groupKey: (task) => task[key].toString(),
        groupHeaderBuilder(row: Row<IApiArtTask>) {
          const { startAt, endAt } = getStartAndEnd(
            row.getLeafRows(),
            getStart,
            getEnd
          );
          return {
            id: row.original[key].toString(),
            data: row,
            startAt,
            endAt,
          };
        },
        groupGanttComponent: GroupGanttBar,
        isFixedX: true,
      };
    }),
  ];
};

export const getGroupedDataSource = (
  stories: IApiArtStory[],
  tasks: IApiArtTask[],
  isDefaultExpandAll?: boolean,
  defaultExpandKeys?: ReadonlyArray<Key>
) => {
  const groupTask = groupBy(tasks, (task) => task.artStoryId);
  return stories
    .map((story) => {
      return {
        ...story,
        enableExpand: true,
        defaultExpand: isDefaultExpandAll
          ? true
          : defaultExpandKeys?.includes(story.artStoryId),
        dataSource: groupTask[story.artStoryId] ?? [],
      };
    })
    .concat([
      {
        title: '未分类',
        artStoryId: 0,
        createdAt: '2222-12-12',
        enableExpand: true,
        defaultExpand: isDefaultExpandAll
          ? true
          : defaultExpandKeys?.includes(0),
        dataSource: groupTask['0'] ?? [],
      },
    ] as any[])
    .sort((a, b) => a.artStoryId - b.artStoryId);
};

export const getGanttDataSource = (
  stories: IApiArtStory[],
  tasks: IApiArtTask[]
) => {
  const storyMap = new Map<number, IApiArtStory>();
  stories.forEach((story) => storyMap.set(story.artStoryId, story));
  tasks.forEach((task) => {
    storyMap.delete(task.artStoryId);
  });
  return Array.from<IApiArtStory | IApiArtTask>(storyMap.values())
    .map((story) => story)
    .concat(tasks)
    .sort((a, b) => a.artStoryId - b.artStoryId);
};
