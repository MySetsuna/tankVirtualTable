import React from 'react';
import dayjs from 'dayjs';
import { IApiArtTask } from '../../../art-task';
import {
  BaseGroupHeaderData,
  GanttBarProps,
  GroupGanttBarProps,
} from '../../../../Gantt';

type IProps = GanttBarProps<IApiArtTask>;
export const GanttBar = (props: IProps) => {
  const { data, id } = props;
  const { height, index, row, fixedX, fixedY } = data;

  return (
    <div
      style={{
        backgroundColor: `rgba(${row.id + 20}, ${30 + index * 4}, ${
          index + row.id + 100
        }, 1)`,
        height,
        overflow: 'hidden',
      }}
      className='gantt-bar'
      id={id}
    >
      {row.original.title}~{dayjs(row.original.startAt).format('YYYY-MM--DD')}~
      {dayjs(row.original.endAt).format('YYYY-MM-DD')}
      <span style={{ color: 'gray', fontSize: 24 }}>
        {row.original.handler}
      </span>
    </div>
  );
};
