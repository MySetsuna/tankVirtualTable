import React, { ReactNode, useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
  useReactFlow,
} from 'reactflow';
import styles from './index.module.scss';
import { Tooltip } from 'antd';
import { GanttNode } from '@/components/Gantt';

export default function DeletableEdges(
  props: EdgeProps & {
    onDisConnect?: (from: string, to: string) => void;
    renderTitle?: (props: {
      form: GanttNode<any>;
      to: GanttNode<any>;
    }) => ReactNode;
  }
) {
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
    renderTitle: DeleteTitle,
  } = props;

  const { setEdges, getNode } = useReactFlow();
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const [isDeleteHovered, setIsDeleteOvered] = useState<boolean>(false);

  const onEdgeClick = () => {
    onDisConnect?.(source, target);
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
  };
  const fromNode = getNode(source) as GanttNode<any>;
  const toNode = getNode(target) as GanttNode<any>;

  return (
    <>
      <Tooltip
        title={
          !!DeleteTitle ? <DeleteTitle form={fromNode} to={toNode} /> : null
        }
      >
        <BaseEdge
          path={edgePath}
          markerEnd={markerEnd}
          style={
            data?.isHovered
              ? isDeleteHovered
                ? { ...style, stroke: 'red', zIndex: 99999 }
                : { ...style, stroke: 'blue', zIndex: 99999 }
              : style
          }
        />
      </Tooltip>
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
          <Tooltip
            title={
              !!DeleteTitle ? <DeleteTitle form={fromNode} to={toNode} /> : null
            }
          >
            <button
              className={styles.deletableIcon}
              style={{ opacity: data?.isHovered || isDeleteHovered ? 1 : 0 }}
              onClick={onEdgeClick}
              onMouseLeave={() => setIsDeleteOvered(false)}
              onMouseOver={() => setIsDeleteOvered(true)}
            >
              ×
            </button>
          </Tooltip>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
