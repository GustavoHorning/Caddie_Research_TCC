import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import Diferenciais from '../components/Diferenciais';
import ComoFunciona from '../components/ComoFunciona';
import Produtos from '../components/Produtos';
import CTASection from '../components/CTASection';
import Footer from '../components/Footer';

import './Home.css';

export default function Home() {
    return (
        <div className="home-container">
            <Navbar />
            <HeroSection />
            <Diferenciais />
            <ComoFunciona />
            <Produtos />
            <CTASection />
            <Footer />
        </div>
    );
}