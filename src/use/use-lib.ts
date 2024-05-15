import dayjs from "dayjs";
import { Task } from "../makeData";
import { Row } from "@tanstack/react-table";

export const getFrontLinkIds = (row: Task) => {
  return row.fromDepsIds;
};

export const getPostLinkIds = (row: Task) => {
  return row.fromDepsIds;
};

export const getRowId = (row: Row<Task>) => {
  return row.id;
};

export const getBarEnd = (row: Task) =>
  row.endAt ? dayjs(row.endAt) : undefined;

export const getBarStart = (row: Task) =>
  row.startAt ? dayjs(row.startAt) : undefined;
