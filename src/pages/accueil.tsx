import { Page } from '../components/Page.tsx'
import { useSeason } from '../lib/api.ts'
import { nextRace } from '../lib/season.ts'
import { mount } from '../mount.tsx'
import { NextRace } from '../sections/Calendar.tsx'
import { Classement } from '../sections/Classement.tsx'
import { Hero } from '../sections/Hero.tsx'
import { Sommaire } from '../sections/Sommaire.tsx'

function Accueil() {
  const { races, teams, round, stale } = useSeason()
  const upcoming = nextRace(races)

  return (
    <Page stale={stale} bleed>
      <Hero races={races} round={round} />
      <Classement teams={teams} round={round} />
      <Sommaire races={races} teams={teams} />
      {upcoming && (
        <section className="px-[var(--gutter)] pb-[12vh]">
          <NextRace race={upcoming} />
        </section>
      )}
    </Page>
  )
}

mount(<Accueil />)
