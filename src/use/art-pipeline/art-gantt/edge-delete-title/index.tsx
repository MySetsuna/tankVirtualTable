import { GanttNode } from '@/components/Gantt';
import { IApiArtTask } from '@/model/pmstation/api-modules/art-task';
import dayjs from 'dayjs';

export const EdgeDeleteTitle = (props: {
  form: GanttNode<IApiArtTask>;
  to: GanttNode<IApiArtTask>;
}) => {
  const { form, to } = props;
  const getTitle = (node: GanttNode<IApiArtTask>, at: 'endAt' | 'startAt') => {
    return `${node.data.row.original.title}：${dayjs(
      node.data.row.original[at]
    ).format('YYYY-MM-DD')}（${at}）`;
  };
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div style={{ whiteSpace: 'nowrap' }}>{getTitle(form, 'endAt')}</div>
      <div style={{ width: '100%', flex: 'auto', textAlign: 'center' }}>
        ——→
      </div>
      <div style={{ whiteSpace: 'nowrap' }}>{getTitle(to, 'startAt')}</div>
    </div>
  );
};
