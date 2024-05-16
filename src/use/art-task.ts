export interface IApiArtTaskFieldKind {
  readonly kind: {
    readonly nullValue: { NULL_VALUE: 0 };
    readonly numberValue: number;
    readonly stringValue: string;
    readonly boolValue: boolean;
    readonly structValue: {
      readonly fields: { readonly [key: string]: IApiArtTaskFieldKind };
    };
    readonly listValue: {
      readonly values: ReadonlyArray<IApiArtTaskFieldKind>;
    };
  };
}

export interface IApiArtTask {
  readonly artTaskId: number;
  // readonly projectId: string;
  readonly artPipId: number;
  readonly artStoryId: number;
  readonly title: string;
  readonly artCategory: string;
  readonly effort: number;
  readonly progress: number;
  readonly status: string;
  // readonly thumbnailUrl: string;
  // readonly handler: string;
  readonly startAt: string;
  readonly endAt: string;
  // readonly priority: string;
  // readonly milestoneId: number;
  // readonly tapdStoryId: string;
  // readonly createdAt: string;
  // readonly updatedAt: string;
  readonly FromDependIds: number[];
  readonly ToDependIds: number[];
  // readonly customField: {
  //   readonly fields: { readonly [key: string]: IApiArtTaskFieldKind };
  // };
}

export interface IApiArtTaskParams extends Omit<IApiArtTask, "artTaskId"> {
  readonly artTaskId?: number;
}

export interface IApiArtTaskPage {
  readonly page: number;
  readonly pageSize: number;
  readonly totalSize: number;
  readonly artTasks: ReadonlyArray<IApiArtTask>;
}

export interface IApiArtPip {
  readonly artPipId: number;
  // readonly projectId: string;
  readonly name: string;
  readonly category: string;
  readonly fatherId: number;
  readonly count: number;
}

export interface IApiArtStoryParams {
  readonly artStoryId?: number;
  readonly projectId: string;
  readonly artPipId: number;
  readonly title: string;
  readonly tapdStoryId: string;
}

export interface IApiArtPageParams {
  page: number;
  pageSize: number;
  artPipId: number;
}

export interface IApiArtStoryPage {
  readonly totalSize: number;
  readonly artStories: ReadonlyArray<IApiArtStory>;
}

export interface IApiArtStory {
  readonly artStoryId: number;
  // readonly projectId: string;
  readonly artPipId: number;
  readonly title: string;
  // readonly tapdStoryId: string;
  readonly status: string;
  // readonly finishedCount: number;
  // readonly unfinishedCount: number;
  readonly createdAt: string;
}
