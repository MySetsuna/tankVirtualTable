import { Row } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { IApiArtTask } from '../../../art-task';

export const getFrontLinkIds = (row: IApiArtTask) => {
  return row.ToDependIds;
};

export const getPostLinkIds = (row: IApiArtTask) => {
  return row.FromDependIds;
};

export const getRowId = (row: Row<any>) => {
  return `${row.id}`;
};

export const getLeafRowOriginalId = (row: Row<IApiArtTask>) => {
  return `${row.original.artTaskId}`;
};

export const getBarEnd = (row: IApiArtTask) =>
  row.endAt ? dayjs(row.endAt) : undefined;

export const getBarStart = (row: IApiArtTask) =>
  row.startAt ? dayjs(row.startAt) : undefined;
