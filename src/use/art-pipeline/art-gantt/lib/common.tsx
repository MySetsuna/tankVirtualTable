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
import dayjs, { Dayjs } from 'dayjs';
import { getStartAndEnd } from '@/components/Gantt/utils';
import { GroupGanttBar } from '../group-gantt-bar';
import { getBarEnd, getBarStart, isDateBetween } from './utils';
import {
  AnyObject,
  GanttAlertOptions,
} from '@/components/Gantt/components/VirtualGantt';
import { GanttAlert } from '../gantt-alert';

export enum StoryStatus {
  Finish = 'Finish',
  UnFinish = 'UnFinish',
}

export enum GanttAlertType {
  Available = 'Available',
  UnAvailable = 'UnAvailable',
  Normal = 'Normal',
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
    {
      dataIndex: 'effort',
      title: '工时人天',
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

type DayAlertMap = {
  user: {
    [user: string]: GanttAlertType;
  };
  conflictIds: IApiArtTask['artTaskId'][];
  type: GanttAlertType;
};

export type UserRole = {
  user: string;
  role: string;
};

export type AlertMap = {
  [date: string]: DayAlertMap;
};

export const getAlertOptions = (
  users: string[],
  tasks: IApiArtTask[],
  userRoles: UserRole[]
): GanttAlertOptions<
  IApiArtTask,
  AlertMap,
  GanttAlertType,
  { userRoles: UserRole[]; users: string[] }
> => {
  return {
    getAlertMap: (start: Dayjs, end: Dayjs): AlertMap => {
      const alertMap: AlertMap = {};
      const defaultUserAlertMap = users.reduce((map, user) => {
        return Object.assign(map, { [user]: GanttAlertType.Available });
      }, {});
      for (
        let current = start;
        current.startOf('date').valueOf() <= end.startOf('date').valueOf();
        current = current.add(1, 'day')
      ) {
        const conflictSet = new Set<number>();
        const dateAlertMap: DayAlertMap = {
          user: { ...defaultUserAlertMap },
          conflictIds: [],
          type: GanttAlertType.Available,
        };
        const currentMatchedTasks = tasks.filter((task) => {
          return isDateBetween(current, getBarStart(task), getBarEnd(task));
        });
        const usersSet = new Set<string>();
        const preTaskIdMap: AnyObject = {};
        currentMatchedTasks.forEach((task) => {
          const { handler } = task;
          if (!handler) return;
          if (
            !Reflect.has(dateAlertMap.user, handler) ||
            dateAlertMap.user[handler] === GanttAlertType.Available
          ) {
            dateAlertMap.user[handler] = GanttAlertType.Normal;
            if (
              users.includes(handler)
              // &&
              // dateAlertMap.type !== GanttAlertType.UnAvailable
            ) {
              if (!usersSet.has(handler)) {
                usersSet.add(handler);
                if (usersSet.size === users.length) {
                  dateAlertMap.type = GanttAlertType.Normal;
                }
              } else {
                dateAlertMap.type = GanttAlertType.UnAvailable;
                conflictSet.add(task.artTaskId);
                conflictSet.add(preTaskIdMap[handler]);
              }
            } else {
            }
          } else {
            dateAlertMap.user[handler] = GanttAlertType.UnAvailable;
            dateAlertMap.type = GanttAlertType.UnAvailable;
            conflictSet.add(task.artTaskId);
            conflictSet.add(preTaskIdMap[handler]);
          }
          preTaskIdMap[handler] = task.artTaskId;
        });
        dateAlertMap.conflictIds = Array.from(conflictSet.values());
        alertMap[current.format('YYYY-MM-DD')] = dateAlertMap;
      }

      // const;
      return alertMap;
    },
    getAlertType: (date: Dayjs, _rows: Row<IApiArtTask>[], data: AlertMap) => {
      return data[date.format('YYYY-MM-DD')]?.type ?? GanttAlertType.Normal;
    },
    component: GanttAlert,
    params: { userRoles, users },
    modeLastDayBorder: '#CDD6E4 solid 1px',
    typeElemetPropsMap: {
      [GanttAlertType.Available]: { style: { background: '#4ABE79' } },
      [GanttAlertType.Normal]: {},
      [GanttAlertType.UnAvailable]: {
        style: {
          background: '#F25757',
        },
      },
    },
  };
};

export const mergeDate = (
  days: Dayjs[],
  today: Dayjs,
  start?: Dayjs,
  end?: Dayjs
) => {
  const sortedDays = days.slice().sort((a, b) => a.valueOf() - b.valueOf());
  const dayMerges: [Dayjs, Dayjs][] = [];
  let len = 0;
  sortedDays.forEach((date) => {
    const curMerge = dayMerges[len];
    if (!curMerge) {
      dayMerges.push([date, date]);
      return;
    }

    if (date.diff(curMerge[1], 'day') === 1) {
      curMerge[1] = date;
    } else {
      len += 1;
      dayMerges.push([date, date]);
      return;
    }
  });
  return dayMerges
    .filter(([start, end]) => {
      return isDateBetween(today, start, end);
    })
    .map((merge) => {
      if (merge[0].isSame(merge[1], 'date')) {
        return merge[0].format('YYYY-MM-DD');
      }
      if (merge[0].isSame(start, 'date')) {
        return `*~${merge[1].format('YYYY-MM-DD')}`;
      }
      if (merge[1].isSame(end, 'date')) {
        return `${merge[0].format('YYYY-MM-DD')}~*`;
      }
      return merge.map((date) => date.format('YYYY-MM-DD')).join('~');
    });
};

export const buildNearAvailableAlertData = (
  date: Dayjs,
  alertMap: AlertMap,
  users: string[],
  userRoles: UserRole[],
  alertType: GanttAlertType,
  start?: Dayjs,
  end?: Dayjs
) => {
  const userRoleGroup = groupBy(userRoles, 'user');
  let curDayFmtStr = date.format('YYYY-MM-DD');
  const todayFmtStr = date.format('YYYY-MM-DD');
  let diff = 0;
  const userDateMap = users.reduce<{ [user: string]: Dayjs[] }>(
    (map, user) => ({ ...map, [user]: [] }),
    {}
  );
  while (alertMap[curDayFmtStr]?.type === alertType) {
    const curDate = dayjs(curDayFmtStr);
    Object.entries(alertMap[curDayFmtStr].user)
      .filter(([, type]) => type === alertType)
      .forEach(([user]) => {
        userDateMap[user].push(curDate);
      });
    diff += 1;
    curDayFmtStr = date.add(diff, 'day').format('YYYY-MM-DD');
  }
  diff = -1;
  curDayFmtStr = date.add(diff, 'day').format('YYYY-MM-DD');
  while (alertMap[curDayFmtStr]?.type === alertType) {
    const curDate = dayjs(curDayFmtStr);
    Object.entries(alertMap[curDayFmtStr].user)
      .filter(([, type]) => type === alertType)
      .forEach(([user]) => {
        userDateMap[user].push(curDate);
      });
    diff -= 1;
    curDayFmtStr = date.add(diff, 'day').format('YYYY-MM-DD');
  }
  return Object.entries(userDateMap)
    .filter(
      ([, value]) =>
        !!value.length &&
        value.some((date) => date.format('YYYY-MM-DD') === todayFmtStr)
    )
    .map(([key, value]) => ({
      handler: key,
      roles: userRoleGroup[key]
        ?.flat()
        .map(({ role }) => role)
        .join(';'),
      date: mergeDate(value, date, start, end).join(';'),
    }));
};
