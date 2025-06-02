
import { BookOpen } from 'lucide-react';

const Footer = () => {
  return (
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
  );
};

export default Footer;
