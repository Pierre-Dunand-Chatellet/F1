import { Page } from '../components/Page.tsx'
import { mount } from '../mount.tsx'
import { History } from '../sections/History.tsx'

// Seule page a ne rien demander au reseau : son contenu est editorial.
function Histoire() {
  return (
    <Page>
      <History />
    </Page>
  )
}

mount(<Histoire />)
