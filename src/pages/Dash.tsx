import { ipcRenderer } from 'electron'
import { useState } from 'react'
import { Btn, Flex, Panel } from 'roku-ui'
import useSWR from 'swr'
export function Dash () {
  const [range, setRange] = useState(86400)
  const data = useSWR(`list-raw-records/${range}`, async () => {
    return await ipcRenderer.invoke('list-raw-records', range)
  })
  console.log(data)
  return (
    <Flex col gap="0.5rem">
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Dashboard</h1>
      <Btn.Group value={range} setValue={setRange}>
        <Btn value={86400}>24 Hours</Btn>
        <Btn value={7 * 86400}>7 Days</Btn>
      </Btn.Group>
      <Panel padding>
        123
      </Panel>
    </Flex>
  )
}
