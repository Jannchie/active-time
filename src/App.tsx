import { Btn, Flex, HolyGrail, Panel, useTheme } from 'roku-ui'
import { CarbonDashboard, CarbonSettings } from '@roku-ui/icons-carbon'
import { NavLink, Outlet } from 'react-router-dom'
// eslint-disable-next-line no-console
console.log('[App.tsx]', `Hello world from Electron ${process.versions.electron}!`)

function NavBtn ({ to, children }: {
  to: string
  children: React.ReactNode
}) {
  return <NavLink to={to}>
    {
      ({ isActive }) => isActive
        ? (
          <Btn color="primary" >
            { children }
          </Btn>
        )
        : (
          <Btn text hoverColor="primary">
            { children }
          </Btn>
        )
    }
  </NavLink>
}

function LeftMenu () {
  return (
    <Panel padding style={{ margin: 10, alignSelf: 'stretch' }}>
      <Flex col gap=".5rem">
        <NavBtn to="/" >
          <CarbonDashboard width="2em" />
        </NavBtn>
        <NavBtn to="/settings">
          <CarbonSettings width="2em" />
        </NavBtn>
      </Flex>
    </Panel>
  )
}

function App () {
  useTheme()
  return (
    <HolyGrail
      header={<Panel border style={{ borderRadius: 0, height: 35, WebkitAppRegion: 'drag' } as any} />}
      innerLeft={<LeftMenu />}
      main={(
        <div style={{ marginTop: '0.5rem' }}>
          <Outlet />
        </div>)}
      footer={<Panel border style={{ borderRadius: 0 }}>
        <Flex>
          <div style={{
            backgroundColor: 'hsl(var(--r-success-1))',
            fontSize: '0.75rem',
            paddingLeft: 10,
            paddingRight: 10,
          }}>Recording</div>
        </Flex>
      </Panel>}
    />
  )
}

export default App
