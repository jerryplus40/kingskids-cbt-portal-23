
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, Shield, GraduationCap, Award, Clock, CheckCircle, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
      {/* Hero Section with Background Image */}
      <section className="relative overflow-hidden">
        {/* Background Image with Gradient Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/lovable-uploads/e4a8a139-6d15-4362-8f9c-e7a1dd26024f.png')`
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 opacity-85"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium border border-white/30">
                  <Award className="h-4 w-4 mr-2" />
                  Excellence in Digital Learning
                </div>
                <h1 className="text-5xl font-bold text-white leading-tight">
                  King's Kids Christian
                  <span className="text-blue-200 block">International High School</span>
                </h1>
                <p className="text-xl text-white/90 leading-relaxed">
                  Empowering students through innovative Computer Based Testing technology. 
                  Experience seamless, secure, and efficient digital assessments designed for the future of education.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/login">
                  <Button size="lg" className="bg-white text-blue-800 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                    Access Portal
                  </Button>
                </Link>
                <Button size="lg" className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                  <FileText className="h-5 w-5 mr-2" />
                  Take Entrance Examination
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -bottom-6 -right-6 bg-white/10 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Secure Testing</p>
                    <p className="text-xs text-white/70">Advanced proctoring</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our CBT Portal?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the future of educational assessment with our comprehensive digital platform
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-2">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  <GraduationCap className="h-8 w-8 text-blue-600 group-hover:text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">Student Portal</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-gray-600">
                  Take exams, view results, and track academic progress with an intuitive interface
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-2">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-green-100 w-16 h-16 rounded-full flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors duration-300">
                  <BookOpen className="h-8 w-8 text-green-600 group-hover:text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">Teacher Portal</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-gray-600">
                  Create exams, manage questions, and analyze student performance efficiently
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-2">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-blue-800 w-16 h-16 rounded-full flex items-center justify-center group-hover:bg-blue-900 group-hover:text-white transition-colors duration-300">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">Parent Portal</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-gray-600">
                  Monitor your child's academic progress and stay connected with their education
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-2">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors duration-300">
                  <Shield className="h-8 w-8 text-red-600 group-hover:text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">Admin Portal</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-gray-600">
                  Comprehensive system management with advanced analytics and reporting
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Integrating Technology Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <h2 className="text-4xl md:text-6xl font-bold mb-4">
              Integrating technology into education
            </h2>
            <p className="text-xl opacity-90 max-w-3xl mx-auto">
              Transforming the way students learn and teachers teach through innovative digital solutions
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Transform Your Learning Experience?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of students and educators who have already embraced the future of digital assessment
          </p>
          <Link to="/login">
            <Button size="lg" className="bg-blue-700 text-white hover:bg-blue-800 px-12 py-4 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300">
              Get Started Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-600 p-3 rounded-full">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-2">King's Kids Christian International High School</h3>
            <p className="text-gray-400 mb-4">Computer Based Testing Portal</p>
            <p className="text-sm text-gray-500">© 2024 King's Kids Christian International High School. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
