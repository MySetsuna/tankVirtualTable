import dayjs, { Dayjs } from "dayjs";
import { AnyObject } from "../VirtualGantt";

export const getFrontLinkIds = (row: AnyObject) => {
  return [`${row.id + 2}`, `${row.id + 1}`];
};

export const getPostLinkIds = (row: AnyObject) => {
  return [`${row.id - 1}`, `${row.id - 2}`];
};

export const getRowId = (row: AnyObject) => `${row.id}`;

export const getBarEnd = (row: AnyObject) =>
  row.endAt ? dayjs(row.endAt) : undefined;

export const getBarStart = (row: AnyObject) =>
  row.createdAt ? dayjs(row.createdAt) : undefined;
