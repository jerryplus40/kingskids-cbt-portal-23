
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, BookOpen, Users, Shield, Zap } from 'lucide-react';

const FeaturesSection = () => {
  return (
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
  );
};

export default FeaturesSection;
