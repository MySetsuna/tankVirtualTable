import {
  IApiArtStory,
  IApiArtTask,
} from '@/model/pmstation/api-modules/art-task';
import { Row } from '@tanstack/react-table';
import dayjs, { Dayjs } from 'dayjs';

export const EMPTY_TIME = '0001-01-01 00:00:00';

export const getToLinkIds = (row: IApiArtTask) => {
  return row.toDependIds;
};

export const getFromLinkIds = (row: IApiArtTask) => {
  return row.fromDependIds;
};

export const getRowId = (row: Row<IApiArtTask> | Row<IApiArtStory>) => {
  return `${row.id}`;
};

export const getLeafRowOriginalId = (row: Row<IApiArtTask>) => {
  return `${row.original.artTaskId}`;
};

export const getBarEnd = (row: IApiArtTask) =>
  row.endAt && row.endAt !== EMPTY_TIME ? dayjs(row.endAt) : undefined;

export const getBarStart = (row: IApiArtTask) =>
  row.startAt && row.endAt !== EMPTY_TIME ? dayjs(row.startAt) : undefined;

export const getDepsTasksEndAndStart = (
  row: Row<IApiArtTask>,
  rows: Row<IApiArtTask>[]
) => {
  const fromIds = getFromLinkIds(row.original) ?? [];
  const toIds = getToLinkIds(row.original) ?? [];
  const fromTasks: IApiArtTask[] = [];
  const toTasks: IApiArtTask[] = [];
  rows.forEach(({ original }) => {
    if (fromIds.includes(original.artTaskId)) {
      fromTasks.push(original);
    }
    if (toIds.includes(original.artTaskId)) {
      toTasks.push(original);
    }
  });
  let fromEndAt: Dayjs | undefined;
  let toStartAt: Dayjs | undefined;
  fromTasks.forEach((task) => {
    const end = getBarEnd(task);

    if ((!fromEndAt && end) || end?.isAfter(fromEndAt)) {
      fromEndAt = end;
    }
  });
  toTasks.forEach((task) => {
    const start = getBarStart(task);
    if ((!toStartAt && start) || start?.isBefore(toStartAt)) {
      toStartAt = start;
    }
  });
  return { fromEndAt, toStartAt };
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
