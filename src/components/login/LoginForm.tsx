
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
}

const LoginForm = ({ email, setEmail, password, setPassword }: LoginFormProps) => {
  const [selectedClass, setSelectedClass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  // Determine if current user is a student based on email
  const isStudentEmail = email === 'student@test.com';

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

  const classOptions = [
    { value: 'SS1A', label: 'SS1A' },
    { value: 'SS1B', label: 'SS1B' },
    { value: 'SS2A', label: 'SS2A' },
    { value: 'SS2B', label: 'SS2B' },
    { value: 'SS3A', label: 'SS3A' },
    { value: 'SS3B', label: 'SS3B' },
  ];

  return (
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
          {/* Only show class selection for students */}
          {isStudentEmail && (
            <div className="space-y-2">
              <Label htmlFor="class" className="text-sm font-medium text-gray-700">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Select your class" />
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
          )}
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
  );
};

export default LoginForm;
