'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Home() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'AI-Powered Detection',
      description: 'Advanced machine learning algorithms monitor student behavior in real-time.'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Live Monitoring',
      description: 'Watch student exams live with WebRTC streaming and instant alert notifications.'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Analytics Dashboard',
      description: 'Comprehensive reporting with focus scores and detailed session analytics.'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: 'Secure & Private',
      description: 'End-to-end encryption with role-based access control ensuring data privacy.'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: 'Real-Time Analysis',
      description: 'Process video frames at 30 FPS with instant cheat detection.'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      title: 'Student Friendly',
      description: 'Non-intrusive monitoring that maintains exam integrity while respecting privacy.'
    }
  ];

  const stats = [
    { value: '30 FPS', label: 'Real-Time Processing' },
    { value: '<50ms', label: 'Response Time' },
    { value: '24/7', label: 'Uptime Monitoring' },
    { value: 'Secure', label: 'Data Protection' }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#19191C] text-white' : 'bg-white text-gray-900'}`}>
      {/* Grid Pattern Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(${isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)'} 1px, transparent 1px),
            linear-gradient(90deg, ${isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)'} 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
        {/* Gradient Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-b from-transparent ${isDark ? 'via-[#19191C]/50 to-[#19191C]' : 'via-white/50 to-white'}`}></div>
      </div>

      {/* Navigation */}
      <nav className={`relative z-50 border-b ${isDark ? 'border-white/10 bg-[#19191C]/80' : 'border-gray-200 bg-white/80'} backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-gradient-to-br from-[#60A5FA] to-[#2563EB] rounded-lg flex items-center justify-center shadow-lg shadow-blue-400/20">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <span className={`font-bold text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>Drishti</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
              <Link
                href="/login"
                className={`${isDark ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-900'} font-medium transition-colors px-4 py-2 text-sm`}
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2 bg-gradient-to-r from-[#60A5FA] to-[#2563EB] text-white rounded-lg hover:shadow-lg hover:shadow-blue-400/30 transition-all font-medium text-sm"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className={`inline-flex items-center px-4 py-1.5 rounded-full border ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'} mb-8 backdrop-blur-sm`}>
              <div className="w-1.5 h-1.5 bg-[#60A5FA] rounded-full mr-2 animate-pulse"></div>
              <span className={`text-sm font-medium ${isDark ? 'text-white/90' : 'text-gray-700'}`}>AI-assisted exam creation & monitoring</span>
            </div>
            
            <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6 leading-tight tracking-tight`}>
              All-in-one exam{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#60A5FA] to-[#2563EB]">
                proctoring & review
              </span>
            </h1>
            
            <p className={`text-xl ${isDark ? 'text-white/60' : 'text-gray-600'} mb-10 leading-relaxed max-w-2xl mx-auto`}>
              Drishti is an AI-assisted exam platform — create exams, monitor securely, and help students review with AI-driven insights.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link
                href="/signup"
                className="px-8 py-3.5 bg-gradient-to-r from-[#60A5FA] to-[#2563EB] text-white rounded-lg hover:shadow-xl hover:shadow-blue-400/30 transition-all font-semibold text-base"
              >
                Start monitoring for free
              </Link>
              <Link
                href="/login"
                className={`px-8 py-3.5 ${isDark ? 'bg-white/5 text-white border-white/10 hover:bg-white/10' : 'bg-gray-50 text-gray-900 border-gray-200 hover:bg-gray-100'} rounded-lg border transition-all font-semibold text-base backdrop-blur-sm`}
              >
                Sign in
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className={`text-center p-6 rounded-xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'} border backdrop-blur-sm`}>
                  <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#60A5FA] to-[#2563EB] mb-1">{stat.value}</div>
                  <div className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-4xl sm:text-5xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
              Everything you need for secure exams
            </h2>
            <p className={`text-xl ${isDark ? 'text-white/60' : 'text-gray-600'} max-w-2xl mx-auto`}>
              Comprehensive proctoring solution with advanced AI detection and real-time monitoring
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`group p-8 rounded-2xl ${isDark ? 'bg-white/5 border-white/10 hover:border-[#2563EB]/50 hover:bg-white/[0.07]' : 'bg-white border-gray-200 hover:border-[#2563EB]/50 hover:shadow-xl'} border transition-all duration-300 cursor-pointer backdrop-blur-sm`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-[#60A5FA]/20 to-[#2563EB]/20 flex items-center justify-center text-[#2563EB] mb-5 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
                  {feature.title}
                </h3>
                <p className={`${isDark ? 'text-white/60' : 'text-gray-600'} leading-relaxed`}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-4xl sm:text-5xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
              How it works
            </h2>
            <p className={`text-xl ${isDark ? 'text-white/60' : 'text-gray-600'} max-w-2xl mx-auto`}>
              Simple setup, powerful monitoring, comprehensive analytics
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-gradient-to-br from-[#60A5FA] to-[#2563EB] rounded-2xl flex items-center justify-center text-2xl font-bold text-white mx-auto mb-6 shadow-lg shadow-blue-400/30">
                1
              </div>
              <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>Create exam</h3>
              <p className={`${isDark ? 'text-white/60' : 'text-gray-600'} text-base leading-relaxed`}>Set up your exam with questions, duration, and monitoring preferences in minutes.</p>
            </div>
            
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-gradient-to-br from-[#60A5FA] to-[#2563EB] rounded-2xl flex items-center justify-center text-2xl font-bold text-white mx-auto mb-6 shadow-lg shadow-blue-400/30">
                2
              </div>
              <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>Students take exam</h3>
              <p className={`${isDark ? 'text-white/60' : 'text-gray-600'} text-base leading-relaxed`}>AI monitors student behavior via webcam, detecting suspicious activities in real-time.</p>
            </div>
            
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-gradient-to-br from-[#60A5FA] to-[#2563EB] rounded-2xl flex items-center justify-center text-2xl font-bold text-white mx-auto mb-6 shadow-lg shadow-blue-400/30">
                3
              </div>
              <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>Review results</h3>
              <p className={`${isDark ? 'text-white/60' : 'text-gray-600'} text-base leading-relaxed`}>Access detailed reports with focus scores, flagged incidents, and video recordings.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#60A5FA] to-[#2563EB] opacity-10"></div>
            <div className={`absolute inset-0 border ${isDark ? 'border-white/10' : 'border-gray-200'} rounded-3xl`}></div>
            
            <div className="relative p-12 text-center backdrop-blur-sm">
              <h2 className={`text-4xl sm:text-5xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>
                Ready to secure your exams?
              </h2>
              <p className={`text-xl ${isDark ? 'text-white/70' : 'text-gray-600'} mb-10`}>
                Join institutions using AI-powered proctoring
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/signup"
                  className="px-10 py-4 bg-gradient-to-r from-[#60A5FA] to-[#2563EB] text-white rounded-lg hover:shadow-xl hover:shadow-blue-400/30 transition-all font-semibold text-base"
                >
                  Start for free
                </Link>
                <Link
                  href="/login"
                  className={`px-10 py-4 ${isDark ? 'bg-white/5 text-white border-white/10 hover:bg-white/10' : 'bg-gray-50 text-gray-900 border-gray-200 hover:bg-gray-100'} rounded-lg border transition-all font-semibold text-base backdrop-blur-sm`}
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`relative border-t ${isDark ? 'border-white/10' : 'border-gray-200'} py-12 px-6 lg:px-8`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-[#60A5FA] to-[#2563EB] rounded-lg flex items-center justify-center shadow-lg shadow-blue-400/20">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <span className={`font-bold text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>Drishti</span>
            </div>
            <p className={`${isDark ? 'text-white/60' : 'text-gray-600'} mb-6 text-sm`}>
              Drishti — AI-assisted exam creation, monitoring and review.
            </p>
            <div className={`text-sm ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
              &copy; 2025 Drishti. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
