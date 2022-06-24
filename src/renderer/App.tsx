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
import Echarts from './Echarts';
import './App.css';
import { getPieOpitons, getMinutesHistory } from './options';

type GlobalData = {
  theme: 'system' | 'dark' | 'light';
  setTheme: (theme: string) => void;
};

const GlobalCtx = createContext<GlobalData>({
  theme: 'system',
  setTheme: () => {},
});

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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-300"
                  >
                    {title}
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">{info}</p>
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      className="inline-flex mr-4 justify-center rounded-md bg-zinc-500/20 hover:bg-zinc-500/40 px-4 py-2 transition cursor-pointer"
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

function RecentPage({ minutesRecordsResp }: { minutesRecordsResp: any }) {
  const { theme } = useContext(GlobalCtx);
  let trueSystem: 'dark' | 'light';
  if (theme === 'system') {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      trueSystem = 'dark';
    } else {
      trueSystem = 'light';
    }
  } else {
    trueSystem = theme;
  }
  return (
    <div>
      <div>
        <Echarts
          option={getPieOpitons(minutesRecordsResp.data, 'event')}
          height={300}
          width="100%"
          theme={trueSystem}
          loading={minutesRecordsResp.loading}
        />
      </div>
      <div>
        <Echarts
          option={getMinutesHistory(minutesRecordsResp.data)}
          height={300}
          width="100%"
          theme={trueSystem}
          loading={minutesRecordsResp.loading}
        />
      </div>
    </div>
  );
}

