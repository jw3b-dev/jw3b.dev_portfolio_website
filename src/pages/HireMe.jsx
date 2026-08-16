// /hire-me — Mission Control engagement configurator (P1-17, FR-028).
import Seo from '../components/seo/Seo.jsx'
import MissionControl from '../components/mission-control/MissionControl.jsx'

export default function HireMe() {
  return (
    <>
      <Seo
        title="Hire John — Mission Control"
        description="Configure an engagement with John Wellard: pick an objective, get an honest scope and indicative price, and book a call — no wallet required."
      />
      <MissionControl className="mx-auto max-w-4xl px-5 py-16 sm:px-8" />
    </>
  )
}
