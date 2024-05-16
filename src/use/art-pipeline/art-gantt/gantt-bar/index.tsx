import React from 'react';
import dayjs from 'dayjs';
import { BaseGroupHeaderData, GroupGanttBarProps } from '@/components/Gantt';
import { IApiArtTask } from '@/model/pmstation/api-modules/art-task';

type IProps = GroupGanttBarProps<IApiArtTask, BaseGroupHeaderData>;
export const GanttBar = (props: IProps) => {
  const { data, id } = props;
  const { height, index, row, fixedX, fixedY } = data;

  console.log(fixedX, fixedY);

  return (
    <div
      style={{
        backgroundColor: `rgba(${row.id + 20}, ${30 + index * 4}, ${
          index + row.id + 100
        }, 1)`,
        height,
        overflow: 'hidden',
      }}
      className="gantt-bar"
      id={id}
    >
      {dayjs(row.original.startAt).format('YYYYMMDD')}
    </div>
  );
};
