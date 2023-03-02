/* eslint-disable no-console */
import { Btn, Flex, HolyGrail, Panel, useTheme } from 'roku-ui'
import { CarbonDashboard, CarbonSettings } from '@roku-ui/icons-carbon'
console.log('[App.tsx]', `Hello world from Electron ${process.versions.electron}!`)
function LeftMenu () {
  return (
    <Panel padding style={{ margin: 10 }}>
      <Flex direction="column" gap=".5rem">
        <Btn text hoverColor="primary">
          <CarbonDashboard width="2em" />
        </Btn>
        <Btn text hoverColor="primary">
          <CarbonSettings width="2em" />
        </Btn>
      </Flex>
    </Panel>
  )
}

function App () {
  useTheme()
  return (
    <HolyGrail
      outerLeft={<LeftMenu />}
      main={<Panel padding style={{ margin: '10px 0px' }} >123</Panel>}
      style={{ height: '100vh' }}
    />
  )
}

export default App
