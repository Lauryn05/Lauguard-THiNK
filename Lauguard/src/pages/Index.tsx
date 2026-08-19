import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

const Index: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="border-b px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="h-6 w-6 text-guard-blue" />
            <span className="ml-2 text-xl font-bold">Lauguard</span>
          </div>
          <div>
            
            <Button variant="ghost" asChild>
              <Link to="/admin-login">Admin Login</Link>
            </Button>
          </div>
        </div>
      </nav>
      
      {/* Hero */}
      <div className="flex-1 flex flex-col">
        <div className="container mx-auto py-16 flex flex-col items-center text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gray-900 mb-6">
            A Custom Adversarial Prompt Preventor with Input Masking for Secure LLMs
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-xl">
            Experience our AI platform with enhanced security measures that protect your sensitive information.
          </p>
          <div className="flex gap-4">

            <Button size="lg" asChild>
              <Link to="/user-login">Start Chatting</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/admin-login">Admin Dashboard</Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="bg-guard-gray py-16">
          <div className="container mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Key Security Features</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="h-12 w-12 rounded-full bg-guard-blue/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-guard-blue" />
                </div>
                <h3 className="font-semibold text-xl mb-2">Adversarial Protection</h3>
                <p className="text-gray-600">
                  Advanced monitoring for detecting and preventing adversarial prompt attacks.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="h-12 w-12 rounded-full bg-guard-blue/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-guard-blue" />
                </div>
                <h3 className="font-semibold text-xl mb-2">Sensitive Info Masking</h3>
                <p className="text-gray-600">
                  Automatic detection and masking of sensitive information like emails and API keys.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="h-12 w-12 rounded-full bg-guard-blue/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-guard-blue" />
                </div>
                <h3 className="font-semibold text-xl mb-2">Detailed Logging</h3>
                <p className="text-gray-600">
                  Comprehensive logging and visualization of all user interactions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6">
        <div className="container mx-auto text-center">
          <p>© 2025 Lauguard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
