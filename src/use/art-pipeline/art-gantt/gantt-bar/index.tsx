import React, { useEffect, useState } from 'react';
import { GanttBarProps } from '@/components/Gantt';
import { IApiArtTask } from '@/model/pmstation/api-modules/art-task';
import { Handle, Position } from 'reactflow';
import { getDayDiff } from '@/components/Gantt/utils';
import { getBarEnd, getBarStart, getDepsTasksEndAndStart } from '../lib/utils';
import { PortalFragment } from '@/components/portal-fragment';
import dayjs from 'dayjs';
import { useMouse } from 'ahooks';
import { VerticalAlignTopOutlined } from '@ant-design/icons';
import styles from './index.module.scss';

type IProps = GanttBarProps<IApiArtTask>;
export const GanttBar = (props: IProps) => {
  const { data, rows } = props;
  const { height, index, row, creating, startAt, endAt } = data;
  const unit = '工作日';
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const { clientX, clientY } = useMouse();

  const { title, handler } = row.original;
  const end = getBarEnd(row.original);
  const diff = creating
    ? getDayDiff(endAt, startAt) + 1
    : getDayDiff(end, getBarStart(row.original)) + 1;
  const remainDiff = getDayDiff(getBarEnd(row.original), dayjs());
  const { fromEndAt, toStartAt } = getDepsTasksEndAndStart(row, rows);
  // <VerticalAlignTopOutlined />

  useEffect(() => {
    if (isHovered) {
    }
  }, [isHovered]);
  return (
    <div
      style={{
        height,
        overflow: 'visible',
        padding: '6px 0',
        pointerEvents: data.creating ? 'none' : 'unset',
      }}
      className="gantt-bar"
      onMouseOver={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={{
          height: height - 12,
          borderRadius: 4,
          background: 'white',
          position: 'absolute',
          width: '100%',
          zIndex: -1,
        }}
      ></div>
      {isHovered && (
        <PortalFragment>
          <div
            className={styles.ganttBarTips}
            style={{
              left: clientX - 60,
              top: clientY - 70,
              padding: 10,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div
              className="header"
              style={{ display: 'flex', justifyContent: 'space-between' }}
            >
              <div className="owner">{handler}</div>
              <div className="remain-day">剩余{remainDiff}工作日</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                {!!fromEndAt && (
                  <>
                    <VerticalAlignTopOutlined rotate={90} />
                    <span>{fromEndAt.format('YY/M/DD')} </span>
                  </>
                )}
              </div>
              <div>
                {!!toStartAt && (
                  <>
                    <span>{toStartAt.format('YY/M/DD')} </span>
                    <VerticalAlignTopOutlined rotate={90} />
                  </>
                )}
              </div>
            </div>
          </div>
        </PortalFragment>
      )}
      <div
        style={{
          height: '100%',
          borderRadius: 4,
          display: 'flex',
          backgroundColor: `rgba(${row.id + 20}, ${30 + index * 4}, ${
            index + row.id + 10
          }, 0.3)`,
        }}
      >
        <Handle
          type="target"
          position={Position.Left}
          style={{ background: '#00000000', left: -1, width: 8, height: 8 }}
        />
        <div
          style={{
            width: `${row.original.progress}%`,
            backgroundColor: `rgba(${row.id + 20}, ${30 + index * 4}, ${
              index + row.id + 10
            }, 1)`,
            height: height - 12,
            borderRadius: 4,
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              position: 'relative',
              left: 6,
              display: 'flex',
              gap: 5,
              pointerEvents: 'none',
            }}
          >
            <span className="title" style={{ color: '#1D2129' }}>
              {title}
            </span>
            <span style={{ color: '#86909C' }}>•</span>
            <span className="diff-day" style={{ color: '#86909C' }}>
              {diff}
              {unit}
            </span>
          </div>
        </div>
        <div
          style={{
            flex: 'auto',
          }}
        ></div>
        <Handle
          type="source"
          position={Position.Right}
          style={{ background: '#00000000', right: -1, width: 8, height: 8 }}
        />
      </div>
    </div>
  );
};
