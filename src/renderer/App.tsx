/* eslint-disable react/require-default-props */
import {
  createContext,
  Fragment,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useRequest } from 'ahooks';
import { Dialog, Transition } from '@headlessui/react';
import { Result } from 'ahooks/lib/useRequest/src/types';
import Echarts from './Echarts';
import './App.css';
import { getPieOptions, getHistoryStackBarOptions } from './options';
import packageInfo from '../../release/app/package.json';

type GlobalData = {
  theme: 'system' | 'dark' | 'light';
  setTheme: (theme: 'system' | 'dark' | 'light') => void;
};

const GlobalCtx = createContext<GlobalData>({
  theme: 'system',
  setTheme: () => {},
});

function LogoSVG() {
  return (
    <svg viewBox="0 0 144 144" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M87.6445 104.513H59.248L65.2676 87.3047H80.9707L57.7432 27.1748H85.9434L120.556 114H91.3086L87.6445 104.513ZM51.5273 114H23.5889L54.6025 31.1006L67.4268 65.582L51.5273 114Z"
        fill="url(#paint0_linear_3_49)"
      />
      <defs>
        <linearGradient
          id="paint0_linear_3_49"
          x1="72.5"
          y1="-9"
          x2="72.5"
          y2="159"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#466F9F" />
          <stop offset="1" stopColor="#00DDFF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function AboutPage() {
  return (
    <div className="flex w-full h-full items-center justify-center">
      <div className="text-center">
        <LogoSVG />
        <p className="text-xl">Active Time</p>
        <p className="text-sm">ver.{packageInfo.version}</p>
        <p className="text-md">Made by Jianqi Pan</p>
        <a
          className="text-md hover:underline cursor-pointer text-blue-500"
          href="https://github.com/Jannchie/active-time"
          target="_blank"
          rel="noreferrer"
        >
          Github
        </a>
        <p className="text-sm text-zinc-500 mt-2">
          Copyright © 2022 Jannchie Studio. All rights reserved.
        </p>
      </div>
    </div>
  );
}

function MyModal({
  title = 'Button',
  info = 'Are you sure?',
  action = () => {},
  type = 'normal',
}: {
  title?: string;
  info?: string;
  type?: 'normal' | 'danger';
  action?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  function closeModal() {
    setIsOpen(false);
  }
  function openModal() {
    setIsOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={`${
          type === 'danger' ? 'j-danger-btn' : 'j-normal-btn'
        } j-btn`}
      >
        {title}
      </button>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => closeModal()}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="j-body-color w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 dark:text-zinc-300"
                  >
                    {title}
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">{info}</p>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      className="j-normal-btn"
                      onClick={closeModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={`${
                        type === 'danger' ? 'j-danger-btn' : 'j-normal-btn'
                      } inline-flex mr-4 justify-center rounded-md px-4 py-2 transition cursor-pointer`}
                      onClick={() => {
                        action();
                        closeModal();
                      }}
                    >
                      Confirm
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}

function formatFileSzie(size: number) {
  if (size < 1024) {
    return `${size}B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)}KB`;
  }
  if (size < 1024 * 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(2)}MB`;
  }
  return `${(size / 1024 / 1024 / 1024).toFixed(2)}GB`;
}

function ChartsView({
  recordsResp,
  theme,
}: {
  recordsResp: Result<any, []>;
  theme: 'light' | 'dark';
}) {
  return (
    <>
      <div className="flex">
        <Echarts
          option={getPieOptions(recordsResp.data, 'event')}
          height={300}
          width="100%"
          theme={theme}
          loading={recordsResp.loading}
        />
        <Echarts
          option={getPieOptions(recordsResp.data, 'program', 5)}
          height={300}
          width="100%"
          theme={theme}
          loading={recordsResp.loading}
        />
      </div>
      <div>
        <Echarts
          option={getHistoryStackBarOptions(recordsResp.data)}
          height={300}
          width="100%"
          theme={theme}
          loading={recordsResp.loading}
        />
      </div>
    </>
  );
}
function RecentPage() {
  function getChannel(selecting: number) {
    switch (selecting) {
      case 1:
        return 'get-hours-records';
      case 2:
        return 'get-days-records';
      default:
        return 'get-minutes-records';
    }
  }
  function getDuration(selecting: number) {
    switch (selecting) {
      case 1:
        return 60 * 60 * 72 * 1000;
      case 2:
        return 60 * 60 * 24 * 1000 * 90;
      default:
        return 60 * 60 * 1000 * 1;
    }
  }
  const [selecting, setSelecting] = useState(0);
  const recordsResp = useRequest(
    async () =>
      window.electron.ipcRenderer.invoke(
        getChannel(selecting),
        getDuration(selecting)
      ),
    { pollingInterval: 5 * 1000, refreshDeps: [selecting] }
  );
  const { theme } = useContext(GlobalCtx);
  let trueTheme: 'dark' | 'light';
  if (theme === 'system') {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      trueTheme = 'dark';
    } else {
      trueTheme = 'light';
    }
  } else {
    trueTheme = theme;
  }
  const groupData = [
    {
      name: 'Minutely',
    },
    {
      name: 'Hourly',
    },
    {
      name: 'Daily',
    },
  ];
  const groupItems = groupData.map((item, index) => {
    return (
      <button
        type="button"
        key={item.name}
        className={`${selecting === index && 'bg-zinc-500/20'}`}
        onClick={() => setSelecting(index)}
      >
        {item.name}
      </button>
    );
  });
  return (
    <>
      <div className="j-btn-group">{groupItems}</div>
      {recordsResp.data && recordsResp.data.length > 0 ? (
        <ChartsView recordsResp={recordsResp} theme={trueTheme} />
      ) : (
        <div className="inset-0 w-full h-full flex text-center align-middle justify-center items-center">
          <div>Collecting data. This will take up to 1 minute.</div>
        </div>
      )}
    </>
  );
}

type LoginItemSettings = {
  executableWillLaunchAtLogin: boolean;
  launchItems: any[];
  openAsHidden: boolean;
  openAtLogin: boolean;
  restoreState: boolean;
  wasOpenedAsHidden: boolean;
  wasOpenedAtLogin: boolean;
};

function SettingsPage() {
  const ctx = useContext(GlobalCtx);
  function active(theme: string) {
    return ctx.theme === theme;
  }

  const [loginSettings, setLoginSettings] = useState<LoginItemSettings>();
  useEffect(() => {
    window.electron.ipcRenderer.invoke('get-login-item-settings');
    window.electron.ipcRenderer.on('login-item-setting-changed', (val) => {
      const settings = val as LoginItemSettings;
      setLoginSettings(settings);
    });
  }, []);
  return (
    <div className="flex flex-col mx-4 my-2 gap-2">
      <div>
        <div className="p-2 border rounded-lg border-zinc-500/20 mb-2">
          <div className="text-sm text-zinc-500/80 py-1">Theme</div>
          <div className="flex gap-2">
            <button
              type="button"
              className={`${!active('dark') || 'j-btn-active'} j-normal-btn`}
              onClick={() => {
                localStorage.setItem('theme', 'dark');
                ctx.setTheme('dark');
              }}
            >
              Dark Mode
            </button>
            <button
              type="button"
              className={`${!active('light') || 'j-btn-active'} j-normal-btn`}
              onClick={() => {
                localStorage.setItem('theme', 'light');
                ctx.setTheme('light');
              }}
            >
              Light Mode
            </button>
            <button
              type="button"
              className={`${!active('system') || 'j-btn-active'} j-normal-btn`}
              onClick={() => {
                localStorage.setItem('theme', 'system');
                ctx.setTheme('system');
              }}
            >
              Follow System
            </button>
          </div>
        </div>
        {/* <div className="p-2 border rounded-lg border-zinc-500/20 mb-2">
          <div className="text-sm text-zinc-500/80 py-1">Development Zone</div>
          <div>
            Debug: <MySwitch />
          </div>
        </div> */}
        {loginSettings && (
          <div className="p-2 border rounded-lg border-zinc-500/20 mb-2">
            <div className="text-sm text-zinc-500/80 py-1">General</div>
            <div className="text-sm">Auto-start on boot?</div>
            <div className="flex gap-2">
              <button
                type="button"
                className={`${
                  !loginSettings.openAtLogin || 'j-btn-active'
                } j-normal-btn`}
                onClick={() => {
                  window.electron.ipcRenderer.invoke(
                    'set-login-settings',
                    true
                  );
                }}
              >
                Yes
              </button>
              <button
                type="button"
                className={`${
                  loginSettings.openAtLogin || 'j-btn-active'
                } j-normal-btn`}
                onClick={() => {
                  window.electron.ipcRenderer.invoke(
                    'set-login-settings',
                    false
                  );
                }}
              >
                No
              </button>
            </div>
          </div>
        )}
        <div className="p-2 border rounded-lg border-zinc-500/20 mb-2">
          <div className="text-sm text-zinc-500/80 py-1">Danger Zone</div>
          <MyModal
            type="danger"
            title="REMOVE ALL DATA"
            info="You can delete all local data here. Note that deleted data is not recoverable."
            action={() => {
              window.electron.ipcRenderer.invoke('clean-db-data');
            }}
          />
        </div>
      </div>
    </div>
  );
}

function StorageLabel() {
  const dbFileSizeResp = useRequest(
    async () => window.electron.ipcRenderer.invoke('get-db-file-size'),
    { pollingInterval: 5000 }
  );
  return (
    <div className="px-2">Storage: {formatFileSzie(dbFileSizeResp.data)}</div>
  );
}

function TitleBar() {
  const [systemInfo, setSystemInfo] = useState<any>({});
  useEffect(() => {
    window.electron.ipcRenderer
      .invoke('ready')
      .then((data: any) => {
        setSystemInfo(data.systemInfo);
        return data;
      })
      // eslint-disable-next-line no-console
      .catch(console.log);
  }, []);
  return (
    <div
      className="flex justify-between items-center dark:bg-zinc-800 z-10 bg-zinc-100 w-full h-7 border-b border-zinc-500/20"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      {systemInfo.platform !== 'darwin' && (
        <div className="w-16">
          <div className="w-8 p-1">{LogoSVG()}</div>
        </div>
      )}
      {systemInfo.platform !== 'darwin' && (
        <div className="text-sm leading-6 dark:text-zinc-400">
          {document.title}
        </div>
      )}
      {systemInfo.platform !== 'darwin' && (
        <div
          className="flex children:px-3 children:py-1"
          style={{ WebkitAppRegion: 'no-drag' } as any}
        >
          <div
            role="button"
            tabIndex={0}
            className="hover:bg-zinc-500 transition cursor-default"
            onClick={() => {
              return window.electron.ipcRenderer.invoke('minimize');
            }}
            onKeyDown={() => {}}
          >
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
            >
              <path d="M13.85 40.55Q13.6 40.55 13.45 40.375Q13.3 40.2 13.3 39.95Q13.3 39.75 13.45 39.6Q13.6 39.45 13.9 39.45H34.25Q34.45 39.45 34.575 39.625Q34.7 39.8 34.7 40Q34.7 40.25 34.55 40.4Q34.4 40.55 34.2 40.55Z" />
            </svg>
          </div>
          <div
            role="button"
            tabIndex={-1}
            className="hover:bg-red-500 transition cursor-default self-end"
            onClick={() => window.electron.ipcRenderer.invoke('hide')}
            onKeyDown={() => {}}
          >
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
            >
              <path d="M24 24.8 13.1 35.7Q13 35.8 12.75 35.825Q12.5 35.85 12.3 35.7Q12.15 35.5 12.15 35.275Q12.15 35.05 12.3 34.9L23.25 23.95L12.35 13.05Q12.15 12.95 12.15 12.7Q12.15 12.45 12.3 12.3Q12.5 12.1 12.725 12.1Q12.95 12.1 13.15 12.3L24 23.2L34.9 12.3Q35.05 12.15 35.3 12.125Q35.55 12.1 35.7 12.3Q35.9 12.45 35.9 12.675Q35.9 12.9 35.7 13.1L24.85 23.95L35.75 34.85Q35.85 35.05 35.875 35.275Q35.9 35.5 35.75 35.65Q35.55 35.85 35.325 35.85Q35.1 35.85 34.9 35.65Z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

function RecordingLabel() {
  const [recording, setRecording] = useState(true);
  useEffect(() => {
    window.electron.ipcRenderer.invoke('toggle-record', true);
    window.electron.ipcRenderer.on('recording-changed', (val) => {
      setRecording(val as boolean);
    });
  }, []);
  return (
    <button
      tabIndex={-2}
      type="button"
      className={`${
        recording
          ? 'bg-green-800 hover:bg-green-700'
          : 'bg-orange-800 hover:bg-orange-700'
      } px-2 cursor-pointer transition text-white`}
      onClick={() => {
        window.electron.ipcRenderer.invoke('toggle-record', [!recording]);
        setRecording(!recording);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          window.electron.ipcRenderer.invoke('toggle-record', [!recording]);
          setRecording(!recording);
        }
      }}
    >
      ● {recording ? 'RECORDING' : 'STOPPED'}
    </button>
  );
}

function App() {
  const [pageIdx, setPageIdx] = useState(0);
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('system');

  useEffect(() => {
    const currentTheme = localStorage.getItem('theme') as
      | 'system'
      | 'dark'
      | 'light'
      | undefined;
    if (!currentTheme) {
      localStorage.setItem('theme', 'system');
    } else {
      setTheme(currentTheme);
    }
  }, []);

  if (theme === 'system') {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  } else if (theme === 'dark') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }

  function MainPages({ p }: any) {
    switch (p) {
      case 0:
        return <RecentPage />;
      case 1:
        return <SettingsPage />;
      case 2:
        return <AboutPage />;
      default:
        return <RecentPage />;
    }
  }
  return (
    <GlobalCtx.Provider value={{ theme, setTheme }}>
      <div className="transition flex flex-col h-screen w-screen j-body-color">
        <TitleBar />
        <div className="flex overflow-hidden flex-grow">
          <div className="bg-zinc-500/10">
            <div className="flex flex-col h-full children:rounded-lg gap-1 p-2 children:w-14 children:p-2 children:transition">
              <button
                type="button"
                className={`cursor-pointer hover:bg-zinc-500/40 ${
                  pageIdx === 0 ? 'bg-zinc-500/20' : ''
                }`}
                onClick={() => {
                  setPageIdx(0);
                }}
              >
                <svg
                  className="cursor-pointer children:cursor-pointer"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                >
                  <path d="M24 35.65Q23.4 35.65 23 35.275Q22.6 34.9 22.6 34.3Q22.6 33.7 23 33.3Q23.4 32.9 23.95 32.9Q24.55 32.9 24.95 33.3Q25.35 33.7 25.35 34.3Q25.35 34.9 24.95 35.275Q24.55 35.65 24 35.65ZM24 39.4Q20.8 39.4 18 38.2Q15.2 37 13.1 34.9Q11 32.8 9.8 29.975Q8.6 27.15 8.6 24Q8.6 20.35 10.1 17.375Q11.6 14.4 14 12.25L25.75 24L24.95 24.8L13.95 13.8Q12.25 15.6 10.975 18.1Q9.7 20.6 9.7 24Q9.7 29.95 13.875 34.125Q18.05 38.3 24 38.3Q30 38.3 34.15 34.125Q38.3 29.95 38.3 24Q38.3 18.6 34.575 14.35Q30.85 10.1 24.45 9.65V14H23.35V8.6H23.95Q27.1 8.6 29.95 9.8Q32.8 11 34.9 13.075Q37 15.15 38.2 18Q39.4 20.85 39.4 24Q39.4 27.2 38.2 30Q37 32.8 34.9 34.9Q32.8 37 29.975 38.2Q27.15 39.4 24 39.4ZM34.3 25.35Q33.7 25.35 33.3 24.95Q32.9 24.55 32.9 23.95Q32.9 23.4 33.3 23Q33.7 22.6 34.3 22.6Q34.9 22.6 35.275 23Q35.65 23.4 35.65 23.95Q35.65 24.55 35.275 24.95Q34.9 25.35 34.3 25.35ZM13.7 25.35Q13.1 25.35 12.725 24.95Q12.35 24.55 12.35 24Q12.35 23.4 12.725 23Q13.1 22.6 13.7 22.6Q14.3 22.6 14.675 23Q15.05 23.4 15.05 23.95Q15.05 24.55 14.675 24.95Q14.3 25.35 13.7 25.35Z" />
                </svg>
              </button>
              <div className="flex-grow" />
              <button
                type="button"
                className={`cursor-pointer hover:bg-zinc-500/40 ${
                  pageIdx === 1 ? 'bg-zinc-500/20' : ''
                }`}
                onClick={() => {
                  setPageIdx(1);
                }}
              >
                <svg
                  className="cursor-pointer children:cursor-pointer"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                >
                  <path d="M21.1 41.4 20.35 35.85Q19.15 35.5 17.75 34.725Q16.35 33.95 15.4 33L10.35 35.3L7.4 30.05L11.9 26.75Q11.75 26.1 11.7 25.4Q11.65 24.7 11.65 24.05Q11.65 23.45 11.7 22.75Q11.75 22.05 11.85 21.25L7.4 17.8L10.35 12.7L15.4 14.9Q16.45 14.05 17.75 13.275Q19.05 12.5 20.3 12.15L21.1 6.6H27L27.75 12.2Q29.05 12.65 30.2 13.325Q31.35 14 32.45 14.9L37.8 12.7L40.7 17.8L36 21.35Q36.15 22.1 36.225 22.75Q36.3 23.4 36.3 24Q36.3 24.5 36.2 25.175Q36.1 25.85 35.95 26.7L40.6 30.05L37.65 35.3L32.45 32.95Q31.3 34 30.125 34.725Q28.95 35.45 27.75 35.8L27 41.4ZM23.85 28.25Q25.7 28.25 26.925 27.025Q28.15 25.8 28.15 24Q28.15 22.2 26.925 20.975Q25.7 19.75 23.9 19.75Q22.1 19.75 20.875 20.975Q19.65 22.2 19.65 24Q19.65 25.8 20.875 27.025Q22.1 28.25 23.85 28.25ZM23.9 27.15Q22.55 27.15 21.65 26.225Q20.75 25.3 20.75 24Q20.75 22.7 21.65 21.775Q22.55 20.85 23.9 20.85Q25.2 20.85 26.125 21.775Q27.05 22.7 27.05 24Q27.05 25.3 26.125 26.225Q25.2 27.15 23.9 27.15ZM24.05 23.95Q24.05 23.95 24.05 23.95Q24.05 23.95 24.05 23.95Q24.05 23.95 24.05 23.95Q24.05 23.95 24.05 23.95Q24.05 23.95 24.05 23.95Q24.05 23.95 24.05 23.95Q24.05 23.95 24.05 23.95Q24.05 23.95 24.05 23.95Q24.05 23.95 24.05 23.95Q24.05 23.95 24.05 23.95Q24.05 23.95 24.05 23.95Q24.05 23.95 24.05 23.95Q24.05 23.95 24.05 23.95Q24.05 23.95 24.05 23.95Q24.05 23.95 24.05 23.95Q24.05 23.95 24.05 23.95ZM21.95 40.3H26L26.8 34.7Q28.3 34.3 29.5 33.625Q30.7 32.95 32.05 31.7L37.2 33.9L39.15 30.45L34.65 27.1Q34.85 26.15 34.975 25.425Q35.1 24.7 35.1 24Q35.1 23.15 34.975 22.475Q34.85 21.8 34.65 21L39.25 17.55L37.3 14.1L32.05 16.3Q31.1 15.3 29.55 14.35Q28 13.4 26.75 13.2L26.05 7.7H21.95L21.4 13.2Q19.75 13.5 18.475 14.225Q17.2 14.95 15.9 16.25L10.8 14.1L8.75 17.55L13.3 20.8Q13.05 21.5 12.95 22.325Q12.85 23.15 12.85 24Q12.85 24.85 12.925 25.6Q13 26.35 13.2 27.1L8.75 30.45L10.75 33.9L15.9 31.75Q17.05 33 18.35 33.7Q19.65 34.4 21.3 34.8Z" />
                </svg>
              </button>
              <button
                type="button"
                className={`cursor-pointer hover:bg-zinc-500/40 ${
                  pageIdx === 2 ? 'bg-zinc-500/20' : ''
                }`}
                onClick={() => {
                  setPageIdx(2);
                }}
              >
                <svg
                  className="cursor-pointer children:cursor-pointer"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                >
                  <path d="M23.5 32.7H24.6V22H23.5ZM24 19.6Q24.4 19.6 24.65 19.375Q24.9 19.15 24.9 18.7Q24.9 18.25 24.65 18.025Q24.4 17.8 24 17.8Q23.55 17.8 23.325 18.025Q23.1 18.25 23.1 18.7Q23.1 19.1 23.35 19.35Q23.6 19.6 24 19.6ZM24 41.4Q20.35 41.4 17.175 40.05Q14 38.7 11.675 36.325Q9.35 33.95 7.975 30.8Q6.6 27.65 6.6 24Q6.6 20.35 7.95 17.175Q9.3 14 11.675 11.65Q14.05 9.3 17.2 7.95Q20.35 6.6 24 6.6Q27.65 6.6 30.825 7.95Q34 9.3 36.35 11.65Q38.7 14 40.05 17.175Q41.4 20.35 41.4 24Q41.4 27.65 40.05 30.825Q38.7 34 36.35 36.325Q34 38.65 30.825 40.025Q27.65 41.4 24 41.4ZM24 24Q24 24 24 24Q24 24 24 24Q24 24 24 24Q24 24 24 24Q24 24 24 24Q24 24 24 24Q24 24 24 24Q24 24 24 24ZM24 40.3Q30.75 40.3 35.525 35.525Q40.3 30.75 40.3 24Q40.3 17.25 35.525 12.475Q30.75 7.7 24 7.7Q17.25 7.7 12.475 12.475Q7.7 17.25 7.7 24Q7.7 30.75 12.475 35.525Q17.25 40.3 24 40.3Z" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex-grow overflow-x-hidden">
            <MainPages p={pageIdx} />
          </div>
        </div>

        <div className="z-20 dark:bg-zinc-800 bottom-0 w-full flex font-mono text-sm border-t border-zinc-500/20">
          <RecordingLabel />
          <StorageLabel />
        </div>
      </div>
    </GlobalCtx.Provider>
  );
}

export default App;
