
import { Button } from '@/components/ui/button';
import { Award, ArrowRight, Star, CheckCircle, Clock, Shield, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden min-h-screen flex items-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Background Image with Better Visibility */}
      <div className="absolute inset-0">
        <img 
          src="/lovable-uploads/a37a54fd-432e-443f-8770-fd2b6f7f2605.png" 
          alt="Students using computers for testing"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/60 via-slate-900/70 to-indigo-900/80"></div>
      </div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-500"></div>
      </div>
      
      {/* Subtle overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-6">
              <div className="inline-flex items-center bg-white/10 backdrop-blur-md text-white px-6 py-3 rounded-full text-sm font-medium border border-white/20 shadow-lg hover:bg-white/20 transition-all duration-300">
                <Award className="h-5 w-5 mr-3 text-yellow-300" />
                Excellence in Digital Learning
                <Star className="h-4 w-4 ml-2 text-yellow-300" />
              </div>
              
              <h1 className="text-6xl lg:text-7xl font-bold text-white leading-tight">
                King's Kids Christian
                <span className="block text-transparent bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text">
                  International High School
                </span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-white/90 leading-relaxed max-w-2xl">
                Experience the future of education with our innovative Computer Based Testing platform. 
                Seamless, secure, and designed for excellence.
              </p>
            </div>
            
            <div className="flex flex-col gap-6 items-start">
              <Link to="/login" className="group">
                <Button size="lg" className="bg-white text-blue-900 hover:bg-gray-100 px-10 py-4 rounded-xl font-semibold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 group-hover:translate-y-1">
                  Access Portal
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </Link>
              <Link to="/entrance" className="group">
                <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 px-10 py-4 rounded-xl font-semibold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300">
                  <CheckCircle className="h-5 w-5 mr-3" />
                  Take Entrance Exam
                  <Zap className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Features Panel - Now on the right side */}
          <div className="relative hidden lg:flex justify-end">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl blur-3xl"></div>
              <div className="relative bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-2xl">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-500 p-2 rounded-full animate-pulse">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">Secure Testing Environment</p>
                      <p className="text-white/70 text-xs">Advanced proctoring technology</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-500 p-2 rounded-full animate-pulse delay-300">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">Real-time Results</p>
                      <p className="text-white/70 text-xs">Instant feedback and analytics</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-500 p-2 rounded-full animate-pulse delay-500">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">Data Protection</p>
                      <p className="text-white/70 text-xs">Enterprise-grade security</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile Features Panel */}
        <div className="relative lg:hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl blur-3xl"></div>
          <div className="relative bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="bg-green-500 p-3 rounded-full animate-pulse">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold">Secure Testing Environment</p>
                  <p className="text-white/70 text-sm">Advanced proctoring technology</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-blue-500 p-3 rounded-full animate-pulse delay-300">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold">Real-time Results</p>
                  <p className="text-white/70 text-sm">Instant feedback and analytics</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-purple-500 p-3 rounded-full animate-pulse delay-500">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold">Data Protection</p>
                  <p className="text-white/70 text-sm">Enterprise-grade security</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-bounce"></div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
