import { faker } from '@faker-js/faker';
import dayjs from 'dayjs';
import { IApiArtPip, IApiArtStory, IApiArtTask } from './use/art-task';

const range = (len: number) => {
  const arr: number[] = [];
  for (let i = 0; i < len; i++) {
    arr.push(i);
  }
  return arr;
};

const newTask = (index: number, len): IApiArtTask => {
  const today = dayjs();
  return {
    artTaskId: index + 1,
    title: faker.word.verb(),
    artStoryId: faker.datatype.number(19),
    artPipId: faker.datatype.number(50),
    handler: faker.helpers.arrayElements<IApiArtTask['handler']>([
      '用户1',
      '用户2',
      '用户3',
      '用户4',
      '用户5',
      '用户6',
      '用户7',
      '用户8',
      '用户9',
    ])[0]!,
    artCategory: faker.helpers.shuffle<IApiArtTask['artCategory']>([
      '分类1',
      '分类2',
      '分类3',
    ])[0]!,
    progress: faker.datatype.number(100),
    effort: faker.datatype.number(10000),
    startAt: faker.datatype
      .datetime({
        max: today.add(1, 'day').valueOf(),
        min: today.add(-3, 'day').valueOf(),
      })
      .toLocaleDateString(),
    endAt: faker.datatype
      .datetime({
        max: today.add(4, 'day').valueOf(),
        min: today.add(2, 'day').valueOf(),
      })
      .toLocaleDateString(),
    FromDependIds: Array(faker.datatype.number(10))
      .fill(0)
      .map(() => faker.datatype.number(len)),
    ToDependIds: Array(faker.datatype.number(10))
      .fill(0)
      .map(() => faker.datatype.number(len)),
    status: faker.helpers.shuffle<IApiArtTask['status']>([
      'done',
      'working',
      'new',
    ])[0]!,
  };
};

const newStory = (index: number, len): IApiArtStory => {
  const today = dayjs();
  return {
    artStoryId: index,
    title: faker.word.verb(),
    artPipId: faker.datatype.number(5),
    status: faker.helpers.shuffle<IApiArtStory['status']>([
      'done',
      'working',
      'new',
    ])[0]!,
    createdAt: faker.datatype
      .datetime({
        max: today.add(20, 'day').valueOf(),
        min: today.add(11, 'day').valueOf(),
      })
      .toDateString(),
  };
};

const newArtPip = (index: number, len): IApiArtPip => {
  const today = dayjs();
  return {
    artPipId: index,
    name: faker.word.verb(),
    category: faker.helpers.shuffle<IApiArtPip['category']>([
      '分类1',
      '分类2',
      '分类3',
      '分类4',
    ])[0]!,
    count: faker.datatype.number(50),
    fatherId: faker.datatype.number(len),
  };
};

export function makeTask(...lens: number[]) {
  const makeDataLevel = (depth = 0): IApiArtTask[] => {
    const len = lens[depth]!;
    return range(len).map((d): IApiArtTask => {
      return {
        ...newTask(d, len),
      };
    });
  };

  return makeDataLevel();
}

export function makeStory(...lens: number[]) {
  const makeDataLevel = (depth = 0): IApiArtStory[] => {
    const len = lens[depth]!;
    return range(len).map((d): IApiArtStory => {
      return {
        ...newStory(d, len),
      };
    });
  };

  return makeDataLevel();
}

export function makeArtPip(...lens: number[]) {
  const makeDataLevel = (depth = 0): IApiArtPip[] => {
    const len = lens[depth]!;
    return range(len).map((d): IApiArtPip => {
      return {
        ...newArtPip(d, len),
      };
    });
  };

  return makeDataLevel();
}
