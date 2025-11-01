import React from 'react';
import { Video, Radio, Send, Network, Shield, Zap } from 'lucide-react';

export function WebRTCTab() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
      <h2 className="text-slate-900 mb-6">WebRTC Live Streaming Architecture</h2>
      
      <div className="space-y-6">
        {/* Overview */}
        <Section
          title="WebRTC Mesh Architecture"
          icon={<Video className="w-5 h-5" />}
          color="blue"
        >
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="text-blue-900 mb-2">Architecture Pattern: Mesh Topology</h4>
            <p className="text-sm text-blue-700 mb-3">
              Direct peer-to-peer connections between students and admins via WebRTC, 
              with Supabase Realtime channels handling signaling. No media server relay required.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h5 className="text-blue-800 mb-1">Benefits</h5>
                <ul className="space-y-1 text-blue-700">
                  <li>• Lower latency (~50-200ms)</li>
                  <li>• Reduced server costs</li>
                  <li>• Better video quality</li>
                  <li>• Scalable architecture</li>
                </ul>
              </div>
              <div>
                <h5 className="text-blue-800 mb-1">Trade-offs</h5>
                <ul className="space-y-1 text-blue-700">
                  <li>• NAT traversal challenges</li>
                  <li>• STUN server required</li>
                  <li>• Bandwidth per peer</li>
                  <li>• Limited to 1:1 or small groups</li>
                </ul>
              </div>
              <div>
                <h5 className="text-blue-800 mb-1">Use Case</h5>
                <ul className="space-y-1 text-blue-700">
                  <li>• Live proctoring</li>
                  <li>• Admin monitoring</li>
                  <li>• Audio/video streams</li>
                  <li>• Real-time oversight</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ComponentCard
              title="Student Side"
              details={[
                'Acquire camera/mic via getUserMedia()',
                'Create RTCPeerConnection',
                'Add local stream tracks',
                'Generate SDP offer',
                'Broadcast offer via Supabase channel',
                'Listen for admin answer',
                'Exchange ICE candidates',
                'Stream to admin viewer'
              ]}
            />
            <ComponentCard
              title="Admin Side"
              details={[
                'Select student from leaderboard',
                'Join webrtc:{roomId} channel',
                'Listen for student offer',
                'Create RTCPeerConnection',
                'Set remote description (offer)',
                'Generate SDP answer',
                'Broadcast answer to student',
                'Receive & display stream'
              ]}
            />
          </div>
        </Section>

        {/* Signaling Flow */}
        <Section
          title="Supabase Realtime Signaling"
          icon={<Radio className="w-5 h-5" />}
          color="purple"
          highlight
        >
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="text-purple-900 mb-3">Channel Structure</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="text-purple-800 mb-2">Channel Naming</h5>
                  <ul className="space-y-1 text-purple-700">
                    <li>• Pattern: <code className="bg-purple-100 px-1 rounded">webrtc:{'{roomId}'}</code></li>
                    <li>• roomId = exam session UUID</li>
                    <li>• Unique per student-admin pair</li>
                    <li>• Multiple admins can join same room</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-purple-800 mb-2">Message Types</h5>
                  <ul className="space-y-1 text-purple-700">
                    <li>• <code className="bg-purple-100 px-1 rounded">offer</code> - Student's SDP offer</li>
                    <li>• <code className="bg-purple-100 px-1 rounded">answer</code> - Admin's SDP answer</li>
                    <li>• <code className="bg-purple-100 px-1 rounded">ice_candidate</code> - ICE candidates</li>
                    <li>• <code className="bg-purple-100 px-1 rounded">peer_left</code> - Disconnect event</li>
                  </ul>
                </div>
              </div>
            </div>

            <h4 className="text-slate-900">Complete Signaling Flow</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SignalingStep
                step={1}
                title="Student Initiates Connection"
                actions={[
                  'Create RTCPeerConnection with STUN config',
                  'Add local media stream (camera/mic)',
                  'Set up onicecandidate handler',
                  'Create SDP offer via createOffer()',
                  'Set local description (offer)',
                  'Join Supabase channel webrtc:{sessionId}',
                  'Broadcast offer message to channel'
                ]}
                code={`const pc = new RTCPeerConnection({
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
});

stream.getTracks().forEach(track => {
  pc.addTrack(track, stream);
});

const offer = await pc.createOffer();
await pc.setLocalDescription(offer);

channel.send({
  type: 'broadcast',
  event: 'offer',
  payload: { sdp: offer }
});`}
              />

              <SignalingStep
                step={2}
                title="Admin Receives Offer"
                actions={[
                  'Join webrtc:{sessionId} channel',
                  'Listen for "offer" event',
                  'Create RTCPeerConnection',
                  'Set remote description (student offer)',
                  'Create SDP answer via createAnswer()',
                  'Set local description (answer)',
                  'Broadcast answer back to channel'
                ]}
                code={`channel.on('broadcast', { event: 'offer' }, 
  async ({ payload }) => {
    const pc = new RTCPeerConnection({...});
    
    await pc.setRemoteDescription(
      new RTCSessionDescription(payload.sdp)
    );
    
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    channel.send({
      type: 'broadcast',
      event: 'answer',
      payload: { sdp: answer }
    });
  }
);`}
              />

              <SignalingStep
                step={3}
                title="Student Receives Answer"
                actions={[
                  'Listen for "answer" event on channel',
                  'Extract admin SDP answer',
                  'Set remote description (answer)',
                  'Connection negotiation begins',
                  'ICE gathering starts automatically'
                ]}
                code={`channel.on('broadcast', { event: 'answer' }, 
  async ({ payload }) => {
    await pc.setRemoteDescription(
      new RTCSessionDescription(payload.sdp)
    );
    // Connection will complete after ICE
  }
);`}
              />

              <SignalingStep
                step={4}
                title="ICE Candidate Exchange"
                actions={[
                  'onicecandidate fires on both peers',
                  'Each peer broadcasts candidates',
                  'Candidates received and added',
                  'STUN server resolves public IPs',
                  'Direct connection established',
                  'Media starts flowing'
                ]}
                code={`pc.onicecandidate = ({ candidate }) => {
  if (candidate) {
    channel.send({
      type: 'broadcast',
      event: 'ice_candidate',
      payload: { candidate }
    });
  }
};

channel.on('broadcast', 
  { event: 'ice_candidate' }, 
  async ({ payload }) => {
    await pc.addIceCandidate(
      new RTCIceCandidate(payload.candidate)
    );
  }
);`}
              />
            </div>
          </div>
        </Section>

        {/* Connection States */}
        <Section
          title="Connection Lifecycle & States"
          icon={<Network className="w-5 h-5" />}
          color="emerald"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StateCard
              state="new"
              color="slate"
              description="RTCPeerConnection created, no negotiation started"
              next="Offer created → connecting"
            />
            <StateCard
              state="connecting"
              color="blue"
              description="ICE gathering in progress, attempting connection"
              next="Connection established → connected"
            />
            <StateCard
              state="connected"
              color="emerald"
              description="Peer-to-peer connection active, media flowing"
              next="Network change → checking, or disconnect → closed"
            />
            <StateCard
              state="failed"
              color="red"
              description="Connection failed (NAT issues, firewall, timeout)"
              next="Retry with TURN server or show error"
            />
          </div>

          <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <h4 className="text-emerald-900 mb-3">Connection Monitoring</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="text-emerald-800 mb-2">Event Listeners</h5>
                <ul className="space-y-1 text-emerald-700">
                  <li>• <code className="bg-emerald-100 px-1 rounded">onconnectionstatechange</code> - Overall state</li>
                  <li>• <code className="bg-emerald-100 px-1 rounded">oniceconnectionstatechange</code> - ICE state</li>
                  <li>• <code className="bg-emerald-100 px-1 rounded">ontrack</code> - Remote track added</li>
                  <li>• <code className="bg-emerald-100 px-1 rounded">ondatachannel</code> - Data channel opened</li>
                </ul>
              </div>
              <div>
                <h5 className="text-emerald-800 mb-2">Error Handling</h5>
                <ul className="space-y-1 text-emerald-700">
                  <li>• Timeout detection (30s)</li>
                  <li>• Retry logic (max 3 attempts)</li>
                  <li>• Fallback to snapshot-only mode</li>
                  <li>• User notification of issues</li>
                </ul>
              </div>
            </div>
          </div>
        </Section>

        {/* LiveVideoViewer Component */}
        <Section
          title="LiveVideoViewer Implementation"
          icon={<Video className="w-5 h-5" />}
          color="indigo"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ComponentCard
                title="Component Lifecycle"
                details={[
                  'Mount: Join Supabase channel',
                  'Setup: Create RTCPeerConnection',
                  'Listen: Wait for student offer',
                  'Negotiate: Exchange SDP/ICE',
                  'Display: Attach stream to <video>',
                  'Unmount: Close connection, leave channel'
                ]}
              />
              <ComponentCard
                title="UI Features"
                details={[
                  'Video element with autoplay',
                  'Mute/unmute control',
                  'Fullscreen toggle',
                  'Connection quality indicator',
                  'Reconnect button',
                  'Stream metadata display'
                ]}
              />
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h4 className="text-indigo-900 mb-2">Stream Attachment</h4>
              <div className="bg-slate-900 text-slate-100 rounded p-3 font-mono text-sm overflow-x-auto">
                <pre>{`pc.ontrack = (event) => {
  const [remoteStream] = event.streams;
  
  if (videoRef.current) {
    videoRef.current.srcObject = remoteStream;
  }
  
  console.log('Received remote stream:', {
    tracks: remoteStream.getTracks().length,
    active: remoteStream.active
  });
};`}</pre>
              </div>
            </div>
          </div>
        </Section>

        {/* STUN/TURN Configuration */}
        <Section
          title="ICE Server Configuration"
          icon={<Shield className="w-5 h-5" />}
          color="orange"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ServerCard
              type="STUN"
              description="Session Traversal Utilities for NAT"
              purpose="Discover public IP address and port for peer connection"
              config={`{
  urls: [
    'stun:stun.l.google.com:19302',
    'stun:stun1.l.google.com:19302'
  ]
}`}
              details={[
                'Free public servers available',
                'Resolves NAT type',
                'Enables direct P2P when possible',
                'Works for ~80% of connections',
                'Low latency, no bandwidth cost'
              ]}
            />
            
            <ServerCard
              type="TURN"
              description="Traversal Using Relays around NAT"
              purpose="Relay media when direct P2P fails (symmetric NAT, firewall)"
              config={`{
  urls: 'turn:turn.example.com:3478',
  username: 'user',
  credential: 'pass'
}`}
              details={[
                'Fallback for restrictive networks',
                'Requires dedicated server',
                'Bandwidth cost (relay traffic)',
                'Ensures connection success',
                'Currently not implemented (add if needed)'
              ]}
            />
          </div>

          <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="text-orange-900 mb-2">Current Configuration</h4>
            <div className="bg-slate-900 text-slate-100 rounded p-3 font-mono text-xs overflow-x-auto">
              <pre>{`const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ],
  iceCandidatePoolSize: 10
};

const peerConnection = new RTCPeerConnection(configuration);`}</pre>
            </div>
            <p className="text-sm text-orange-700 mt-2">
              Note: Add TURN server configuration for production to handle all network scenarios.
            </p>
          </div>
        </Section>

        {/* Performance & Quality */}
        <Section
          title="Performance & Quality Optimization"
          icon={<Zap className="w-5 h-5" />}
          color="cyan"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <OptimizationCard
              title="Video Constraints"
              settings={[
                'Resolution: 640x480 (VGA)',
                'Frame rate: 15-30 FPS',
                'Codec: VP8/VP9 or H.264',
                'Bitrate: Adaptive (200-1000 kbps)',
                'Bandwidth-efficient for proctoring'
              ]}
            />
            <OptimizationCard
              title="Audio Constraints"
              settings={[
                'Codec: Opus (preferred)',
                'Sample rate: 48 kHz',
                'Channels: Mono (sufficient)',
                'Echo cancellation: Enabled',
                'Noise suppression: Enabled'
              ]}
            />
            <OptimizationCard
              title="Network Adaptation"
              settings={[
                'Automatic bitrate adjustment',
                'Quality degradation on packet loss',
                'Jitter buffer for smoothing',
                'FEC (Forward Error Correction)',
                'Bandwidth estimation algorithms'
              ]}
            />
          </div>

          <div className="mt-4 bg-cyan-50 border border-cyan-200 rounded-lg p-4">
            <h4 className="text-cyan-900 mb-3">Connection Quality Metrics</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="text-cyan-800 mb-2">Monitored Stats</h5>
                <ul className="space-y-1 text-cyan-700">
                  <li>• Packets sent/received</li>
                  <li>• Bytes transferred</li>
                  <li>• Round-trip time (RTT)</li>
                  <li>• Jitter variance</li>
                  <li>• Packet loss percentage</li>
                </ul>
              </div>
              <div>
                <h5 className="text-cyan-800 mb-2">Quality Indicators</h5>
                <ul className="space-y-1 text-cyan-700">
                  <li>• Green: RTT {'<'} 100ms, loss {'<'} 2%</li>
                  <li>• Yellow: RTT 100-300ms, loss 2-5%</li>
                  <li>• Red: RTT {'>'} 300ms, loss {'>'} 5%</li>
                  <li>• Display in admin UI</li>
                </ul>
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* Best Practices */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <h3 className="text-slate-900 mb-4">WebRTC Best Practices</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <BestPractice
            title="Connection Management"
            items={[
              'Always close connections on unmount',
              'Remove event listeners',
              'Stop media tracks',
              'Leave Supabase channels',
              'Prevent memory leaks'
            ]}
          />
          <BestPractice
            title="Error Handling"
            items={[
              'Handle getUserMedia() failures',
              'Timeout connection attempts',
              'Retry with exponential backoff',
              'Graceful degradation',
              'User-friendly error messages'
            ]}
          />
          <BestPractice
            title="Privacy & Security"
            items={[
              'Request minimal permissions',
              'Encrypted media (DTLS/SRTP)',
              'Validate signaling messages',
              'Prevent unauthorized viewing',
              'Student consent for recording'
            ]}
          />
          <BestPractice
            title="Performance"
            items={[
              'Lazy load LiveVideoViewer',
              'Limit concurrent streams',
              'Monitor bandwidth usage',
              'Provide snapshot fallback',
              'Test on various networks'
            ]}
          />
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
    indigo: 'bg-indigo-50 border-indigo-300',
    orange: 'bg-orange-50 border-orange-300',
    cyan: 'bg-cyan-50 border-cyan-300',
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

