'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Home() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: 'AI-Powered Detection',
      description: 'Advanced machine learning algorithms monitor student behavior with precision in real-time.',
      badge: 'Smart'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Live Monitoring',
      description: 'Watch student exams live with WebRTC streaming and instant alert notifications.',
      badge: 'Real-time'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Advanced Analytics',
      description: 'Comprehensive reporting with focus scores, behavioral insights, and detailed analytics.',
      badge: 'Insights'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: 'Enterprise Security',
      description: 'End-to-end encryption, role-based access control, and GDPR-compliant data privacy.',
      badge: 'Secure'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'AI-Assisted Review',
      description: 'Help students review exams with AI-driven insights and personalized learning recommendations.',
      badge: 'Learning'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      title: 'Easy Question Creation',
      description: 'Admins can create exams with AI assistance for question framing and exam structure.',
      badge: 'Creator'
    }
  ];

  const stats = [
    { value: '99.9%', label: 'Uptime Guarantee', subtext: 'Enterprise-grade reliability' },
    { value: '<50ms', label: 'Latency', subtext: 'Real-time response time' },
    { value: '10K+', label: 'Exams', subtext: 'Successfully proctored' },
    { value: '100%', label: 'Encrypted', subtext: 'End-to-end security' }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0B0B0F] text-white' : 'bg-white text-gray-900'}`}>
      {/* Background layers */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px),
              linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
        {/* radial glow */}
        <div className={`pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-[40rem] w-[40rem] rounded-full blur-3xl ${isDark ? 'bg-[#2563EB]/20' : 'bg-[#60A5FA]/20'}`} />
        <div className={`pointer-events-none absolute -bottom-32 left-20 h-[28rem] w-[28rem] rounded-full blur-[100px] ${isDark ? 'bg-[#60A5FA]/10' : 'bg-[#2563EB]/10'}`} />
        {/* gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-b from-transparent ${isDark ? 'via-[#0B0B0F]/60 to-[#0B0B0F]' : 'via-white/60 to-white'}`} />
      </div>

      {/* Navigation */}
      <nav className={`relative z-50 border-b ${isDark ? 'border-white/10 bg-[#0B0B0F]/70' : 'border-gray-200 bg-white/70'} backdrop-blur-xl`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-[#60A5FA] to-[#2563EB] rounded-lg flex items-center justify-center shadow-lg shadow-blue-400/20">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <span className={`font-bold text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>Drishti</span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm">
              <a href="#features" className={`${isDark ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>Features</a>
              <a href="#how" className={`${isDark ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>How it works</a>
              <a href="#cta" className={`${isDark ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>Get started</a>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414z" clipRule="evenodd" />
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
      <section className="relative pt-20 pb-28 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid items-center gap-12 md:grid-cols-2">
            {/* Left: Hero copy */}
            <div className="text-center md:text-left max-w-2xl mx-auto md:mx-0">
            <div className={`inline-flex items-center px-4 py-1.5 rounded-full border ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'} mb-8 backdrop-blur-sm gap-2`}
            >
              <span className="inline-flex w-1.5 h-1.5 bg-gradient-to-r from-[#60A5FA] to-[#2563EB] rounded-full animate-pulse" />
              <span className={`text-sm font-medium ${isDark ? 'text-white/90' : 'text-gray-700'}`}>AI-assisted exam creation & monitoring</span>
            </div>

            <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6 leading-tight tracking-tight`}
            >
              Elevate exam security with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#60A5FA] via-[#4E8BEF] to-[#2563EB]">
                Drishti Proctoring
              </span>
            </h1>

            <p className={`text-xl ${isDark ? 'text-white/60' : 'text-gray-600'} mb-10 leading-relaxed max-w-2xl mx-auto`}>
              Create, monitor, and review exams with a refined, privacy-first AI experience.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mb-14">
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
            </div>
            {/* Right: Single illustrative image (no claims) */}
            <div className="relative mx-auto w-full max-w-[560px]">
              <div className={`relative aspect-[4/3] rounded-3xl border overflow-hidden ${isDark ? 'bg-[#0E0E13] border-white/10' : 'bg-white border-gray-200'} shadow-xl`} aria-hidden="true">
                {/* Monitor */}
                <div className="absolute inset-0 grid grid-rows-[1fr_auto]">
                  <div className={`m-6 rounded-xl border ${isDark ? 'bg-[#111118] border-white/10' : 'bg-gray-50 border-gray-200'} p-4`}> 
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-emerald-400" />
                        <span className={`text-xs ${isDark ? 'text-white/70' : 'text-gray-600'}`}>rec</span>
                      </div>
                      <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>07:45</div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className={`h-28 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-100'}`} />
                      <div className="col-span-2 space-y-2">
                        <div className={`h-4 rounded ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
                        <div className={`h-4 rounded ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
                        <div className={`h-4 w-2/3 rounded ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <div className={`h-6 rounded ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
                          <div className={`h-6 rounded ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="relative flex items-center justify-center py-3">
                    <div className={`h-2 w-40 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
                  </div>
                </div>

                {/* Floating labels (descriptive only) */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-6 right-4 flex flex-col gap-3 items-end">
                    <div className={`text-xs rounded-full px-3 py-1 shadow-sm ${isDark ? 'bg-white/10 text-white/90 border border-white/10' : 'bg-white text-gray-800 border border-gray-200'}`}>example alerts</div>
                    <div className={`text-xs rounded-full px-3 py-1 shadow-sm ${isDark ? 'bg-white/10 text-white/90 border border-white/10' : 'bg-white text-gray-800 border border-gray-200'}`}>sample prompts</div>
                    <div className={`text-xs rounded-full px-3 py-1 shadow-sm ${isDark ? 'bg-white/10 text-white/90 border border-white/10' : 'bg-white text-gray-800 border border-gray-200'}`}>possible signals</div>
                  </div>
                  <div className="absolute bottom-8 left-4 flex flex-col gap-3">
                    <div className={`text-xs rounded-full px-3 py-1 shadow-sm ${isDark ? 'bg-white/10 text-white/90 border border-white/10' : 'bg-white text-gray-800 border border-gray-200'}`}>review insights</div>
                    <div className={`text-xs rounded-full px-3 py-1 shadow-sm ${isDark ? 'bg-white/10 text-white/90 border border-white/10' : 'bg-white text-gray-800 border border-gray-200'}`}>session timeline</div>
                  </div>
                </div>
              </div>

              {/* Stats under the image */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                  <div key={index} className={`text-center p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'} backdrop-blur-sm`}>
                    <div className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#60A5FA] to-[#2563EB]">{stat.value}</div>
                    <div className={`text-xs font-medium ${isDark ? 'text-white/60' : 'text-gray-600'}`}>{stat.label}</div>
                    {stat.subtext && <div className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-500'}`}>{stat.subtext}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className={`text-4xl sm:text-5xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
              Everything you need for secure exams
            </h2>
            <p className={`text-xl ${isDark ? 'text-white/60' : 'text-gray-600'} max-w-2xl mx-auto`}>
              Comprehensive proctoring with advanced AI detection and real-time monitoring.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`group relative p-[1px] rounded-2xl transition-all duration-300 cursor-pointer 
                  ${isDark ? 'bg-white/10' : 'bg-gray-100'} 
                  ${hoveredCard === index ? 'shadow-2xl shadow-blue-500/10' : 'shadow-none'}`}
              >
                {/* gradient border */}
                <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 
                  bg-gradient-to-br from-[#60A5FA] via-transparent to-[#2563EB]`} />
                <div className={`relative rounded-2xl p-8 border transition-all duration-300 backdrop-blur-sm 
                  ${isDark ? 'bg-[#0B0B0F]/60 border-white/10 group-hover:bg-[#0B0B0F]/70' : 'bg-white border-gray-200 group-hover:bg-white'}
                  group-hover:translate-y-[-2px] group-hover:ring-1 group-hover:ring-[#2563EB]/30`}
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-[#60A5FA]/20 to-[#2563EB]/20 flex items-center justify-center text-[#2563EB] group-hover:scale-110 transition-transform`}>
                      {feature.icon}
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap
                      ${isDark ? 'bg-[#60A5FA]/10 text-[#60A5FA] border border-[#60A5FA]/30' : 'bg-[#60A5FA]/10 text-[#2563EB] border border-[#60A5FA]/30'}`}>
                      {feature.badge}
                    </span>
                  </div>
                  <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
                    {feature.title}
                  </h3>
                  <p className={`${isDark ? 'text-white/60' : 'text-gray-600'} leading-relaxed`}>
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="relative py-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className={`text-4xl sm:text-5xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
              How it works
            </h2>
            <p className={`text-xl ${isDark ? 'text-white/60' : 'text-gray-600'} max-w-2xl mx-auto`}>
              Simple setup, powerful monitoring, comprehensive analytics
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl border shadow-sm transition-colors 
              ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}">
              <div className="w-16 h-16 bg-gradient-to-br from-[#60A5FA] to-[#2563EB] rounded-2xl flex items-center justify-center text-2xl font-bold text-white mx-auto mb-6 shadow-lg shadow-blue-400/30">
                1
              </div>
              <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>Create exam</h3>
              <p className={`${isDark ? 'text-white/60' : 'text-gray-600'} text-base leading-relaxed`}>Set up your exam with questions, duration, and monitoring preferences in minutes.</p>
            </div>

            <div className="text-center p-8 rounded-2xl border shadow-sm transition-colors 
              ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}">
              <div className="w-16 h-16 bg-gradient-to-br from-[#60A5FA] to-[#2563EB] rounded-2xl flex items-center justify-center text-2xl font-bold text-white mx-auto mb-6 shadow-lg shadow-blue-400/30">
                2
              </div>
              <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>Students take exam</h3>
              <p className={`${isDark ? 'text-white/60' : 'text-gray-600'} text-base leading-relaxed`}>AI monitors student behavior via webcam, detecting suspicious activities in real-time.</p>
            </div>

            <div className="text-center p-8 rounded-2xl border shadow-sm transition-colors 
              ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}">
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
      <section id="cta" className="relative py-24 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#60A5FA] to-[#2563EB] opacity-10" />
            <div className={`absolute inset-0 border ${isDark ? 'border-white/10' : 'border-gray-200'} rounded-3xl`} />

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
            <div className="flex items-center justify-center gap-3 mb-4">
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
