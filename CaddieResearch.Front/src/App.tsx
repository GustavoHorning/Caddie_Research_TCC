import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Navbar from './pages/Navbar'
import HeroSection from './pages/HeroSection'
import Diferenciais from './pages/Diferenciais'
import Produtos from './pages/Produtos'
import ComoFunciona from './pages/ComoFunciona'
import CTASection from './pages/CTASection'
import Footer from './pages/Footer'
import Cadastro from './pages/Cadastro'
import Login from './pages/Login'
import DashboardLayout from './pages/Dashboard/DashboardLayout'
import Carteiras from './pages/Dashboard/Carteiras/Carteiras'
import CarteiraInternacional from './pages/Dashboard/Carteiras/CarteiraInternacional'
import PainelGestor from './pages/Dashboard/Gestor/PainelGestor'
import Assinaturas from './pages/Assinaturas'
import Pagamento from './pages/Pagamento'
import GerenciarPlano from './pages/Dashboard/GerenciarPlano'

function PaginaInicial() {
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PaginaInicial />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<DashboardLayout />} />
        <Route path="/carteiras" element={<Carteiras />} />
        <Route path="/carteiras/internacional" element={<CarteiraInternacional />} />
        <Route path="/gestor" element={<PainelGestor />} />
        <Route path="/planos" element={<Assinaturas />} />
        <Route path="/pagamento" element={<Pagamento />} />
        <Route path="/gerenciar-plano" element={<GerenciarPlano />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App