import React, { ReactNode, memo, useCallback, useMemo, useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
  useReactFlow,
} from 'reactflow';
import styles from './index.module.scss';
// import { Tooltip } from 'antd';
import { GanttNode } from '@/components/gantt';
import { debounce } from 'lodash';

export const DeletableEdges = memo(
  (
    props: EdgeProps & {
      onDisConnect?: (from: string, to: string) => void;
      renderTitle?: (props: {
        from: GanttNode<any>;
        to: GanttNode<any>;
      }) => ReactNode;
    }
  ) => {
    const {
      id,
      sourceX,
      sourceY,
      targetX,
      targetY,
      source,
      target,
      sourcePosition,
      targetPosition,
      style = {},
      markerEnd,
      onDisConnect,
      data,
      // renderTitle: DeleteTitle,
    } = props;

    const { setEdges } = useReactFlow();
    const [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 8,
    });
    const [isDeleteHovered, setIsDeleteHovered] = useState<boolean>(false);

    const onEdgeClick = () => {
      onDisConnect?.(source, target);
      setEdges((edges) => edges.filter((edge) => edge.id !== id));
    };

    const onMouseLeave = useCallback(
      debounce(() => {
        onMouseOver.cancel();
        setIsDeleteHovered(false);
        setEdges((prevElements) =>
          prevElements.map((element) =>
            element.id === id
              ? {
                  ...element,
                  data: { ...element.data, isHovered: false },
                }
              : element
          )
        );
      }, 100),
      []
    );

    const onMouseOver = useMemo(
      () =>
        debounce(() => {
          setIsDeleteHovered(true);
        }, 100),
      []
    );

    // const fromNode = useMemo(() => getNode(source) as GanttNode<any>, [source]);
    // const toNode = useMemo(() => getNode(target) as GanttNode<any>, [target]);

    return (
      <>
        <BaseEdge
          path={edgePath}
          markerEnd={markerEnd}
          style={
            isDeleteHovered
              ? { ...style, stroke: 'red', zIndex: 99999 }
              : data?.isHovered
              ? { ...style, stroke: 'blue', zIndex: 99999 }
              : style
          }
        />
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 12,
              zIndex: 9999,
              // everything inside EdgeLabelRenderer has no pointer events by default
              // if you have an interactive element, set pointer-events: all
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            {/* <Tooltip
              title={
                !!DeleteTitle ? (
                  <DeleteTitle from={fromNode} to={toNode} />
                ) : null
              }
            > */}
            <button
              className={styles.deletableIcon}
              style={{ opacity: data?.isHovered || isDeleteHovered ? 1 : 0 }}
              onClick={onEdgeClick}
              onMouseLeave={onMouseLeave}
              onMouseOver={onMouseOver}
            >
              ×
            </button>
            {/* </Tooltip> */}
          </div>
        </EdgeLabelRenderer>
      </>
    );
  }
);