function SettingsPage() {
  const ctx = useContext(GlobalCtx);
  function active(theme: string) {
    return ctx.theme === theme;
  }
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

function App() {
  const iconStr = `data:image/png;base64,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`;
  const [pageIdx, setPageIdx] = useState(0);
  const [systemInfo, setSystemInfo] = useState<any>({});
  const [theme, setTheme] = useState('system');
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
  useEffect(() => {
    const currentTheme = localStorage.getItem('theme');
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

  const minutesRecordsResp = useRequest(
    async () =>
      window.electron.ipcRenderer.invoke(
        'get-minutes-records',
        60 * 60 * 1000 * 1
      ),
    { pollingInterval: 60 * 1000 }
  );
  const dbFileSizeResp = useRequest(
    async () => window.electron.ipcRenderer.invoke('get-db-file-size'),
    { pollingInterval: 5000 }
  );
  const [recording, setRecording] = useState(true);
  useEffect(() => {
    window.electron.ipcRenderer.invoke('toggle-record', true);
    window.electron.ipcRenderer.on('recording-changed', (val) => {
      setRecording(val as boolean);
    });
  }, []);
  function Page({ p }: any) {
    switch (p) {
      case 0:
        return <RecentPage minutesRecordsResp={minutesRecordsResp} />;
      case 1:
        return <SettingsPage />;
      default:
        return <RecentPage minutesRecordsResp={minutesRecordsResp} />;
    }
  }
  return (
    <GlobalCtx.Provider value={{ theme, setTheme }}>
      <div className="flex flex-col h-screen w-screen dark:text-zinc-300 text-zinc-800 dark:bg-zinc-900 bg-zinc-100 dark:fill-slate-100 overflow-clip">
        <div
          className="flex justify-between items-center dark:bg-zinc-800 z-10 bg-zinc-100 w-full h-7"
          style={{ WebkitAppRegion: 'drag' } as any}
        >
          {systemInfo.platform !== 'darwin' && (
            <div className="w-16">
              <div className="w-8 p-1">
                <img src={iconStr} alt="Active Time" />
              </div>
            </div>
          )}
          {systemInfo.platform !== 'darwin' && (
            <div className="text-sm leading-6 dark:text-zinc-400">
              {document.title}
            </div>
          )}
          {systemInfo.platform !== 'darwin' && (
            <div className="flex children:px-3 children:py-1">
              <div
                role="button"
                tabIndex={0}
                className="hover:bg-zinc-500 transition"
                style={{ WebkitAppRegion: 'no-drag' } as any}
                onClick={() => {
                  return window.electron.ipcRenderer.invoke('hide');
                }}
                onKeyDown={() => {}}
              >
                <svg
                  className="h-6 w-6 cursor-pointer"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                >
                  <path d="M13.85 40.55Q13.6 40.55 13.45 40.375Q13.3 40.2 13.3 39.95Q13.3 39.75 13.45 39.6Q13.6 39.45 13.9 39.45H34.25Q34.45 39.45 34.575 39.625Q34.7 39.8 34.7 40Q34.7 40.25 34.55 40.4Q34.4 40.55 34.2 40.55Z" />
                </svg>
              </div>
              <div
                role="button"
                tabIndex={-1}
                className="hover:bg-red-500 transition"
                style={{ WebkitAppRegion: 'no-drag' } as any}
                onClick={() => window.electron.ipcRenderer.invoke('quit')}
                onKeyDown={() => {}}
              >
                <svg
                  className="h-6 w-6 cursor-pointer"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                >
                  <path d="M24 24.8 13.1 35.7Q13 35.8 12.75 35.825Q12.5 35.85 12.3 35.7Q12.15 35.5 12.15 35.275Q12.15 35.05 12.3 34.9L23.25 23.95L12.35 13.05Q12.15 12.95 12.15 12.7Q12.15 12.45 12.3 12.3Q12.5 12.1 12.725 12.1Q12.95 12.1 13.15 12.3L24 23.2L34.9 12.3Q35.05 12.15 35.3 12.125Q35.55 12.1 35.7 12.3Q35.9 12.45 35.9 12.675Q35.9 12.9 35.7 13.1L24.85 23.95L35.75 34.85Q35.85 35.05 35.875 35.275Q35.9 35.5 35.75 35.65Q35.55 35.85 35.325 35.85Q35.1 35.85 34.9 35.65Z" />
                </svg>
              </div>
            </div>
          )}
        </div>
        <div className="flex overflow-hidden flex-grow">
          <div className="bg-zinc-500/10">
            <div className="flex flex-col children:rounded-lg gap-1 p-2 children:w-14 children:p-2 children:transition children:cursor-pointer">
              <div
                className={`hover:bg-zinc-500/40 ${
                  pageIdx === 0 ? 'bg-zinc-500/20' : ''
                }`}
                onClick={() => {
                  setPageIdx(0);
                }}
                tabIndex={-4}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    setPageIdx(0);
                  }
                }}
                role="button"
              >
                <svg
                  className="cursor-pointer"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                >
                  <path d="M24 35.65Q23.4 35.65 23 35.275Q22.6 34.9 22.6 34.3Q22.6 33.7 23 33.3Q23.4 32.9 23.95 32.9Q24.55 32.9 24.95 33.3Q25.35 33.7 25.35 34.3Q25.35 34.9 24.95 35.275Q24.55 35.65 24 35.65ZM24 39.4Q20.8 39.4 18 38.2Q15.2 37 13.1 34.9Q11 32.8 9.8 29.975Q8.6 27.15 8.6 24Q8.6 20.35 10.1 17.375Q11.6 14.4 14 12.25L25.75 24L24.95 24.8L13.95 13.8Q12.25 15.6 10.975 18.1Q9.7 20.6 9.7 24Q9.7 29.95 13.875 34.125Q18.05 38.3 24 38.3Q30 38.3 34.15 34.125Q38.3 29.95 38.3 24Q38.3 18.6 34.575 14.35Q30.85 10.1 24.45 9.65V14H23.35V8.6H23.95Q27.1 8.6 29.95 9.8Q32.8 11 34.9 13.075Q37 15.15 38.2 18Q39.4 20.85 39.4 24Q39.4 27.2 38.2 30Q37 32.8 34.9 34.9Q32.8 37 29.975 38.2Q27.15 39.4 24 39.4ZM34.3 25.35Q33.7 25.35 33.3 24.95Q32.9 24.55 32.9 23.95Q32.9 23.4 33.3 23Q33.7 22.6 34.3 22.6Q34.9 22.6 35.275 23Q35.65 23.4 35.65 23.95Q35.65 24.55 35.275 24.95Q34.9 25.35 34.3 25.35ZM13.7 25.35Q13.1 25.35 12.725 24.95Q12.35 24.55 12.35 24Q12.35 23.4 12.725 23Q13.1 22.6 13.7 22.6Q14.3 22.6 14.675 23Q15.05 23.4 15.05 23.95Q15.05 24.55 14.675 24.95Q14.3 25.35 13.7 25.35Z" />
                </svg>
              </div>
              <div
                className={`hover:bg-zinc-500/40 ${
                  pageIdx === 1 ? 'bg-zinc-500/20' : ''
                }`}
                onClick={() => {
                  setPageIdx(1);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    setPageIdx(1);
                  }
                }}
                tabIndex={-5}
                role="button"
              >
                <svg
                  className="cursor-pointer"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                >
                  <path d="M21.1 41.4 20.35 35.85Q19.15 35.5 17.75 34.725Q16.35 33.95 15.4 33L10.35 35.3L7.4 30.05L11.9 26.75Q11.75 26.1 11.7 25.4Q11.65 24.7 11.65 24.05Q11.65 23.45 11.7 22.75Q11.75 22.05 11.85 21.25L7.4 17.8L10.35 12.7L15.4 14.9Q16.45 14.05 17.75 13.275Q19.05 12.5 20.3 12.15L21.1 6.6H27L27.75 12.2Q29.05 12.65 30.2 13.325Q31.35 14 32.45 14.9L37.8 12.7L40.7 17.8L36 21.35Q36.15 22.1 36.225 22.75Q36.3 23.4 36.3 24Q36.3 24.5 36.2 25.175Q36.1 25.85 35.95 26.7L40.6 30.05L37.65 35.3L32.45 32.95Q31.3 34 30.125 34.725Q28.95 35.45 27.75 35.8L27 41.4ZM23.85 28.25Q25.7 28.25 26.925 27.025Q28.15 25.8 28.15 24Q28.15 22.2 26.925 20.975Q25.7 19.75 23.9 19.75Q22.1 19.75 20.875 20.975Q19.65 22.2 19.65 24Q19.65 25.8 20.875 27.025Q22.1 28.25 23.85 28.25ZM23.9 27.15Q22.55 27.15 21.65 26.225Q20.75 25.3 20.75 24Q20.75 22.7 21.65 21.775Q22.55 20.85 23.9 20.85Q25.2 20.85 26.125 21.775Q27.05 22.7 27.05 24Q27.05 25.3 26.125 26.225Q25.2 27.15 23.9 27.15ZM24.05 23.95Q24.05 23.95 24.05 23.95Q24.05 23.95 24.05 23.95Q24.05 23.95 24.05 23.95Q24.05 23.95 24.05 23.95Q24.05 23.95 24.05 23.95Q24.05 23.95 24.05 23.95Q24.05 23.95 24.05 23.95Q24.05 23.95 24.05 23.95Q24.05 23.95 24.05 23.95Q24.05 23.95 24.05 23.95Q24.05 23.95 24.05 23.95Q24.05 23.95 24.05 23.95Q24.05 23.95 24.05 23.95Q24.05 23.95 24.05 23.95Q24.05 23.95 24.05 23.95Q24.05 23.95 24.05 23.95ZM21.95 40.3H26L26.8 34.7Q28.3 34.3 29.5 33.625Q30.7 32.95 32.05 31.7L37.2 33.9L39.15 30.45L34.65 27.1Q34.85 26.15 34.975 25.425Q35.1 24.7 35.1 24Q35.1 23.15 34.975 22.475Q34.85 21.8 34.65 21L39.25 17.55L37.3 14.1L32.05 16.3Q31.1 15.3 29.55 14.35Q28 13.4 26.75 13.2L26.05 7.7H21.95L21.4 13.2Q19.75 13.5 18.475 14.225Q17.2 14.95 15.9 16.25L10.8 14.1L8.75 17.55L13.3 20.8Q13.05 21.5 12.95 22.325Q12.85 23.15 12.85 24Q12.85 24.85 12.925 25.6Q13 26.35 13.2 27.1L8.75 30.45L10.75 33.9L15.9 31.75Q17.05 33 18.35 33.7Q19.65 34.4 21.3 34.8Z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="flex-grow overflow-x-hidden">
            <Page p={pageIdx} />
          </div>
        </div>

        <div className="z-20 dark:bg-zinc-800 bottom-0 w-full flex font-mono text-sm">
          <div
            tabIndex={-2}
            role="button"
            className={`${
              recording
                ? 'bg-green-800 hover:bg-green-700'
                : 'bg-orange-800 hover:bg-orange-700'
            } px-2 cursor-pointer transition`}
            onClick={() => {
              window.electron.ipcRenderer.invoke('toggle-record', [!recording]);
              setRecording(!recording);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                window.electron.ipcRenderer.invoke('toggle-record', [
                  !recording,
                ]);
                setRecording(!recording);
              }
            }}
          >
            ● {recording ? 'RECORDING' : 'STOPPED'}
          </div>
          <div className="px-2">
            Storage: {formatFileSzie(dbFileSizeResp.data)}
          </div>
        </div>
      </div>
    </GlobalCtx.Provider>
  );
}

export default App;
