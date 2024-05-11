import { faker } from "@faker-js/faker";
import dayjs from "dayjs";

export type Person = { [key: string]: any };

const range = (len: number) => {
  const arr: number[] = [];
  for (let i = 0; i < len; i++) {
    arr.push(i);
  }
  return arr;
};

export const columnKeys = [
  "id",
  "firstName",
  "lastName",
  "age",
  "visits",
  "progress",
  "progress1",
  "progress2",
  "status",
  "type",
  "createdAt",
  "createdAt2",
];

const newPerson = (index: number): Person => {
  return {
    id: index + 1,
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    age: faker.datatype.number(40),
    visits: faker.datatype.number(1000),
    progress: faker.datatype.number(100),
    progress1: faker.datatype.number(50),
    progress2: faker.datatype.number(50),
    createdAt: faker.datatype.datetime({
      max: dayjs().add(3, "week").valueOf(),
      min: dayjs().add(-2, "week").valueOf(),
    }),
    createdAt2: faker.datatype.datetime({
      max: dayjs().add(3, "week").valueOf(),
      min: dayjs().add(-2, "week").valueOf(),
    }),
    status: faker.helpers.shuffle<Person["status"]>([
      "relationship",
      "complicated",
      "single",
    ])[0]!,
    type: faker.helpers.shuffle<Person["type"]>([1, 2, 3])[0]!,
  };
};

export function makeData(...lens: number[]) {
  const makeDataLevel = (depth = 0): Person[] => {
    const len = lens[depth]!;
    return range(len).map((d): Person => {
      return {
        ...newPerson(d),
      };
    });
  };

  return makeDataLevel();
}
