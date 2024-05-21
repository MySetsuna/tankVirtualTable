import React, { useEffect } from 'react';
import dayjs from 'dayjs';
import { IApiArtTask } from '../../../art-task';
import {
  BaseGroupHeaderData,
  GanttBarProps,
  GroupGanttBarProps,
} from '../../../../Gantt';
import { Handle, Position } from 'reactflow';
import { useGanttUpdater } from '../../gantt-updater-provider';
import { createPortal } from 'react-dom';

type IProps = GanttBarProps<IApiArtTask>;
export const GanttBar = (props: IProps) => {
  const { data, id } = props;
  const { height, index, row, fixedX, fixedY, startAt, endAt } = data;
  const [, , , , , , mdRef, muRef] = useGanttUpdater();

  return (
    <div
      style={{
        backgroundColor: `rgba(${row.id + 20}, ${30 + index * 4}, ${
          index + row.id + 100
        }, 1)`,
        position: 'absolute',
        top: 5,
        height: height - 10,
        width: '100%',
        overflow: 'hidden',
      }}
      className="gantt-bar"
      id={id}
    >
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
      {row.original.title}~{row.original.startAt || startAt?.format('YYYYMMDD')}
      ~{row.original.endAt || endAt?.format('YYYYMMDD')}
      <span style={{ color: 'pink', fontSize: 24 }}>
        {row.original.handler}
      </span>
    </div>
  );
};
