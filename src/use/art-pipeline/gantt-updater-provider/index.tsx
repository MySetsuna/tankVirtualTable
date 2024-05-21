import React, {
  Key,
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

const Context = createContext<
  | [
      React.Key[],
      React.Dispatch<React.SetStateAction<React.Key[]>>,
      number[],
      React.Dispatch<React.SetStateAction<number[]>>,
      {
        keys?: (idx: Key[]) => void;
        modules?: (idx: number[]) => void;
      },

      React.Dispatch<
        React.SetStateAction<{
          keys?: ((idx: Key[]) => void) | undefined;
          modules?: ((idx: number[]) => void) | undefined;
        }>
      >,
      mouseDownDataRef: React.MutableRefObject<any>,
      mouseUpDataRef: React.MutableRefObject<any>
    ]
  | undefined
>(undefined);
type IProps = {
  children: ReactNode;
};

export const GanttExpandProvider = (props: IProps) => {
  const [expandKeys, setExpandKeys] = useState<Key[]>([]);
  const [callback, setCallback] = useState<{
    keys?: (idx: Key[]) => void;
    modules?: (idx: number[]) => void;
  }>({});
  const [expandModuleIdx, setExpandModuleIdx] = useState<number[]>([]);
  const mouseDownDataRef = useRef<any>(null);
  const mouseUpDataRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (mouseDownDataRef.current)
        document.addEventListener('mouseup', mouseDownDataRef.current.changeFn);
    };
  }, []);
  return (
    <Context.Provider
      value={
        [
          expandKeys,
          setExpandKeys,
          expandModuleIdx,
          setExpandModuleIdx,
          callback,
          setCallback,
          mouseDownDataRef,
          mouseUpDataRef,
        ] as const
      }
    >
      {props.children}
    </Context.Provider>
  );
};

export function useGanttUpdater() {
  const value = useContext(Context);
  if (!value) {
    throw new Error('请在 GanttExpandProvider 中使用 useGanttExpand');
  }
  return value;
}
