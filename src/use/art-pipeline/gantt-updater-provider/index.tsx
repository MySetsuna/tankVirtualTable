import React, {
  Key,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Dayjs } from 'dayjs';
import { useSelector } from 'react-redux';
import { IRootState } from '@/store/reducers';
import {
  getDateWorkType,
  getFormatWorkCalendarSetInfo,
} from '../../work-calendar/lib';
import { WorkCalendarStatus } from '@/model/pmstation/work-calendar';

export type MouseCreatorInstance = {
  moveFn?: (evt: MouseEvent) => void;
  endFn?: (evt: MouseEvent) => void;
  rowId?: Key;
  resizing?: boolean;
  isQuackCreating?: boolean;
};

const Context = createContext<
  | {
      expandKeys: string[];
      setExpandKeys: React.Dispatch<React.SetStateAction<string[]>>;
      expandCallback: {
        keys?: (idx: Key[]) => void;
        modules?: (idx: Key[]) => void;
      };
      setExpandCallback: React.Dispatch<
        React.SetStateAction<{
          keys?: ((idx: Key[]) => void) | undefined;
          modules?: ((idx: Key[]) => void) | undefined;
        }>
      >;
      mouseCreatorRef: React.MutableRefObject<MouseCreatorInstance>;
      isHoliday: (date: Dayjs) => boolean;
    }
  | undefined
>(undefined);
type IProps = {
  children: ReactNode;
};

export const GanttUpdaterProvider = (props: IProps) => {
  const [expandKeys, setExpandKeys] = useState<string[]>([]);
  const [expandCallback, setExpandCallback] = useState<{
    keys?: (idx: Key[]) => void;
    modules?: (idx: Key[]) => void;
  }>({});

  const mouseCreatorRef = useRef<MouseCreatorInstance>({});
  const workCalendarDetail = useSelector(
    (state: IRootState) => state.pm.workCalendar.workCalendarDetail
  );

  const workCalendarSetInfo = useMemo(
    () => getFormatWorkCalendarSetInfo(workCalendarDetail),
    [workCalendarDetail]
  );

  const isHoliday = useCallback(
    (date: Dayjs) =>
      getDateWorkType(date.format('YYYY-MM-DD'), workCalendarSetInfo) ===
      WorkCalendarStatus.Holiday,
    [workCalendarSetInfo]
  );

  useEffect(() => {
    return () => {
      if (mouseCreatorRef.current.endFn)
        document.addEventListener('mouseup', mouseCreatorRef.current.endFn);
    };
  }, []);

  return (
    <Context.Provider
      value={
        {
          expandKeys,
          setExpandKeys,
          expandCallback,
          setExpandCallback,
          mouseCreatorRef,
          isHoliday,
        } as const
      }
    >
      {props.children}
    </Context.Provider>
  );
};

export function useGanttUpdater() {
  const value = useContext(Context);
  if (!value) {
    throw new Error('请在 GanttUpdaterProvider 中使用 useGanttUpdater');
  }
  return value;
}
