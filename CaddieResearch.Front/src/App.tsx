import './index.css'
import Navbar from './pages/Navbar'
import HeroSection from './pages/HeroSection'
import Diferenciais from './pages/Diferenciais'
import Produtos from './pages/Produtos'
import ComoFunciona from './pages/ComoFunciona'
import CTASection from './pages/CTASection'
import Footer from './pages/Footer'

function App() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <Diferenciais />
      <Produtos />
      <ComoFunciona />
      <CTASection />
      <Footer />
    </>
  )
}

export default App