function ComponentCard({ title, details }: { title: string; details: string[] }) {
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

function SignalingStep({ step, title, actions, code }: {
  step: number;
  title: string;
  actions: string[];
  code: string;
}) {
  return (
    <div className="bg-white rounded-lg p-4 border-2 border-purple-200">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm">
          {step}
        </div>
        <h4 className="text-slate-900">{title}</h4>
      </div>
      <ul className="space-y-1.5 mb-3">
        {actions.map((action, i) => (
          <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
            <span className="text-purple-500 mt-0.5 text-xs">→</span>
            <span>{action}</span>
          </li>
        ))}
      </ul>
      <div className="bg-slate-900 text-slate-100 rounded p-2 font-mono text-xs overflow-x-auto">
        <pre>{code}</pre>
      </div>
    </div>
  );
}

function StateCard({ state, color, description, next }: {
  state: string;
  color: string;
  description: string;
  next: string;
}) {
  const colorClasses: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700 border-slate-300',
    blue: 'bg-blue-100 text-blue-700 border-blue-300',
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    red: 'bg-red-100 text-red-700 border-red-300',
  };

  return (
    <div className="bg-white rounded-lg p-3 border border-slate-200">
      <div className={`inline-block px-2 py-1 rounded text-xs mb-2 border ${colorClasses[color]}`}>
        {state}
      </div>
      <p className="text-sm text-slate-600 mb-2">{description}</p>
      <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
        <strong>Next:</strong> {next}
      </div>
    </div>
  );
}

