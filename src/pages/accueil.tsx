import { Page } from '../components/Page.tsx'
import { useSeason } from '../lib/api.ts'
import { mount } from '../mount.tsx'
import { Hero } from '../sections/Hero.tsx'
import { LastRace } from '../sections/LastRace.tsx'
import { Sommaire } from '../sections/Sommaire.tsx'

function Accueil() {
  const { races, teams, round, stale } = useSeason()

  return (
    <Page stale={stale} bleed>
      <Hero races={races} round={round} />
      <LastRace teams={teams} />
      <Sommaire races={races} teams={teams} />
    </Page>
  )
}

mount(<Accueil />)
