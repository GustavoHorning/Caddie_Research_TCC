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
import CarteiraDetalhes from './pages/CarteiraDetalhes';
import RelatoriosGestor from './pages/Dashboard/RelatoriosGestor'
import ClientesGestor from './pages/Dashboard/ClientesGestor'
import Perfil from "./pages/Dashboard/Perfil";
import ProtectedRoute from './pages/ProtectedRoute'
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

                <Route path="/home" element={<ProtectedRoute clientOnly><DashboardLayout /></ProtectedRoute>} />
                <Route path="/carteiras" element={<ProtectedRoute clientOnly><Carteiras /></ProtectedRoute>} />
                <Route path="/carteiras/:id" element={<ProtectedRoute clientOnly><CarteiraDetalhes /></ProtectedRoute>} />
                <Route path="/carteiras/internacional" element={<ProtectedRoute clientOnly><CarteiraInternacional /></ProtectedRoute>} />
                <Route path="/planos" element={<Assinaturas />} />
                <Route path="/pagamento" element={<ProtectedRoute clientOnly><Pagamento /></ProtectedRoute>} />
                <Route path="/gerenciar-plano" element={<ProtectedRoute clientOnly><GerenciarPlano /></ProtectedRoute>} />

                <Route path="/home/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />

                <Route path="/gestor" element={<ProtectedRoute roleRequired="Gestor"><PainelGestor /></ProtectedRoute>} />

            </Routes>
        </BrowserRouter>
    )
}

export default App