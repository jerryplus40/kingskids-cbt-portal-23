import { useState } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { BookOpen, Users, Shield, GraduationCap, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  if (user) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const success = await login(email, password);
    
    if (success) {
      toast({
        title: "Login successful",
        description: "Welcome to King's Kids CBT Portal",
      });
    } else {
      toast({
        title: "Login failed",
        description: "Invalid email or password",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const quickLogin = (role: string) => {
    const credentials = {
      student: { email: 'student@test.com', password: 'password' },
      teacher: { email: 'teacher@test.com', password: 'password' },
      parent: { email: 'parent@test.com', password: 'password' },
      admin: { email: 'admin@test.com', password: 'password' },
    };
    
    const cred = credentials[role as keyof typeof credentials];
    setEmail(cred.email);
    setPassword(cred.password);
  };

  const handleBackToHome = () => {
    navigate('/landing');
  };

  const classOptions = [
    { value: 'js1', label: 'JS 1' },
    { value: 'js2', label: 'JS 2' },
    { value: 'js3', label: 'JS 3' },
    { value: 'ss1', label: 'SS 1' },
    { value: 'ss2', label: 'SS 2' },
    { value: 'ss3', label: 'SS 3' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 left-1/2 transform -translate-x-1/2 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      <div className="w-full max-w-5xl relative">
        {/* Back to Home */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={handleBackToHome}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 hover:bg-blue-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>

        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full shadow-lg">
              <BookOpen className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Welcome Back</h1>
          <p className="text-xl text-gray-600">Access your King's Kids CBT Portal</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/90">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl text-center font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Sign In to Your Account
              </CardTitle>
              <CardDescription className="text-center text-gray-600">
                Enter your credentials to access the portal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class" className="text-sm font-medium text-gray-700">Class (For Students)</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Select your class (optional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                      {classOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Signing In...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

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
                onClick={() => quickLogin('student')} 
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
                onClick={() => quickLogin('teacher')} 
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
                onClick={() => quickLogin('parent')} 
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
                onClick={() => quickLogin('admin')} 
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
        </div>
      </div>
    </div>
  );
};

export default Login;
