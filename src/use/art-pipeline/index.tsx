import { useEffect, useState } from 'react';
import { ArtPipGantt } from './art-gantt';
import {
  IApiArtPip,
  IApiArtStory,
  IApiArtTask,
} from '@/model/pmstation/api-modules/art-task';
import {
  apiEditPip,
  apiGetListStory,
  apiGetListTask,
  apiListPip,
} from '@/api/pmstation/art-task';
import { useParams } from 'react-router-dom';
import { IProjectCommonPathParams } from '@/model';
import { GanttUpdaterProvider } from './gantt-updater-provider';
import { getDefaultWorkCalendarDetail } from '@/store/pmstation/modules/work-calendar/actions';
import { useTapdAuthInfo } from '@/store/pmstation/modules/project/hooks';
import { apiGetTapdRoles, apiGetTapdUsers } from '@/api';

export const ArtPipeline = () => {
  const [newPipName, setNewPipName] = useState<string>('');
  const [pipList, setPipList] = useState<IApiArtPip[]>([]);
  const [tasks, setTasks] = useState<IApiArtTask[]>([]);
  const [stories, setStories] = useState<IApiArtStory[]>([]);
  const [artPip, setArtPip] = useState<IApiArtPip | undefined>();
  const { projectId } = useParams<IProjectCommonPathParams>();
  const [isGroupView, setIsGroupView] = useState<boolean>(true);
  const [groupStr, setGroupStr] = useState<string>('');
  const [userRoles, setUserRoles] = useState<
    {
      user: string;
      role: string;
    }[]
  >([]);

  const { tapdAuthInfo } = useTapdAuthInfo();

  const fetchTapdUserRoleMap = async (id: string) => {
    const users = await apiGetTapdUsers(id);
    const roles = await apiGetTapdRoles(id);
    let userRoles: {
      user: string;
      role: string;
    }[] = [];
    if (roles && users) {
      userRoles = users
        ?.map((user) => {
          return user.UserWorkspace.role_id.map((roleId) => {
            return { user: user.UserWorkspace.user, role: roles[roleId] };
          });
        })
        .flat();
    }
    setUserRoles(userRoles);
  };

  useEffect(() => {
    if (tapdAuthInfo) {
      fetchTapdUserRoleMap(tapdAuthInfo.workspace_id);
    }
  }, [tapdAuthInfo?.workspace_id, tapdAuthInfo]);

  const fetchPips = async () => {
    const result = await apiListPip(projectId);
    if (result) {
      setPipList(result);
      if (result.length) setArtPip(result[0]);
    }
  };

  const fetchTasks = async (artPipId: number) => {
    const result = await apiGetListTask({ artPipId, page: 1, pageSize: 9999 });
    if (result?.artTasks) {
      setTasks(result.artTasks.slice());
    }
  };

  const fetchStory = async (artPipId: number) => {
    const result = await apiGetListStory({ artPipId, page: 1, pageSize: 9999 });
    if (result?.artStories) {
      setStories(result.artStories.slice());
    }
  };

  const onCreate = async () => {
    /**
     *   artPipId: number;
  projectId: string;
  name: string;
  category: string;
  config: string;
  fatherId: number;
     */
    const result = await apiEditPip({
      projectId,
      name: newPipName,
      category: '',
      config: '',
    });
    if (result?.artPipId) {
      setNewPipName('');
      fetchPips();
    }
  };

  useEffect(() => {
    if (artPip) {
      fetchTasks(artPip.artPipId);
      fetchStory(artPip.artPipId);
    }
  }, [artPip, artPip?.artPipId]);

  useEffect(() => {
    if (projectId) fetchPips();
  }, [projectId]);

  useEffect(() => {
    getDefaultWorkCalendarDetail({ projectId });
  }, [projectId]);

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ width: 300, flex: 0, padding: 10, background: '##2f2f2f' }}>
        <input
          value={newPipName}
          onChange={(event) => setNewPipName(event.target.value)}
        />
        <button onClick={() => onCreate()}>创建美术看板</button>
        <div className="pip-list">
          {pipList.map((pip) => {
            return (
              <div
                key={pip.artPipId}
                style={{ display: 'flex', justifyContent: 'space-between' }}
                onClick={() => setArtPip(pip)}
              >
                <span>{pip.name}</span>
                <span>{pip.count}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ minWidth: 400, flex: 'auto' }}>
        <div>
          <input
            value={groupStr}
            onChange={(event) => setGroupStr(event.target.value)}
          />
          <button onClick={() => setIsGroupView((pre) => !pre)}>
            {isGroupView ? '取消分组' : '确定分组'}
          </button>
        </div>
        <GanttUpdaterProvider>
          <ArtPipGantt
            users={['jxk', 'j', 'x', 'k', 'v_jxkjiang']}
            userRoles={userRoles}
            isGroupView={isGroupView}
            tasks={tasks}
            stories={stories}
            artPip={artPip}
            onListChange={() => {
              if (artPip) {
                fetchTasks(artPip.artPipId);
                fetchStory(artPip.artPipId);
              }
            }}
            setTasks={setTasks}
            setStories={setStories}
            grouping={groupStr.split(',') as (keyof IApiArtTask)[]}
          />
        </GanttUpdaterProvider>
      </div>
    </div>
  );
};
