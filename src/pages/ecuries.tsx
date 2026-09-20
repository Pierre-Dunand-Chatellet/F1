import { Page } from '../components/Page.tsx'
import { useSeason } from '../lib/api.ts'
import { mount } from '../mount.tsx'
import { Teams } from '../sections/Teams.tsx'

function Ecuries() {
  const { teams, stale } = useSeason()

  return (
    <Page stale={stale}>
      <Teams teams={teams} />
    </Page>
  )
}

mount(<Ecuries />)
