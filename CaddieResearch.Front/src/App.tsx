import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';

import Home from './pages/Home';

import Cadastro from './pages/Cadastro';
import Login from './pages/Login';
import Assinaturas from './pages/Assinaturas';
import Pagamento from './pages/Pagamento';
import PagamentoSucesso from './pages/PagamentoSucesso';
import CarteiraDetalhes from './pages/CarteiraDetalhes';

import Carteiras from './pages/Dashboard/Carteiras/Carteiras';
import CarteiraInternacional from './pages/Dashboard/Carteiras/CarteiraInternacional';
import PainelGestor from './pages/Dashboard/Gestor/PainelGestor';
import GerenciarPlano from './pages/Dashboard/GerenciarPlano';
import Perfil from "./pages/Dashboard/Perfil";

import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/cadastro" element={<Cadastro />} />
                <Route path="/login" element={<Login />} />
                <Route path="/planos" element={<Assinaturas />} />
                <Route path="/pagamento-sucesso" element={<PagamentoSucesso />} />

                <Route path="/home" element={<ProtectedRoute clientOnly><DashboardLayout /></ProtectedRoute>} />
                <Route path="/carteiras" element={<ProtectedRoute clientOnly><Carteiras /></ProtectedRoute>} />
                <Route path="/carteiras/:id" element={<ProtectedRoute clientOnly><CarteiraDetalhes /></ProtectedRoute>} />
                <Route path="/carteiras/internacional" element={<ProtectedRoute clientOnly><CarteiraInternacional /></ProtectedRoute>} />
                <Route path="/pagamento" element={<ProtectedRoute clientOnly><Pagamento /></ProtectedRoute>} />
                <Route path="/gerenciar-plano" element={<ProtectedRoute clientOnly><GerenciarPlano /></ProtectedRoute>} />
                <Route path="/home/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />

                <Route path="/gestor" element={<ProtectedRoute roleRequired="Gestor"><PainelGestor /></ProtectedRoute>} />
            </Routes>
        </BrowserRouter>
    )
}

export default App;