/// <reference types='vite/client' />

import { Key } from 'react';
import { Dayjs } from 'dayjs';

export type GroupKeyer<T> = {
  key: ((data: T) => Key) | keyof T;
  groupId: string;
};

export type GanttMilestoneType = {
  title: string;
  position: 'right' | 'left' | 'center';
  date: Dayjs;
  color?: string;
};
