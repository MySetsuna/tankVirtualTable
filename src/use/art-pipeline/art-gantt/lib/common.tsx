import { IApiArtStory, IApiArtTask } from "../../../art-task";
import { TrademarkCircleOutlined } from "@ant-design/icons";
import { groupBy } from "lodash";
import { FixedType } from "rc-table/lib/interface";
import { Key } from "react";
import { Row } from "@tanstack/react-table";
import { Dayjs } from "dayjs";
import { GroupGanttBar } from "../group-gantt-bar";
import React from "react";
import { ITableDataItem } from "../../../../grouped-table/model";
import { GroupOption } from "../../../../Gantt";
import { getStartAndEnd } from "../../../../Gantt/utils";
import { GanttAlertOption } from "../../../../Gantt/components/VirtualGantt";
import { getBarEnd, getBarStart } from "../../../use-lib";

export enum StoryStatus {
  Finish = 'Finish',
  UnFinish = 'UnFinish',
}

export enum GanttAlertType {
  Available = 'Available',
  UnAvailable = 'UnAvailable',
}

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

export const ART_STORY_GROUP_ID = 'artStoryId';
export const ART_GROUP_PREFIX = 'group__';

export const getGroupOptions = (
  stories: IApiArtStory[],
  grouping: (keyof IApiArtTask)[],
  getStart: (t: IApiArtTask) => Dayjs | undefined,
  getEnd: (t: IApiArtTask) => Dayjs | undefined,
  defaultGroup: string,
  groupPrefix: string
): GroupOption<IApiArtTask>[] => {
  return [
    {
      groupId: `${groupPrefix}${defaultGroup ?? ART_STORY_GROUP_ID}`,
      groupKey: (task) => task.artStoryId || 0,
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
        groupId: `${groupPrefix}${key}`,
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
        key: `${ART_GROUP_PREFIX}${ART_STORY_GROUP_ID}:${story.artStoryId}`,
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
        key: `${ART_GROUP_PREFIX}${ART_STORY_GROUP_ID}:${0}`,
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

export const GANTT_ALERT_OPTION: GanttAlertOption<IApiArtTask> = {
  [GanttAlertType.Available]: {
    style: { background: '#4ABE79' },
    // component: AvailableGanttAlert,
    modeLastDayBorder: '#CDD6E4 solid 1px',
  },
  [GanttAlertType.UnAvailable]: {
    style: {
      background: '#F25757',
    },
    // component: ConflictGanttAlert,
    modeLastDayBorder: '#CDD6E4 solid 1px',
  },
};
export const isDateBetween = (
  date: Dayjs,
  start?: Dayjs,
  end?: Dayjs,
  defaultValue = false
) => {
  if (!end || !start) {
    return defaultValue;
  }
  return (
    (date.isSame(start, 'date') || date.isAfter(start, 'date')) &&
    (date.isSame(end, 'date') || date.isBefore(end, 'date'))
  );
};

export const getAlertType = (users: string[]) => {
  return {
    fn: (
      date: Dayjs,
      rows: Row<IApiArtTask>[],
      users: string[]
    ) => {
      const availableUserSet = new Set(users);
      const matchedTasks = rows.filter(({ original }) => {
        return isDateBetween(date, getBarStart(original), getBarEnd(original));
      });
      // const;
      return { type: GanttAlertType.Available as string, data: {} };
    },
    params: users,
  };
};
