import React, { useCallback, useEffect } from 'react';
import { NodeResizer, useUpdateNodeInternals } from 'reactflow';
import { GanttBarBoxProps } from '../..';

export const GanttBarBox = (props: GanttBarBoxProps) => {
  const { children, ...rest } = props;
  const { height, minWidth, index } = rest.data;
  const { row } = rest.data;
  const updateNodeInternals = useUpdateNodeInternals();

  const GanttBar = children;

  const handleResize = useCallback(() => {
    updateNodeInternals(rest.id);
  }, [rest.id]);

  useEffect(() => {
    handleResize();
  }, [rest.id, rest.xPos, rest.data.width]);

  return (
    <>
      <NodeResizer
        minWidth={minWidth}
        minHeight={height}
        maxHeight={height}
        lineStyle={{
          backgroundColor: '#00000000',
          width: 10,
        }}
        onResize={handleResize}
      />
      {GanttBar ? (
        <GanttBar {...rest} />
      ) : (
        <div
          style={{
            backgroundColor: `rgba(${row.id + 20}, ${30 + index * 4}, ${
              index + row.id + 100
            }, 1)`,
            height,
            overflow: 'hidden',
          }}
          className='gantt-bar77'
        >
          {row.id}
        </div>
      )}
    </>
  );
};
