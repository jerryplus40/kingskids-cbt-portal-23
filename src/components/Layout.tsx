
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, Bell, Menu, Home } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { user, logout } = useAuth();

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-gradient-to-r from-red-500 to-red-600 text-white';
      case 'teacher': return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
      case 'parent': return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white';
      case 'student': return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/landing" className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors duration-200">
                <Home className="h-5 w-5" />
                <span className="hidden sm:block text-sm font-medium">Home</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {title}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" className="relative hover:bg-blue-50 border-blue-200">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              </Button>
              
              <div className="flex items-center space-x-3 bg-gradient-to-r from-gray-50 to-blue-50 px-4 py-2 rounded-full border border-gray-200">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-full">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-900">{user?.name}</span>
                  <Badge className={`text-xs px-2 py-1 ${getRoleBadgeColor(user?.role || '')} border-0`}>
                    {user?.role?.toUpperCase()}
                  </Badge>
                </div>
              </div>
              
              <Button 
                onClick={logout} 
                variant="outline" 
                size="sm"
                className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:block">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 min-h-[600px]">
          {children}
        </div>
      </main>
    </div>
  );
};
