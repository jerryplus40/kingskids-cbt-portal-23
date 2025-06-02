import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, Shield, GraduationCap, Award, Clock, CheckCircle, FileText, ArrowRight, Star, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section with Enhanced Design */}
      <section className="relative overflow-hidden min-h-screen flex items-center">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        </div>
        
        {/* Background Image with Fade Effect */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/lovable-uploads/e4a8a139-6d15-4362-8f9c-e7a1dd26024f.png')`
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/30 via-orange-600/40 to-slate-900/80"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent opacity-60"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
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
              
              <div className="flex flex-col sm:flex-row gap-6">
                <Link to="/login" className="group">
                  <Button size="lg" className="bg-white text-blue-900 hover:bg-gray-100 px-10 py-4 rounded-xl font-semibold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 group-hover:translate-y-1">
                    Access Portal
                    <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </Link>
                <Link to="/entrance-exam" className="group">
                  <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 px-10 py-4 rounded-xl font-semibold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300">
                    <FileText className="h-5 w-5 mr-3" />
                    Take Entrance Exam
                    <Zap className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="relative hidden lg:block">
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
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-bounce"></div>
          </div>
        </div>
      </section>

      {/* Features Section with Enhanced Design */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Zap className="h-4 w-4 mr-2" />
              Powerful Features
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Why Choose Our CBT Portal?
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Experience the future of educational assessment with our comprehensive digital platform designed for modern learning
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg hover:-translate-y-4 bg-gradient-to-br from-white to-blue-50">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-gradient-to-r from-blue-500 to-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                  <GraduationCap className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">Student Portal</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-gray-600 text-lg leading-relaxed">
                  Take exams, view results, and track academic progress with an intuitive, user-friendly interface
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg hover:-translate-y-4 bg-gradient-to-br from-white to-green-50">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-gradient-to-r from-green-500 to-green-600 w-20 h-20 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                  <BookOpen className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors duration-300">Teacher Portal</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-gray-600 text-lg leading-relaxed">
                  Create exams, manage questions, and analyze student performance with powerful analytics tools
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg hover:-translate-y-4 bg-gradient-to-br from-white to-purple-50">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-gradient-to-r from-purple-500 to-purple-600 w-20 h-20 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                  <Users className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">Parent Portal</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-gray-600 text-lg leading-relaxed">
                  Monitor your child's academic progress and stay connected with their educational journey
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg hover:-translate-y-4 bg-gradient-to-br from-white to-red-50">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-gradient-to-r from-red-500 to-red-600 w-20 h-20 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                  <Shield className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 group-hover:text-red-600 transition-colors duration-300">Admin Portal</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-gray-600 text-lg leading-relaxed">
                  Comprehensive system management with advanced analytics, reporting, and oversight capabilities
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Technology Integration Section */}
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

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-2xl p-12 border border-gray-100">
            <div className="space-y-8">
              <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                <Star className="h-4 w-4 mr-2" />
                Join Thousands of Students
              </div>
              
              <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Ready to Transform Your Learning Experience?
              </h2>
              
              <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
                Join thousands of students and educators who have already embraced the future of digital assessment and educational excellence
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center pt-4">
                <Link to="/login">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 px-12 py-4 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                    Get Started Today
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/entrance-exam">
                  <Button size="lg" variant="outline" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-12 py-4 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                    Try Demo Exam
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-2xl shadow-lg">
                <BookOpen className="h-10 w-10 text-white" />
              </div>
            </div>
            
            <h3 className="text-3xl font-bold">King's Kids Christian International High School</h3>
            <p className="text-xl text-gray-300">Computer Based Testing Portal</p>
            
            <div className="border-t border-gray-700 pt-6">
              <p className="text-gray-400">© 2024 King's Kids Christian International High School. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
