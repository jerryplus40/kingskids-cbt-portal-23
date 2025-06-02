
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const TechnologySection = () => {
  return (
    <section className="py-24 bg-gradient-to-r from-blue-900 via-blue-800 to-purple-900 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-8">
          <div className="inline-flex items-center bg-white/10 backdrop-blur-md text-white px-6 py-3 rounded-full text-sm font-medium">
            <Zap className="h-5 w-5 mr-2" />
            Innovation at Work
          </div>
          
          <h2 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            Integrating technology into
            <span className="block text-transparent bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text">
              education
            </span>
          </h2>
          
          <p className="text-2xl text-white/90 max-w-4xl mx-auto leading-relaxed">
            Transforming the way students learn and teachers teach through innovative digital solutions and cutting-edge technology
          </p>
          
          <div className="flex justify-center pt-8">
            <Link to="/entrance-exam">
              <Button size="lg" className="bg-white text-blue-900 hover:bg-gray-100 px-12 py-4 rounded-xl font-semibold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300">
                Experience Innovation
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechnologySection;
