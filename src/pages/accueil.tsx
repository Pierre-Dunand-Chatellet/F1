import { Page } from '../components/Page.tsx'
import { useSeason } from '../lib/api.ts'
import { mount } from '../mount.tsx'
import { Classement } from '../sections/Classement.tsx'
import { Hero } from '../sections/Hero.tsx'
import { Sommaire } from '../sections/Sommaire.tsx'

function Accueil() {
  const { races, teams, round, stale } = useSeason()

  return (
    <Page stale={stale} bleed>
      <Hero races={races} />
      <Classement teams={teams} round={round} />
      <Sommaire races={races} teams={teams} />
    </Page>
  )
}

mount(<Accueil />)
