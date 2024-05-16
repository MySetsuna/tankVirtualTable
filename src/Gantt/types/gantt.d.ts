/// <reference types="vite/client" />

import { Key } from "react";

export type GroupKeyer<T> = {
  key: ((data: T) => Key) | keyof T;
  groupId: string;
};
