
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowLeft } from 'lucide-react';
import BackgroundDecorations from '@/components/login/BackgroundDecorations';
import LoginForm from '@/components/login/LoginForm';
import QuickDemoAccess from '@/components/login/QuickDemoAccess';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    return <Navigate to={`/${user.role}`} replace />;
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      <BackgroundDecorations />

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
          <LoginForm 
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
          />
          <QuickDemoAccess onQuickLogin={quickLogin} />
        </div>
      </div>
    </div>
  );
};

export default Login;
