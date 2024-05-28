import { Dayjs } from 'dayjs';
import { GanttMilestoneType } from '../../types/gantt';
import { createPortal } from 'react-dom';
import { CSSProperties, useCallback, useMemo, useState } from 'react';
import { debounce } from 'lodash';
import { getMilestonePositionX } from '../../utils';

type GanttMilestonesProps = {
  width: number;
  hoverAbleWidth?: number;
  title: string;
  date: Dayjs;
  color: string;
  top: number;
  position: GanttMilestoneType['position'];
  height: number;
  hasTopPot?: boolean;
  isBody?: boolean;
  isModeLastDay?: boolean;
  left: number;
  cellWidth: number;
  style?: CSSProperties;
};
export const GanttMilestoneLine = (props: GanttMilestonesProps) => {
  const {
    title,
    top,
    position,
    color,
    height,
    width = 2,
    hoverAbleWidth = 15,
    hasTopPot,
    style,
    left,
    cellWidth,
  } = props;

  const transformX = useMemo(
    () =>
      position === 'center'
        ? left + cellWidth / 2 - 1
        : position === 'left'
        ? left
        : left + cellWidth - 2,
    [left]
  );

  const [isHovered, setIsHovered] = useState<boolean>(false);

  const [mousePosition, setMousePosition] = useState<[number, number]>([0, 0]);

  const onMouseLeave = useCallback(() => {
    onMouseOver.cancel();
    setIsHovered(false);
  }, []);

  const onMouseOver = useMemo(
    () =>
      debounce(() => {
        setIsHovered(true);
      }, 200),
    []
  );

  const positionX = getMilestonePositionX(mousePosition[0]);

  return (
    <div
      style={{
        height,
        width,
        backgroundColor: color,
        position: 'absolute',
        display: 'flex',
        justifyContent: 'start',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        ...style,
        transform: `translateX(${transformX}px) translateY(${top}px)`,
        // ...positionStyle,
      }}
    >
      {isHovered &&
        !!mousePosition[1] &&
        createPortal(
          <div
            style={{
              height: 20,
              padding: '0 10px',
              background: 'white',
              boxShadow: '#000 1px 1px 4px 0px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color,
              position: 'fixed',
              zIndex: 9999,
              maxWidth: 200,
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              left: positionX,
              top: mousePosition[1],
              lineHeight: 20,
            }}
          >
            {title}
          </div>,
          document.body,
          `MilestoneLine__${title}`
        )}
      {hasTopPot && (
        <div
          style={{
            backgroundColor: color,
            borderRadius: '100%',
            width: 6,
            height: 6,
            position: 'relative',
          }}
        ></div>
      )}
      <div
        onMouseMove={(event) => {
          setMousePosition([event.clientX, event.clientY]);
        }}
        onMouseOver={onMouseOver}
        onMouseLeave={onMouseLeave}
        style={{
          height,
          width: hoverAbleWidth,
          backgroundColor: 'transparent',
          position: 'absolute',
          display: 'flex',
          justifyContent: 'start',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      ></div>
    </div>
  );
};
