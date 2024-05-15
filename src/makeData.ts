import { faker } from "@faker-js/faker";
import dayjs from "dayjs";

export type Task = {
  id: number;
  storyId: number;
  process: number;
  effort: number;
  startAt: Date;
  endAt: Date;
  title: string;
  fromDepsIds: number[];
  toDepsIds: number[];
  status: "done" | "working" | "new";
};

export type Story = {
  id: number;
  title: string;
};

const range = (len: number) => {
  const arr: number[] = [];
  for (let i = 0; i < len; i++) {
    arr.push(i);
  }
  return arr;
};

export const columnKeys = [
  "id",
  "storyId",
  "process",
  "effort",
  "startAt",
  "endAt",
  "title",
  "fromDepsIds",
  "toDepsIds",
  "status",
];

const newTask = (index: number, len): Task => {
  const today = dayjs();
  return {
    id: index + 1,
    title: faker.word.verb(),
    storyId: faker.helpers.shuffle<Task["storyId"]>([
      1, 2, 3, 4, 5, 6, 7.8,
    ])[0]!,
    process: faker.datatype.number(100),
    effort: faker.datatype.number(10000),
    startAt: faker.datatype.datetime({
      max: today.add(10, "day").valueOf(),
      min: today.add(0, "day").valueOf(),
    }),
    endAt: faker.datatype.datetime({
      max: today.add(20, "day").valueOf(),
      min: today.add(11, "day").valueOf(),
    }),
    fromDepsIds: Array(faker.datatype.number(10))
      .fill(0)
      .map(() => faker.datatype.number(len)),
    toDepsIds: Array(faker.datatype.number(10))
      .fill(0)
      .map(() => faker.datatype.number(len)),
    status: faker.helpers.shuffle<Task["status"]>([
      "done",
      "working",
      "new",
    ])[0]!,
    // age: faker.datatype.number(40),
    // visits: faker.datatype.number(1000),
    // progress: faker.datatype.number(100),
    // progress1: faker.datatype.number(50),
    // progress2: faker.datatype.number(50),
    // createdAt: faker.datatype.datetime({
    //   max: dayjs().add(10, "week").valueOf(),
    //   min: dayjs().add(-10, "week").valueOf(),
    // }),
    // createdAt2: faker.datatype.datetime({
    //   max: dayjs().add(10, "week").valueOf(),
    //   min: dayjs().add(-10, "week").valueOf(),
    // }),
    // status: faker.helpers.shuffle<Task["status"]>([
    //   "relationship",
    //   "complicated",
    //   "single",
    // ])[0]!,
    // type: faker.helpers.shuffle<Task["type"]>([1, 2, 3])[0]!,
  };
};

export function makeData(...lens: number[]) {
  const makeDataLevel = (depth = 0): Task[] => {
    const len = lens[depth]!;
    return range(len).map((d): Task => {
      return {
        ...newTask(d, len),
      };
    });
  };

  return makeDataLevel();
}