function ServerCard({ type, description, purpose, config, details }: {
  type: string;
  description: string;
  purpose: string;
  config: string;
  details: string[];
}) {
  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200">
      <h4 className="text-slate-900 mb-1">{type} Server</h4>
      <p className="text-xs text-slate-600 mb-2">{description}</p>
      <div className="mb-3">
        <h5 className="text-xs text-slate-700 mb-1">Purpose:</h5>
        <p className="text-sm text-slate-600">{purpose}</p>
      </div>
      <div className="mb-3">
        <h5 className="text-xs text-slate-700 mb-1">Configuration:</h5>
        <div className="bg-slate-900 text-slate-100 rounded p-2 font-mono text-xs overflow-x-auto">
          <pre>{config}</pre>
        </div>
      </div>
      <ul className="space-y-1">
        {details.map((detail, i) => (
          <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
            <span className="text-orange-500 mt-0.5">•</span>
            <span>{detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OptimizationCard({ title, settings }: { title: string; settings: string[] }) {
  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200">
      <h4 className="text-slate-900 mb-3">{title}</h4>
      <ul className="space-y-1.5">
        {settings.map((setting, i) => (
          <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
            <span className="text-cyan-500 mt-0.5">•</span>
            <span>{setting}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BestPractice({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
      <h4 className="text-slate-900 mb-3">{title}</h4>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
            <span className="text-emerald-500 mt-0.5">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
