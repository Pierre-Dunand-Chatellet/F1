import { Page } from '../components/Page.tsx'
import { useSeason } from '../lib/api.ts'
import { mount } from '../mount.tsx'
import { Calendar } from '../sections/Calendar.tsx'

function Calendrier() {
  const { races, stale } = useSeason()

  return (
    <Page stale={stale}>
      <Calendar races={races} />
    </Page>
  )
}

mount(<Calendrier />)
