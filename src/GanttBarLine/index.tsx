import React, { RefObject, useMemo, useState } from "react";
import { GanttBarInstance } from "../MyGanttBar";
import Xarrow from "react-xarrows";
import { debounce } from "lodash";
type GanttBarLineProps = {
  start: GanttBarInstance;
  end?: GanttBarInstance | null;
  onLinkRemove?: (start: GanttBarInstance, end: GanttBarInstance) => void;
};

export const GanttBarLine = (props: GanttBarLineProps) => {
  const { start, end, onLinkRemove } = props;
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isHoverDelete, setIsHoverDelete] = useState<boolean>(false);

  const debounceHover = useMemo(
    () =>
      debounce((hover: boolean) => {
        setIsHovered(hover);
      }, 50),
    []
  );

  const debounceDeleteHover = useMemo(
    () =>
      debounce((hover: boolean) => {
        setIsHoverDelete(hover);
      }, 50),
    []
  );

  return (
    <Xarrow
      zIndex={99}
      startAnchor={["bottom"]}
      endAnchor={["top"]}
      start={start.container} //can be react ref
      end={end?.container ?? start.dragArrow} //or an id
      curveness={1}
      strokeWidth={4}
      headSize={4}
      labels={
        isHovered ? (
          <div
            onMouseOver={() => {
              debounceHover.cancel();
              debounceDeleteHover(true);
            }}
            onMouseLeave={() => {
              debounceDeleteHover(false);
              debounceHover(false);
            }}
            style={{
              backgroundColor: "red",
              color: "white",
              width: 20,
              height: 20,
              borderRadius: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            X
          </div>
        ) : undefined
      }
      showXarrow={start.isVisible && end?.isVisible}
      passProps={{
        onClick: () => {
          //   console.log(row.id + 1, linkBar);
          //   console.log(row.id, barContainerRef);
          !!end && onLinkRemove?.(start, end);
        },
        onMouseOver: () => {
          // debounceHover.cancel()
          if (!isHoverDelete) debounceHover(true);
        },
        onMouseLeave: () => {
          if (!isHoverDelete) {
            debounceHover.cancel();
            debounceHover(false);
          }
        },
        onChange: () => {
          //   console.log(row.id + 1, linkBar);
          //   console.log(row.id, barContainerRef);
        },
        className: "gantt-line-body",
      }}
      // path="straight"
    />
  );
};
