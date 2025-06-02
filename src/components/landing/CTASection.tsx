
import { Button } from '@/components/ui/button';
import { ArrowRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const CTASection = () => {
  return (
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
              <Link to="/entrance">
                <Button size="lg" variant="outline" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-12 py-4 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                  Try Demo Exam
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
