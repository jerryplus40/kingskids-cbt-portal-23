
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, Shield, GraduationCap } from 'lucide-react';

interface QuickDemoAccessProps {
  onQuickLogin: (role: string) => void;
}

const QuickDemoAccess = ({ onQuickLogin }: QuickDemoAccessProps) => {
  return (
    <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/90">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-xl text-center font-bold text-gray-900">
          Quick Demo Access
        </CardTitle>
        <CardDescription className="text-center text-gray-600">
          Explore different portal views instantly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={() => onQuickLogin('student')} 
          variant="outline" 
          className="w-full h-14 justify-start border-2 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 group"
        >
          <div className="bg-blue-100 p-2 rounded-lg mr-4 group-hover:bg-blue-500 transition-colors duration-300">
            <GraduationCap className="h-5 w-5 text-blue-600 group-hover:text-white" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-gray-900">Student Portal</div>
            <div className="text-sm text-gray-500">Take exams and view results</div>
          </div>
        </Button>
        <Button 
          onClick={() => onQuickLogin('teacher')} 
          variant="outline" 
          className="w-full h-14 justify-start border-2 hover:border-green-500 hover:bg-green-50 transition-all duration-300 group"
        >
          <div className="bg-green-100 p-2 rounded-lg mr-4 group-hover:bg-green-500 transition-colors duration-300">
            <BookOpen className="h-5 w-5 text-green-600 group-hover:text-white" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-gray-900">Teacher Portal</div>
            <div className="text-sm text-gray-500">Create and manage exams</div>
          </div>
        </Button>
        <Button 
          onClick={() => onQuickLogin('parent')} 
          variant="outline" 
          className="w-full h-14 justify-start border-2 hover:border-purple-500 hover:bg-purple-50 transition-all duration-300 group"
        >
          <div className="bg-purple-100 p-2 rounded-lg mr-4 group-hover:bg-purple-500 transition-colors duration-300">
            <Users className="h-5 w-5 text-purple-600 group-hover:text-white" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-gray-900">Parent Portal</div>
            <div className="text-sm text-gray-500">Monitor child's progress</div>
          </div>
        </Button>
        <Button 
          onClick={() => onQuickLogin('admin')} 
          variant="outline" 
          className="w-full h-14 justify-start border-2 hover:border-red-500 hover:bg-red-50 transition-all duration-300 group"
        >
          <div className="bg-red-100 p-2 rounded-lg mr-4 group-hover:bg-red-500 transition-colors duration-300">
            <Shield className="h-5 w-5 text-red-600 group-hover:text-white" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-gray-900">Admin Portal</div>
            <div className="text-sm text-gray-500">System management</div>
          </div>
        </Button>
        <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 text-center leading-relaxed">
            <strong>Demo credentials:</strong> Use any email above with password: <span className="font-mono bg-gray-200 px-2 py-1 rounded">password</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickDemoAccess;
