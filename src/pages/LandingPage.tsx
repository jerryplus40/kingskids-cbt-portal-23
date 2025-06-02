
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import TechnologySection from '@/components/landing/TechnologySection';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/landing/Footer';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <HeroSection />
      <FeaturesSection />
      <TechnologySection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default LandingPage;
