
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { BookOpen, Users, Shield, GraduationCap } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, login } = useAuth();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-4 rounded-full">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">King's Kids Christian International High School</h1>
          <p className="text-xl text-gray-600">Computer Based Testing Portal</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Login to Your Account</CardTitle>
              <CardDescription className="text-center">
                Enter your credentials to access the CBT portal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl text-center">Quick Demo Access</CardTitle>
              <CardDescription className="text-center">
                Click any role below to demo the portal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => quickLogin('student')} 
                variant="outline" 
                className="w-full justify-start"
              >
                <GraduationCap className="mr-2 h-4 w-4" />
                Student Portal
              </Button>
              <Button 
                onClick={() => quickLogin('teacher')} 
                variant="outline" 
                className="w-full justify-start"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Teacher Portal
              </Button>
              <Button 
                onClick={() => quickLogin('parent')} 
                variant="outline" 
                className="w-full justify-start"
              >
                <Users className="mr-2 h-4 w-4" />
                Parent Portal
              </Button>
              <Button 
                onClick={() => quickLogin('admin')} 
                variant="outline" 
                className="w-full justify-start"
              >
                <Shield className="mr-2 h-4 w-4" />
                Admin Portal
              </Button>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 text-center">
                  Demo credentials: Any email above with password: <strong>password</strong>
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
