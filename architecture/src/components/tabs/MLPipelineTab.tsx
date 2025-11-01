import React from 'react';
import { Brain, Image as ImageIcon, Eye, Smartphone, RefreshCw, AlertCircle, Activity } from 'lucide-react';

export function MLPipelineTab() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
      <h2 className="text-slate-900 mb-6">ML Proctoring Pipeline</h2>
      
      <div className="space-y-6">
        {/* Service Overview */}
        <Section
          title="FastAPI Service Architecture"
          icon={<Brain className="w-5 h-5" />}
          color="purple"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard
              title="Service Details"
              path="model_prediction/api.py"
              details={[
                'Python FastAPI web framework',
                'Async/await for concurrent processing',
                'WebSocket support for streaming',
                'HTTP POST endpoint for single frames',
                '/analyze endpoint (primary)',
                'CORS enabled for Next.js frontend'
              ]}
            />
            <InfoCard
              title="Core Dependencies"
              details={[
                'OpenCV (cv2) - Image processing',
                'MediaPipe - Face landmark detection',
                'YOLOv8 - Object detection',
                'NumPy - Numerical computations',
                'SciPy - Pose estimation (solvePnP)',
                'Pillow - Image manipulation'
              ]}
            />
          </div>
        </Section>

        {/* Ingestion */}
        <Section
          title="Frame Ingestion"
          icon={<ImageIcon className="w-5 h-5" />}
          color="blue"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard
                title="HTTP Endpoint"
                details={[
                  'POST /analyze',
                  'Accept base64 JPEG images',
                  'Decode and validate format',
                  'Convert to NumPy array',
                  'Pass to FocusMonitor',
                  'Return JSON response'
                ]}
              />
              <InfoCard
                title="WebSocket Endpoint (Optional)"
                details={[
                  'ws://server/analyze',
                  'Streaming frame support',
                  'Bidirectional communication',
                  'Lower latency for continuous feed',
                  'Session state management',
                  'Currently unused, HTTP preferred'
                ]}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-blue-900 mb-2">Request Flow</h4>
              <div className="flex items-center gap-2 text-sm text-blue-700 overflow-x-auto">
                <span className="whitespace-nowrap">Student Camera</span>
                <span>→</span>
                <span className="whitespace-nowrap">Canvas Capture</span>
                <span>→</span>
                <span className="whitespace-nowrap">Base64 Encode</span>
                <span>→</span>
                <span className="whitespace-nowrap">POST to ML Server</span>
                <span>→</span>
                <span className="whitespace-nowrap">Decode & Process</span>
                <span>→</span>
                <span className="whitespace-nowrap">Return Analysis</span>
              </div>
            </div>
          </div>
        </Section>

        {/* FocusMonitor - Main Processing */}
        <Section
          title="FocusMonitor Processing Pipeline"
          icon={<Activity className="w-5 h-5" />}
          color="purple"
          highlight
        >
          <div className="space-y-4">
            {/* Loop Detection */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-lg p-4">
              <h4 className="text-purple-900 mb-3 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                dHash Loop Detection (New Feature)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h5 className="text-sm text-purple-800 mb-2">Hash Generation</h5>
                  <ul className="space-y-1 text-sm text-purple-700">
                    <li>• Convert frame to grayscale</li>
                    <li>• Resize to 9x8 pixels</li>
                    <li>• Compute difference hash (dHash)</li>
                    <li>• 64-bit perceptual fingerprint</li>
                    <li>• Invariant to minor changes</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-sm text-purple-800 mb-2">Temporal Analysis</h5>
                  <ul className="space-y-1 text-sm text-purple-700">
                    <li>• Sliding window deque</li>
                    <li>• Store last N hashes (e.g., 100)</li>
                    <li>• Hamming distance clustering</li>
                    <li>• Identify dominant clusters</li>
                    <li>• Track reuse patterns</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-sm text-purple-800 mb-2">Loop Detection Logic</h5>
                  <ul className="space-y-1 text-sm text-purple-700">
                    <li>• Calculate reuse ratio</li>
                    <li>• Dominant cluster duration</li>
                    <li>• Confidence score (0-1)</li>
                    <li>• Threshold: ≥ 0.6 triggers alert</li>
                    <li>• Emit looping_video alert</li>
                  </ul>
                </div>
              </div>
              <div className="mt-3 p-3 bg-purple-100 rounded text-sm text-purple-800">
                <strong>Output:</strong> loop_detection_state {'{'}confidence, reuse_ratio, dominant_cluster_duration{'}'}
              </div>
            </div>

            {/* Device Detection */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="text-amber-900 mb-3 flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                YOLOv8 Device Detection
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm text-amber-800 mb-2">Detection Process</h5>
                  <ul className="space-y-1 text-sm text-amber-700">
                    <li>• Load YOLOv8 model (if available)</li>
                    <li>• Detect objects: cell phone, tablet</li>
                    <li>• Filter by confidence threshold</li>
                    <li>• Extract bounding boxes</li>
                    <li>• Count device instances</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-sm text-amber-800 mb-2">Smoothing & Alerts</h5>
                  <ul className="space-y-1 text-amber-700">
                    <li>• Device presence score (0-1)</li>
                    <li>• Exponential moving average</li>
                    <li>• Reduce false positives</li>
                    <li>• Threshold crossing → Alert</li>
                    <li>• Emit device_detected alert</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Face Detection & Gaze */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <h4 className="text-emerald-900 mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                MediaPipe FaceMesh Analysis (Primary Path)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm text-emerald-800 mb-2">Face Landmark Detection</h5>
                  <ul className="space-y-1 text-sm text-emerald-700">
                    <li>• 468-point facial mesh</li>
                    <li>• Detect up to multiple faces</li>
                    <li>• Extract 3D landmark coordinates</li>
                    <li>• Identify key points: eyes, nose, mouth</li>
                    <li>• High precision tracking</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-sm text-emerald-800 mb-2">Head Pose Estimation</h5>
                  <ul className="space-y-1 text-sm text-emerald-700">
                    <li>• Select 6 facial landmarks</li>
                    <li>• SolvePnP (Perspective-n-Point)</li>
                    <li>• Calculate rotation vector</li>
                    <li>• Extract yaw, pitch, roll</li>
                    <li>• Degrees from camera normal</li>
                  </ul>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm text-emerald-800 mb-2">Gaze Estimation</h5>
                  <ul className="space-y-1 text-sm text-emerald-700">
                    <li>• Left/right eye landmarks</li>
                    <li>• Compute eye centers</li>
                    <li>• Estimate pupil positions</li>
                    <li>• Calculate gaze vector</li>
                    <li>• Screen coordinate estimation</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-sm text-emerald-800 mb-2">Multi-Face Detection</h5>
                  <ul className="space-y-1 text-sm text-emerald-700">
                    <li>• Count detected faces</li>
                    <li>• Alert if {'>'} 1 face</li>
                    <li>• Possible cheating indicator</li>
                    <li>• Track face positions</li>
                    <li>• Emit multi_face alert</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Fallback Path */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h4 className="text-slate-900 mb-3">Haar Cascade Fallback</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard
                  title="When Used"
                  details={[
                    'MediaPipe unavailable',
                    'FaceMesh initialization fails',
                    'Lower-spec hardware',
                    'Lighter weight processing',
                    'OpenCV built-in classifiers'
                  ]}
                />
                <InfoCard
                  title="Detection Method"
                  details={[
                    'Grayscale conversion',
                    'Haar Cascade face detection',
                    'Rectangle bounding boxes',
                    'Basic face count',
                    'No pose/gaze estimation',
                    'Limited accuracy vs MediaPipe'
                  ]}
                />
              </div>
            </div>
          </div>
        </Section>

        {/* Alert System */}
        <Section
          title="Alert Generation System"
          icon={<AlertCircle className="w-5 h-5" />}
          color="red"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AlertCard
              title="Head Pose Alerts"
              alerts={[
                { name: 'head_turned_left', condition: 'Yaw < -30°' },
                { name: 'head_turned_right', condition: 'Yaw > 30°' },
                { name: 'head_tilted_up', condition: 'Pitch < -20°' },
                { name: 'head_tilted_down', condition: 'Pitch > 20°' }
              ]}
            />
            <AlertCard
              title="Gaze Alerts"
              alerts={[
                { name: 'looking_away', condition: 'Gaze off-screen' },
                { name: 'eyes_closed', condition: 'Eye aspect ratio low' },
                { name: 'prolonged_look_away', condition: '>5s off-screen' }
              ]}
            />
            <AlertCard
              title="Presence Alerts"
              alerts={[
                { name: 'no_face', condition: 'Zero faces detected' },
                { name: 'multi_face', condition: '>1 face detected' },
                { name: 'face_too_close', condition: 'Face bbox > threshold' },
                { name: 'face_too_far', condition: 'Face bbox < threshold' }
              ]}
            />
            <AlertCard
              title="Device Alerts"
              alerts={[
                { name: 'device_detected', condition: 'YOLO phone/tablet' },
                { name: 'device_in_hand', condition: 'Device near face' }
              ]}
            />
            <AlertCard
              title="Behavioral Alerts"
              alerts={[
                { name: 'looping_video', condition: 'Loop confidence ≥ 0.6' },
                { name: 'away_from_screen', condition: 'Inactivity timer' },
                { name: 'suspicious_movement', condition: 'Rapid pose changes' }
              ]}
            />
            <AlertCard
              title="Client-Side Merge"
              alerts={[
                { name: 'tab_switch', condition: 'Visibility change' },
                { name: 'fullscreen_exit', condition: 'ESC pressed' },
                { name: 'right_click', condition: 'Context menu' },
                { name: 'copy_paste', condition: 'Keyboard event' }
              ]}
            />
          </div>
        </Section>

        {/* Focus Score Calculation */}
        <Section
          title="Focus Score Calculation"
          icon={<Activity className="w-5 h-5" />}
          color="indigo"
        >
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h4 className="text-indigo-900 mb-3">Scoring Algorithm</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="text-sm text-indigo-800 mb-2">Base Score Components</h5>
                <div className="space-y-2 text-sm text-indigo-700">
                  <div className="flex justify-between">
                    <span>Face detected:</span>
                    <span className="font-mono">+30 pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Head pose in range:</span>
                    <span className="font-mono">+25 pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gaze on screen:</span>
                    <span className="font-mono">+25 pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Single face only:</span>
                    <span className="font-mono">+10 pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span>No device detected:</span>
                    <span className="font-mono">+10 pts</span>
                  </div>
                  <div className="border-t border-indigo-300 pt-2 flex justify-between font-medium">
                    <span>Maximum:</span>
                    <span className="font-mono">100 pts</span>
                  </div>
                </div>
              </div>
              <div>
                <h5 className="text-sm text-indigo-800 mb-2">Smoothing & Normalization</h5>
                <ul className="space-y-1.5 text-sm text-indigo-700">
                  <li>• Raw score: 0-100 range</li>
                  <li>• Exponential moving average (EMA)</li>
                  <li>• Alpha = 0.3 (smoothing factor)</li>
                  <li>• Reduces frame-to-frame jitter</li>
                  <li>• Normalized to 0.0 - 1.0 scale</li>
                  <li>• Returned to client as focus_score</li>
                  <li>• Client inverts for cheat probability</li>
                  <li>• cheat_score = 1 - focus_score</li>
                </ul>
              </div>
            </div>
          </div>
        </Section>

        {/* Response Format */}
        <Section
          title="ML Response Format"
          icon={<Brain className="w-5 h-5" />}
          color="blue"
        >
          <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <pre>{`{
  "focus_score": 0.87,
  "status": "focused",
  "alerts": [
    "head_turned_left",
    "looking_away"
  ],
  "loop_detection": {
    "confidence": 0.23,
    "reuse_ratio": 0.15,
    "dominant_cluster_duration": 12
  },
  "device_presence": 0.02,
  "face_count": 1,
  "head_pose": {
    "yaw": -15.2,
    "pitch": 5.8,
    "roll": 2.1
  },
  "timestamp": "2025-10-31T14:23:45.123Z"
}`}</pre>
          </div>
        </Section>
      </div>

      {/* Performance Notes */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <h3 className="text-slate-900 mb-4">Performance Characteristics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PerfCard
            title="Processing Speed"
            metrics={[
              'Target: 30 FPS (33ms/frame)',
              'MediaPipe: ~20-40ms',
              'YOLO inference: ~50-100ms',
              'Total latency: ~80-150ms',
              'Async processing non-blocking'
            ]}
          />
          <PerfCard
            title="Resource Usage"
            metrics={[
              'CPU-based processing',
              'Optional GPU acceleration (CUDA)',
              'Memory: ~500MB base',
              'Model loading: one-time cost',
              'Scales to multiple sessions'
            ]}
          />
          <PerfCard
            title="Accuracy Metrics"
            metrics={[
              'Face detection: ~98% accuracy',
              'Pose estimation: ±5° error',
              'YOLO device: ~85% precision',
              'Loop detection: tunable threshold',
              'False positive: ~2-5%'
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
    purple: 'bg-purple-50 border-purple-300',
    blue: 'bg-blue-50 border-blue-300',
    red: 'bg-red-50 border-red-300',
    indigo: 'bg-indigo-50 border-indigo-300',
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

function InfoCard({ title, path, details }: {
  title: string;
  path?: string;
  details: string[];
}) {
  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200">
      <h4 className="text-slate-900 mb-1">{title}</h4>
      {path && <code className="text-xs text-slate-500">{path}</code>}
      <ul className="mt-3 space-y-1.5">
        {details.map((detail, i) => (
          <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
            <span className="text-purple-500 mt-0.5">•</span>
            <span>{detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AlertCard({ title, alerts }: {
  title: string;
  alerts: { name: string; condition: string }[];
}) {
  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200">
      <h4 className="text-slate-900 mb-3">{title}</h4>
      <div className="space-y-2">
        {alerts.map((alert, i) => (
          <div key={i} className="text-sm">
            <code className="text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
              {alert.name}
            </code>
            <div className="text-xs text-slate-600 mt-0.5">{alert.condition}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PerfCard({ title, metrics }: { title: string; metrics: string[] }) {
  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
      <h4 className="text-slate-900 mb-3">{title}</h4>
      <ul className="space-y-1.5">
        {metrics.map((metric, i) => (
          <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <span>{metric}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
