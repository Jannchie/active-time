import { useEffect, useState } from 'react';
import Echarts from './Echarts';
import './App.css';

function App() {
  const iconStr = `data:image/png;base64,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`;
  const [systemInfo, setSystemInfo] = useState({});
  // eslint-disable-next-line no-console
  console.log(systemInfo);
  const [recording, setRecording] = useState(true);
  useEffect(() => {
    async function setInitData() {
      const newSystemInfo = await window.electron.ipcRenderer.invoke('ready');
      setSystemInfo(newSystemInfo);
    }
    window.electron.ipcRenderer.invoke('toggle-record', true);
    window.electron.ipcRenderer.on('recording-changed', (val) => {
      setRecording(val as boolean);
    });
    setInitData();
  }, []);

  return (
    <div className="h-screen w-screen dark:text-zinc-300 dark:bg-zinc-900 dark:fill-slate-100">
      <div
        className="flex justify-between items-center dark:bg-zinc-800"
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        <div className="w-16">
          <div className="w-8 p-1">
            <img src={iconStr} alt="Active Time" />
          </div>
        </div>
        <div className="text-sm leading-6 dark:text-zinc-400">
          {document.title}
        </div>
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
            className="hover:bg-red-500 transition"
            style={{ WebkitAppRegion: 'no-drag' } as any}
            onClick={() => window.electron.ipcRenderer.invoke('quit')}
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
      </div>
      <div>
        <div>
          <Echarts
            option={{
              xAxis: {
                type: 'category',
                data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              },
              yAxis: {
                type: 'value',
              },
              series: [
                {
                  data: [150, 230, 224, 218, 135, 147, 260],
                  type: 'line',
                },
              ],
            }}
          />
        </div>
      </div>

      <div className="sticky dark:bg-zinc-800 flex" style={{ top: '100vh' }}>
        <div
          tabIndex={-2}
          role="button"
          className={`${
            recording
              ? 'bg-green-800 hover:bg-green-700'
              : 'bg-orange-800 hover:bg-orange-700'
          } px-2 font-mono text-sm  cursor-pointer transition`}
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
        </div>
      </div>
    </div>
  );
}

export default App;
