import { GanttBarInstance } from "../GantBar";
import { GanttBarLine } from "../GanttBarLine";
import { BarRefMap } from "../VirtualGantt";
import React from "react";

type GanttBarLinesProps = {
  barRefMap: React.MutableRefObject<BarRefMap>;
  onLinkRemove?: (start: GanttBarInstance, end: GanttBarInstance) => void;
};
export const GanttBarLines = (props: GanttBarLinesProps) => {
  const { barRefMap, onLinkRemove } = props;
  const barInstances = Array.from(barRefMap.current.values());

  return (
    <>
      {barInstances.map((bar) => {
        return (
          <React.Fragment key={bar?.id}>
            {bar?.frontLinkIds.map((linkId) => {
              const key = `${bar.id}__${linkId}`;
              const linkBar = barRefMap.current.get(linkId);
              return (
                <GanttBarLine
                  key={key}
                  start={bar}
                  end={linkBar}
                  onLinkRemove={onLinkRemove}
                />
              );
            })}
          </React.Fragment>
        );
      })}
    </>
  );
};
