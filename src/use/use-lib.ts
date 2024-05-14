import dayjs, { Dayjs } from "dayjs";
import { Person } from "../makeData";

export const getFrontLinkIds = (row: Person) => {
  return [`${row.id + 2}`, `${row.id + 1}`];
};

export const getPostLinkIds = (row: Person) => {
  return [`${row.id - 1}`, `${row.id - 2}`];
};

export const getRowId = (row: Person) => `${row.id}`;

export const getBarEnd = (row: Person) =>
  row.endAt ? dayjs(row.endAt) : undefined;

export const getBarStart = (row: Person) =>
  row.createdAt ? dayjs(row.createdAt) : undefined;
