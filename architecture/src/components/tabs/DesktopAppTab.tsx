import React from 'react';
import { 
  Monitor, 
  Lock, 
  Eye, 
  Activity, 
  Wifi, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Layers
} from 'lucide-react';

export function DesktopAppTab() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
      <h2 className="text-slate-900 mb-6">Desktop Proctoring Application</h2>
      
      <div className="space-y-6">
        {/* Overview */}
        <Section
          title="Desktop App Architecture"
          icon={<Monitor className="w-5 h-5" />}
          color="blue"
        >
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="text-blue-900 mb-2">Purpose & Design</h4>
            <p className="text-sm text-blue-700 mb-3">
              Native desktop application that runs alongside the browser-based exam to provide system-level 
              monitoring and enforcement. Communicates with the exam page via WebSocket/IPC to detect and 
              prevent cheating behaviors that cannot be detected from the browser alone.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h5 className="text-blue-800 mb-1">Technology Stack</h5>
                <ul className="space-y-1 text-blue-700">
                  <li>• Electron or Tauri framework</li>
                  <li>• Node.js backend (or Rust)</li>
                  <li>• Native OS APIs</li>
                  <li>• WebSocket client</li>
                </ul>
              </div>
              <div>
                <h5 className="text-blue-800 mb-1">Key Benefits</h5>
                <ul className="space-y-1 text-blue-700">
                  <li>• System-level monitoring</li>
                  <li>• Process control</li>
                  <li>• Screen capture prevention</li>
                  <li>• Network filtering</li>
                </ul>
              </div>
              <div>
                <h5 className="text-blue-800 mb-1">Deployment</h5>
                <ul className="space-y-1 text-blue-700">
                  <li>• Windows, macOS, Linux</li>
                  <li>• Auto-update capability</li>
                  <li>• Code-signed binaries</li>
                  <li>• Required for exam access</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard
              title="Installation & Startup"
              details={[
                'Student downloads and installs desktop app',
                'App registers system-level hooks',
                'Starts background service',
                'Launches on system boot (optional)',
                'Verifies integrity and version',
                'Connects to exam server WebSocket'
              ]}
            />
            <FeatureCard
              title="Exam Coordination"
              details={[
                'Detects when student starts exam in browser',
                'Receives exam ID and configuration',
                'Activates monitoring rules',
                'Sends heartbeat signals',
                'Reports violations to exam page',
                'Deactivates after exam submission'
              ]}
            />
          </div>
        </Section>

        {/* Communication Protocol */}
        <Section
          title="Browser ↔ Desktop Communication"
          icon={<Wifi className="w-5 h-5" />}
          color="purple"
          highlight
        >
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="text-purple-900 mb-3">Communication Architecture</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm text-purple-800 mb-2">Protocol Options</h5>
                  <div className="space-y-2 text-sm text-purple-700">
                    <div className="bg-white rounded p-2 border border-purple-200">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-purple-600" />
                        <strong>WebSocket (Recommended)</strong>
                      </div>
                      <ul className="text-xs ml-6 space-y-0.5">
                        <li>• Desktop app runs WebSocket server (localhost:8765)</li>
                        <li>• Browser connects via ws://localhost:8765</li>
                        <li>• Bidirectional real-time messaging</li>
                        <li>• No CORS issues (same origin)</li>
                      </ul>
                    </div>
                    <div className="bg-white rounded p-2 border border-purple-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-4 h-4 text-purple-600" />
                        <strong>Native Messaging (Alternative)</strong>
                      </div>
                      <ul className="text-xs ml-6 space-y-0.5">
                        <li>• Browser extension + native host</li>
                        <li>• JSON message passing</li>
                        <li>• More secure, complex setup</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div>
                  <h5 className="text-sm text-purple-800 mb-2">Message Flow</h5>
                  <div className="space-y-2 text-sm">
                    <MessageFlow
                      direction="Browser → Desktop"
                      messages={[
                        'exam_started: {exam_id, config}',
                        'heartbeat_ping: {timestamp}',
                        'exam_submitted: {session_id}',
                        'get_status: {}'
                      ]}
                    />
                    <MessageFlow
                      direction="Desktop → Browser"
                      messages={[
                        'status: {running, version}',
                        'violation: {type, details, timestamp}',
                        'heartbeat_pong: {timestamp}',
                        'screenshot_blocked: {app_name}'
                      ]}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-sm">
              <h5 className="text-slate-300 mb-2">Example Message Protocol</h5>
              <pre>{`// Browser sends to Desktop
{
  "type": "exam_started",
  "payload": {
    "exam_id": "uuid-1234",
    "session_id": "uuid-5678",
    "config": {
      "block_screenshots": true,
      "block_processes": ["discord", "slack", "teams"],
      "monitor_network": true,
      "strict_mode": true
    }
  }
}

// Desktop responds
{
  "type": "violation",
  "payload": {
    "violation_type": "unauthorized_process",
    "severity": "high",
    "details": {
      "process_name": "discord.exe",
      "timestamp": "2025-11-01T14:23:45Z",
      "action": "terminated"
    }
  }
}`}</pre>
            </div>
          </div>
        </Section>

        {/* Monitoring Features */}
        <Section
          title="System-Level Monitoring Features"
          icon={<Eye className="w-5 h-5" />}
          color="emerald"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MonitoringFeature
              title="Process Monitoring"
              icon={<Activity className="w-5 h-5 text-emerald-600" />}
              capabilities={[
                'List all running processes',
                'Detect blacklisted applications',
                'Auto-terminate unauthorized apps',
                'Block process launch during exam',
                'Monitor resource usage anomalies',
                'Detect virtual machines'
              ]}
              violations={[
                'Communication apps (Discord, Slack, Teams)',
                'Screen sharing tools (Zoom, TeamViewer)',
                'Developer tools (VS Code with extensions)',
                'Virtual machines (VMware, VirtualBox)',
                'Remote desktop clients'
              ]}
            />

            <MonitoringFeature
              title="Screen Capture Prevention"
              icon={<Lock className="w-5 h-5 text-emerald-600" />}
              capabilities={[
                'Block screenshot utilities',
                'Prevent screen recording apps',
                'Detect OBS/Streamlabs',
                'Block clipboard access',
                'Watermark desktop (optional)',
                'Monitor active windows'
              ]}
              violations={[
                'Screenshot tools (Snipping Tool, Lightshot)',
                'Screen recorders (OBS, Camtasia)',
                'Clipboard managers',
                'OCR/text extraction tools',
                'Window capture utilities'
              ]}
            />

            <MonitoringFeature
              title="Network Monitoring"
              icon={<Wifi className="w-5 h-5 text-emerald-600" />}
              capabilities={[
                'Monitor active connections',
                'Detect suspicious endpoints',
                'Block specific domains/IPs',
                'Log network activity',
                'Detect VPN usage',
                'Monitor bandwidth spikes'
              ]}
              violations={[
                'ChatGPT/AI service endpoints',
                'Messaging service connections',
                'P2P file sharing',
                'Unauthorized API calls',
                'Proxy/VPN connections',
                'Unusual data transfers'
              ]}
            />

            <MonitoringFeature
              title="Input/Hardware Monitoring"
              icon={<Monitor className="w-5 h-5 text-emerald-600" />}
              capabilities={[
                'Detect multiple monitors',
                'Track keyboard/mouse input',
                'Monitor USB device connections',
                'Detect external cameras',
                'Track Bluetooth devices',
                'Monitor audio devices'
              ]}
              violations={[
                'Second monitor activated',
                'External keyboard connected',
                'USB flash drive inserted',
                'Wireless devices connected',
                'Audio output to external speakers',
                'Unauthorized peripherals'
              ]}
            />
          </div>
        </Section>

        {/* Enforcement Actions */}
        <Section
          title="Enforcement & Response Actions"
          icon={<AlertTriangle className="w-5 h-5" />}
          color="red"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ActionCard
                severity="low"
                title="Warning Level"
                actions={[
                  'Log violation to database',
                  'Show warning banner in browser',
                  'Send notification to admin',
                  'Add to student violation count',
                  'Continue exam with flag'
                ]}
                triggers={[
                  'First clipboard access attempt',
                  'Brief alt-tab detected',
                  'Non-blacklisted process launch',
                  'Single monitor check failure'
                ]}
              />

              <ActionCard
                severity="medium"
                title="Intervention Level"
                actions={[
                  'Terminate offending process',
                  'Block specific functionality',
                  'Pause exam timer temporarily',
                  'Require admin acknowledgment',
                  'Capture evidence snapshot'
                ]}
                triggers={[
                  'Blacklisted app detected',
                  'Screenshot tool launched',
                  'Repeated clipboard access',
                  'VPN connection detected',
                  'USB device insertion'
                ]}
              />

              <ActionCard
                severity="high"
                title="Critical Response"
                actions={[
                  'Force exam submission',
                  'Lock student out of exam',
                  'Capture full system state',
                  'Alert admin immediately',
                  'Generate incident report',
                  'Require manual review'
                ]}
                triggers={[
                  'VM environment detected',
                  'Remote desktop connection',
                  'Multiple critical violations',
                  'Heartbeat loss (app tampered)',
                  'Network to AI services'
                ]}
              />
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="text-red-900 mb-3">Violation Response Flow</h4>
              <div className="space-y-2">
                {[
                  'Desktop app detects violation',
                  'Determine severity level (low/medium/high)',
                  'Execute enforcement action',
                  'Send violation message to browser',
                  'Browser updates UI and logs event',
                  'POST violation to /api/exam/violation',
                  'Store in violations table with evidence',
                  'Admin dashboard shows real-time alert',
                  'Optional: Trigger snapshot/recording'
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-red-700">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-200 text-red-800 flex items-center justify-center text-xs">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Technical Implementation */}
        <Section
          title="Technical Implementation Details"
          icon={<Layers className="w-5 h-5" />}
          color="indigo"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TechCard
                title="Electron/Tauri Setup"
                code={`// main.js - Desktop app entry point
const { app, BrowserWindow } = require('electron');
const WebSocket = require('ws');

// Start WebSocket server
const wss = new WebSocket.Server({ port: 8765 });

wss.on('connection', (ws) => {
  console.log('Browser connected');
  
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    handleBrowserMessage(data, ws);
  });
});

// System monitoring
const processMonitor = require('./monitors/process');
const networkMonitor = require('./monitors/network');

app.whenReady().then(() => {
  processMonitor.start();
  networkMonitor.start();
});`}
                description="Main process setup with WebSocket server and monitoring modules"
              />

              <TechCard
                title="Browser Connection"
                code={`// exam page - connect to desktop app
class DesktopAppClient {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
  }
  
  connect() {
    this.ws = new WebSocket('ws://localhost:8765');
    
    this.ws.onopen = () => {
      console.log('Connected to desktop app');
      this.sendMessage({
        type: 'exam_started',
        payload: { exam_id, config }
      });
    };
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleViolation(data);
    };
    
    this.ws.onerror = () => {
      // Desktop app not running!
      this.showAppRequiredWarning();
    };
  }
}`}
                description="Browser-side WebSocket client for desktop app communication"
              />
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h4 className="text-indigo-900 mb-3">Platform-Specific APIs</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h5 className="text-indigo-800 mb-2">Windows</h5>
                  <ul className="space-y-1 text-indigo-700">
                    <li>• Win32 API for process enum</li>
                    <li>• WMI queries for system info</li>
                    <li>• SetWindowsHookEx for input</li>
                    <li>• EnumDisplayMonitors</li>
                    <li>• Registry manipulation</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-indigo-800 mb-2">macOS</h5>
                  <ul className="space-y-1 text-indigo-700">
                    <li>• NSRunningApplication</li>
                    <li>• CGWindowList API</li>
                    <li>• IOKit for hardware</li>
                    <li>• Network Extension</li>
                    <li>• Screen Recording permission</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-indigo-800 mb-2">Linux</h5>
                  <ul className="space-y-1 text-indigo-700">
                    <li>• /proc filesystem</li>
                    <li>• X11/Wayland APIs</li>
                    <li>• udev for devices</li>
                    <li>• iptables for network</li>
                    <li>• D-Bus notifications</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Security Considerations */}
        <Section
          title="Security & Privacy Considerations"
          icon={<Lock className="w-5 h-5" />}
          color="amber"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ConsiderationCard
              title="Security Measures"
              items={[
                'Code signing with verified certificate',
                'Integrity checks (prevent tampering)',
                'Encrypted communication (TLS for prod)',
                'Authentication token validation',
                'Anti-debugging protection',
                'Secure storage for logs',
                'Regular security updates'
              ]}
            />
            <ConsiderationCard
              title="Privacy Protection"
              items={[
                'Transparent data collection policy',
                'Student consent required',
                'Limit data to exam duration only',
                'No persistent monitoring',
                'Encrypted violation logs',
                'Data retention limits (30 days)',
                'GDPR/compliance adherence'
              ]}
            />
            <ConsiderationCard
              title="User Experience"
              items={[
                'Clear installation instructions',
                'Visual indicator when active',
                'Minimal performance impact',
                'Graceful error handling',
                'Helpful error messages',
                'Easy uninstallation',
                'Support documentation'
              ]}
            />
            <ConsiderationCard
              title="Limitations & Challenges"
              items={[
                'Requires admin/root privileges',
                'OS-specific implementations',
                'Potential for false positives',
                'Sophisticated users can bypass',
                'Compatibility issues',
                'Maintenance overhead',
                'Not foolproof - defense in depth'
              ]}
            />
          </div>
        </Section>
      </div>

      {/* Summary */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <h3 className="text-slate-900 mb-4">Desktop App Integration Summary</h3>
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg p-4 border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-slate-900">Layer of Defense</div>
                <div className="text-slate-600">Complements browser-based proctoring with system-level controls</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-slate-900">Real-Time Communication</div>
                <div className="text-slate-600">WebSocket connection enables instant violation reporting</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-slate-900">Comprehensive Monitoring</div>
                <div className="text-slate-600">Process, network, hardware, and screen capture prevention</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-slate-900">Multi-Platform</div>
                <div className="text-slate-600">Cross-platform support with platform-specific optimizations</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ 
  title, 
  icon, 
  color, 
  children,
  highlight = false
}: { 
  title: string; 
  icon: React.ReactNode; 
  color: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-300',
    purple: 'bg-purple-50 border-purple-300',
    emerald: 'bg-emerald-50 border-emerald-300',
    red: 'bg-red-50 border-red-300',
    indigo: 'bg-indigo-50 border-indigo-300',
    amber: 'bg-amber-50 border-amber-300',
  };

  const highlightClass = highlight ? 'ring-2 ring-purple-400 ring-offset-2' : '';

  return (
    <div className={`border-2 rounded-lg p-6 ${colorClasses[color]} ${highlightClass}`}>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-lg text-slate-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function FeatureCard({ title, details }: { title: string; details: string[] }) {
  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200">
      <h4 className="text-slate-900 mb-3">{title}</h4>
      <ul className="space-y-1.5">
        {details.map((detail, i) => (
          <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <span>{detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MessageFlow({ direction, messages }: { direction: string; messages: string[] }) {
  return (
    <div className="bg-white rounded p-2 border border-purple-200">
      <div className="text-xs text-purple-800 mb-1">{direction}</div>
      <div className="space-y-0.5">
        {messages.map((msg, i) => (
          <code key={i} className="block text-xs text-purple-700 font-mono">
            {msg}
          </code>
        ))}
      </div>
    </div>
  );
}

function MonitoringFeature({ title, icon, capabilities, violations }: {
  title: string;
  icon: React.ReactNode;
  capabilities: string[];
  violations: string[];
}) {
  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h4 className="text-slate-900">{title}</h4>
      </div>
      <div className="mb-3">
        <h5 className="text-sm text-slate-700 mb-2">Capabilities:</h5>
        <ul className="space-y-1">
          {capabilities.map((cap, i) => (
            <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5 text-xs">✓</span>
              <span>{cap}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h5 className="text-sm text-slate-700 mb-2">Detected Violations:</h5>
        <ul className="space-y-1">
          {violations.map((violation, i) => (
            <li key={i} className="text-sm text-red-600 flex items-start gap-2">
              <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>{violation}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ActionCard({ severity, title, actions, triggers }: {
  severity: 'low' | 'medium' | 'high';
  title: string;
  actions: string[];
  triggers: string[];
}) {
  const colorClasses = {
    low: 'bg-yellow-50 border-yellow-300',
    medium: 'bg-orange-50 border-orange-300',
    high: 'bg-red-50 border-red-300',
  };

  const badgeColors = {
    low: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    medium: 'bg-orange-100 text-orange-800 border-orange-300',
    high: 'bg-red-100 text-red-800 border-red-300',
  };

  return (
    <div className={`rounded-lg p-4 border-2 ${colorClasses[severity]}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`px-2 py-1 rounded text-xs border ${badgeColors[severity]}`}>
          {severity.toUpperCase()}
        </span>
        <h4 className="text-slate-900">{title}</h4>
      </div>
      <div className="mb-3">
        <h5 className="text-sm text-slate-700 mb-2">Actions:</h5>
        <ul className="space-y-1">
          {actions.map((action, i) => (
            <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">→</span>
              <span>{action}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h5 className="text-sm text-slate-700 mb-2">Triggers:</h5>
        <ul className="space-y-1">
          {triggers.map((trigger, i) => (
            <li key={i} className="text-xs text-slate-600">• {trigger}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function TechCard({ title, code, description }: {
  title: string;
  code: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200">
      <h4 className="text-slate-900 mb-2">{title}</h4>
      <p className="text-sm text-slate-600 mb-3">{description}</p>
      <div className="bg-slate-900 text-slate-100 rounded p-3 font-mono text-xs overflow-x-auto">
        <pre>{code}</pre>
      </div>
    </div>
  );
}

function ConsiderationCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200">
      <h4 className="text-slate-900 mb-3">{title}</h4>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
