import Navbar from './components/Navbar'
import Hero from './components/Hero'
import SocialProof from './components/SocialProof'
import HowItWorks from './components/HowItWorks'
import FeatureHighlights from './components/FeatureHighlights'
import AppPreview from './components/AppPreview'
import PromoBanner from './components/PromoBanner'
import FinalCTA from './components/FinalCTA'
import Footer from './components/Footer'

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <SocialProof />
        <HowItWorks />
        <FeatureHighlights />
        <AppPreview />
        <PromoBanner />
        <FinalCTA />
      </main>
      <Footer />
    </>
  )
}
