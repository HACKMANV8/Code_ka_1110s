'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import SplitText from '@/components/SplitText';

export const dynamic = 'force-dynamic'

export default function Home() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        setIsDark(true);
      }
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    }
  };

  const features = [
    {
      title: 'AI-Powered Detection',
      description: 'Advanced machine learning monitors student behavior in real-time.'
    },
    {
      title: 'Live Monitoring',
      description: 'Watch exams as they happen with WebRTC streaming and instant alerts.'
    },
    {
      title: 'Advanced Analytics',
      description: 'Comprehensive reports with detailed behavioral insights and metrics.'
    },
    {
      title: 'Enterprise Security',
      description: 'End-to-end encryption and GDPR-compliant data privacy protection.'
    },
    {
      title: 'AI-Assisted Review',
      description: 'Help students learn with AI-driven insights and recommendations.'
    },
    {
      title: 'Easy Question Creation',
      description: 'Create exams with AI assistance for question framing and structure.'
    }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-gray-900'}`}
      style={{
        backgroundImage: isDark 
          ? 'none' 
          : 'radial-gradient(circle, #93c5fd 1px, transparent 1px)',
        backgroundSize: isDark ? 'auto' : '25px 25px',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Navigation */}
      <nav className={`border-b ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-gray-200 bg-white/50'} backdrop-blur-sm sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="font-bold text-lg">Drishti</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#features" className={`${isDark ? 'hover:text-blue-400' : 'hover:text-blue-600'} transition`}>Features</a>
            <a href="#how" className={`${isDark ? 'hover:text-blue-400' : 'hover:text-blue-600'} transition`}>How it works</a>
            <a href="#cta" className={`${isDark ? 'hover:text-blue-400' : 'hover:text-blue-600'} transition`}>Get started</a>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'}`}
              aria-label="Toggle theme"
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            <Link href="/login" className={`px-4 py-2 text-sm transition ${isDark ? 'hover:text-blue-400' : 'hover:text-blue-600'}`}>
              Sign in
            </Link>
            <Link href="/signup" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative w-full py-16 text-center overflow-hidden" style={{ minHeight: '500px' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto">
          <div className={`inline-block px-4 py-1 rounded-full text-sm font-medium mb-4 ${isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
            AI-Powered Proctoring
          </div>
          <div className="mb-4">
            <SplitText
              text="Secure Exams with Drishti"
              tag="h1"
              className="text-5xl sm:text-6xl font-bold leading-tight"
              delay={50}
              duration={0.6}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 40 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.1}
              rootMargin="-100px"
            />
          </div>
          <p className={`text-lg mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Create, monitor, and review exams with AI-assisted integrity protection.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Start for free
            </Link>
            <Link
              href="/login"
              className={`px-8 py-3 rounded-lg border transition font-medium ${isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-gray-300 hover:bg-gray-50'}`}
            >
              Sign in
            </Link>
          </div>

          {/* Quick stats */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className={`p-3 rounded-lg border ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-gray-200 bg-gray-50'}`}>
              <div className="text-2xl font-bold text-blue-600">99.9%</div>
              <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Uptime</div>
            </div>
            <div className={`p-3 rounded-lg border ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-gray-200 bg-gray-50'}`}>
              <div className="text-2xl font-bold text-blue-600">100%</div>
              <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Encrypted</div>
            </div>
            <div className={`p-3 rounded-lg border ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-gray-200 bg-gray-50'}`}>
              <div className="text-2xl font-bold text-blue-600">24/7</div>
              <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Support</div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={`py-12 ${isDark ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">Everything you need</h2>
            <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Comprehensive features for secure online exams
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`p-5 rounded-lg border transition hover:border-blue-500 hover:shadow-lg ${isDark ? 'border-slate-700 hover:bg-slate-700/30' : 'border-gray-200 hover:bg-blue-50/30'}`}
              >
                <h3 className="text-base font-semibold mb-2 text-blue-600">{feature.title}</h3>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">Why Drishti?</h2>
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Built for educators and institutions worldwide
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className={`p-7 rounded-lg border ${isDark ? 'border-slate-700 bg-slate-800/20' : 'border-gray-200 bg-white'}`}>
            <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center mb-3 text-lg font-bold">✓</div>
            <h3 className="text-lg font-bold mb-2">Real-Time Monitoring</h3>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Watch exams as they happen with live WebRTC streaming and instant alerts for suspicious activities.
            </p>
          </div>
          <div className={`p-7 rounded-lg border ${isDark ? 'border-slate-700 bg-slate-800/20' : 'border-gray-200 bg-white'}`}>
            <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center mb-3 text-lg font-bold">✓</div>
            <h3 className="text-lg font-bold mb-2">AI-Powered Detection</h3>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Advanced machine learning algorithms detect behavioral anomalies with high precision in real-time.
            </p>
          </div>
          <div className={`p-7 rounded-lg border ${isDark ? 'border-slate-700 bg-slate-800/20' : 'border-gray-200 bg-white'}`}>
            <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center mb-3 text-lg font-bold">✓</div>
            <h3 className="text-lg font-bold mb-2">Comprehensive Analytics</h3>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Detailed reports with focus scores, behavioral insights, video recordings, and actionable metrics.
            </p>
          </div>
          <div className={`p-7 rounded-lg border ${isDark ? 'border-slate-700 bg-slate-800/20' : 'border-gray-200 bg-white'}`}>
            <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center mb-3 text-lg font-bold">✓</div>
            <h3 className="text-lg font-bold mb-2">Enterprise Security</h3>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              End-to-end encryption, role-based access control, and GDPR-compliant data privacy protection.
            </p>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className={`py-20 ${isDark ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Built for All Exam Types</h2>
            <p className={`text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Flexible solutions for different educational needs
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className={`p-6 rounded-lg border ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-gray-200 bg-white'}`}>
              <h3 className="text-lg font-bold text-blue-600 mb-2">📚 University Exams</h3>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Proctor large-scale final exams and assessments with advanced proctoring capabilities.
              </p>
            </div>
            <div className={`p-6 rounded-lg border ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-gray-200 bg-white'}`}>
              <h3 className="text-lg font-bold text-blue-600 mb-2">🏢 Certification Tests</h3>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Ensure integrity of professional certification exams with strict monitoring.
              </p>
            </div>
            <div className={`p-6 rounded-lg border ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-gray-200 bg-white'}`}>
              <h3 className="text-lg font-bold text-blue-600 mb-2">🎓 Admission Tests</h3>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Maintain credibility of entrance exams with reliable remote proctoring.
              </p>
            </div>
            <div className={`p-6 rounded-lg border ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-gray-200 bg-white'}`}>
              <h3 className="text-lg font-bold text-blue-600 mb-2">💼 Corporate Training</h3>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Assess employee knowledge with secure and verified online assessments.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section id="how" className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">How it works</h2>
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Simple setup, powerful monitoring
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className={`text-center p-8 rounded-lg border ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-gray-200 bg-gray-50'}`}>
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
              1
            </div>
            <h3 className="text-xl font-semibold mb-3">Create Exam</h3>
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Set up your exam with questions, duration, and monitoring settings.
            </p>
          </div>
          <div className={`text-center p-8 rounded-lg border ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-gray-200 bg-gray-50'}`}>
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
              2
            </div>
            <h3 className="text-xl font-semibold mb-3">Monitor Students</h3>
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              AI monitors behavior in real-time and flags suspicious activities.
            </p>
          </div>
          <div className={`text-center p-8 rounded-lg border ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-gray-200 bg-gray-50'}`}>
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
              3
            </div>
            <h3 className="text-xl font-semibold mb-3">Review Results</h3>
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Access detailed reports and video recordings for comprehensive review.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className={`py-12 ${isDark ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className={`text-lg mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Join educational institutions using Drishti for secure exams.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Start for free
            </Link>
            <Link
              href="/login"
              className={`px-8 py-3 rounded-lg border transition font-medium ${isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-gray-300 hover:bg-gray-50'}`}
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t ${isDark ? 'border-slate-800 bg-slate-900/30' : 'border-gray-200'} py-12 px-6 lg:px-8`}>
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="font-bold text-lg">Drishti</span>
          </div>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
            AI-assisted exam creation, monitoring and review.
          </p>
          <p className={`${isDark ? 'text-gray-500' : 'text-gray-500'} text-xs mt-4`}>
            © 2025 Drishti. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
