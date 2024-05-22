import { BaseGroupHeaderData, GroupGanttBarProps } from '@/components/Gantt';
import { IApiArtTask } from '@/model/pmstation/api-modules/art-task';
import { debounce, isNumber } from 'lodash';
import { Key, memo, useCallback, useMemo } from 'react';
import { useGanttUpdater } from '../../gantt-updater-provider';
import { StoryStatus } from '../lib/common';

type IProps = GroupGanttBarProps<IApiArtTask, BaseGroupHeaderData>;
export const GroupGanttBar = memo((props: IProps) => {
  const { data } = props;
  const { row, group } = data;

  const { finishedCount, unfinishedCount, count } = useMemo(() => {
    let finishedCount = 0;
    let unfinishedCount = 0;
    row.getLeafRows().forEach(({ original: { status, artTaskId } }) => {
      if (!isNumber(artTaskId)) return;
      if (status === StoryStatus.Finish) {
        finishedCount += 1;
      } else {
        unfinishedCount += 1;
      }
    });
    return {
      unfinishedCount,
      finishedCount,
      count: unfinishedCount + finishedCount,
    };
  }, [group, row]);

  const {
    expandKeys,
    setExpandKeys,
    expandCallback: callback,
  } = useGanttUpdater();

  // const setExpand =
  //   row.groupingColumnId === ART_STORY_GROUP_ID
  //     ? setExpandedModuleIdx
  //     : setExpandKeys;
  // const expands =
  //   row.groupingColumnId === ART_STORY_GROUP_ID
  //     ? expandedModuleIdx
  //     : expandKeys;
  const handleExpanded = useCallback(
    debounce(() => {
      // row.toggleExpanded();
      let newExpands: Key[] = [];
      if (row.getIsExpanded()) {
        newExpands = expandKeys.filter((key: any) => key !== row.id);
      } else {
        newExpands = [...expandKeys, row.id];
      }
      setExpandKeys(newExpands as any);
      callback?.modules?.(newExpands);
      // console.log(group, 'group');
    }, 100),
    [expandKeys]
  );

  return (
    <div
      onClick={handleExpanded}
      style={{
        background: '#00000000',
        width: '100%',
        height: '100%',
        color: 'black',
      }}
    >
      <div
        className="group-info"
        style={{
          display: 'flex',
          backgroundColor: 'white',
          whiteSpace: 'nowrap',
        }}
      >
        <div
          style={{
            background: 'white',
            width: 'max-content',
            flex: 'auto',
            display: 'flex',
            gap: 20,
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              backgroundColor: '#00000020',
              flex: 1,
              height: 0,
              display: 'flex',
              gap: 20,
              padding: '0 6px',
            }}
          >
            <span style={{ fontWeight: 'bolder' }}>{group.data.title}</span>
            <span className="group-status" style={{ display: 'flex', gap: 5 }}>
              <span>{count}项</span>
              <span>已完成（{finishedCount}）</span>
              <span>|</span>
              <span>未完成（{unfinishedCount}）</span>
            </span>
            <span>
              {group.startAt?.format('YYYY-MM-DD')}~
              {group.endAt?.format('YYYY-MM-DD')}
            </span>
          </div>
        </div>

        <div
          style={{
            background: '#00000020',
            width: 'min-content',
            flexBasis: 0,
          }}
        >
          <div style={{}}></div>
        </div>
      </div>
      <div style={{ height: 6, backgroundColor: 'blue' }}></div>
    </div>
  );
});
