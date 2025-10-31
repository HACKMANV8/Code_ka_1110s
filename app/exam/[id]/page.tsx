'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { ExamQuestion } from '@/lib/types/database';
import type { RealtimeChannel } from '@supabase/supabase-js';

const DETECTOR_ENDPOINT = process.env.NEXT_PUBLIC_DETECTOR_URL || 'http://127.0.0.1:4000/scan';

export const dynamic = 'force-dynamic'

interface AnalysisResult {
  success: boolean;
  focus_score: number;
  raw_frame_score: number;
  status: string;
  state: string;
  away_timer: number;
  alerts: string[];
  timestamp: number;
}

export default function ExamPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;
  
  const [examTitle, setExamTitle] = useState('Loading...');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  
  const [isStarted, setIsStarted] = useState(false);
  const [currentScore, setCurrentScore] = useState(100);
  const [status, setStatus] = useState('Ready to start');
  const [alerts, setAlerts] = useState<string[]>([]);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [manualAlerts, setManualAlerts] = useState<string[]>([]);
  const [isDesktop, setIsDesktop] = useState(false);
  const [questionPaneWidth, setQuestionPaneWidth] = useState(0.65);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);
  const [isDark, setIsDark] = useState(true);

  const [detectorWarningActive, setDetectorWarningActive] = useState(false);
  const [detectorCountdown, setDetectorCountdown] = useState(20);
  const [detectorWarningMessage, setDetectorWarningMessage] = useState<string>('');
  const [detectorWarningCount, setDetectorWarningCount] = useState(0);
  const [detectorStatusDetails, setDetectorStatusDetails] = useState<string | null>(null);

  type ParsedQuestion = Omit<ExamQuestion, 'id'> & { id?: number };

  const addManualAlert = useCallback((alert: string) => {
    setManualAlerts((prev) => {
      if (prev.includes(alert)) {
        return prev;
      }
      const next = [...prev, alert];
      manualAlertsRef.current = next;
      return next;
    });
  }, []);
  
  const normalizeQuestion = (raw: unknown): ParsedQuestion | null => {
    if (!raw) {
      return null;
    }

    if (typeof raw === 'string') {
      return {
        id: undefined,
        prompt: raw,
        type: 'text',
      };
    }

    if (typeof raw === 'object') {
      const candidate = raw as Record<string, unknown>;
      const prompt =
        typeof candidate.prompt === 'string'
          ? candidate.prompt
          : typeof candidate.question === 'string'
          ? candidate.question
          : null;

      if (!prompt) {
        return null;
      }

      const typeCandidate = typeof candidate.type === 'string' ? candidate.type : 'text';
      const type: ExamQuestion['type'] = typeCandidate === 'mcq' ? 'mcq' : 'text';
      const rawId = candidate.id;
      const parsedId = typeof rawId === 'number' && rawId > 0 ? rawId : undefined;

      const optionsSource = Array.isArray(candidate.options) ? candidate.options : [];
      const options = optionsSource
        .map((optionRaw) => {
          if (typeof optionRaw === 'string') {
            return { text: optionRaw, isCorrect: false };
          }
          if (optionRaw && typeof optionRaw === 'object') {
            const option = optionRaw as Record<string, unknown>;
            const text =
              typeof option.text === 'string'
                ? option.text
                : typeof option.option_text === 'string'
                ? option.option_text
                : null;
            if (!text) {
              return null;
            }
            const isCorrectRaw = option.isCorrect ?? option.is_correct;
            const isCorrect = typeof isCorrectRaw === 'boolean' ? isCorrectRaw : false;
            return { text, isCorrect };
          }
          return null;
        })
        .filter((item): item is { text: string; isCorrect: boolean } => item !== null);

      if (type === 'mcq') {
        return { id: parsedId, prompt, type, options };
      }

      return { id: parsedId, prompt, type: 'text' };
    }

    return null;
  };
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Stream reference for camera
  const streamRef = useRef<MediaStream | null>(null);
  
  // WebRTC for admin live viewing
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  // Score buffer for batch saving
  const scoreBufferRef = useRef<AnalysisResult[]>([]);
  const supabase = createClient();
  const tabInactiveRef = useRef(false);
  const manualAlertsRef = useRef<string[]>([]);
  const remoteAlertsRef = useRef<string[]>([]);
  const isStartedRef = useRef(false);
  const TAB_INACTIVE_ALERT = 'tab_inactive';
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const isResizingRef = useRef(false);
  
  // Tab restriction & fullscreen enforcement
  const isFullscreenRef = useRef(false);
  const TAB_SWITCH_ALERT = 'tab_switched_away';
  
  // Snapshot tracking - more rigorous criteria
  const lastSnapshotTimeRef = useRef<number>(0);
  const lowScoreCountRef = useRef<number>(0);
  const SNAPSHOT_COOLDOWN = 10000; // 10 seconds between snapshots
  const LOW_SCORE_THRESHOLD = 30; // Only capture if score < 30 (very suspicious)
  const CONSECUTIVE_LOW_SCORES = 3; // Need 3 consecutive low scores

  const detectorWarningCountRef = useRef(0);
  const detectorWarningActiveRef = useRef(false);
  const detectorCountdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const detectorPollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const detectorForcedSubmitRef = useRef(false);

  useEffect(() => {
    manualAlertsRef.current = manualAlerts;
    setAlerts(Array.from(new Set([...remoteAlertsRef.current, ...manualAlerts])));
  }, [manualAlerts]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const theme = localStorage.getItem('theme');
      setIsDark(theme !== 'light');
    }
  }, []);

  // Cleanup WebRTC connections on unmount
  useEffect(() => {
    return () => {
      // Cleanup WebRTC peer connection
      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }
      
      // Cleanup Supabase realtime channel
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      
      // Stop media stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const pageBackgroundClass = isDark ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-900';
  const cardClass = isDark ? 'bg-slate-800/60 border border-slate-700' : 'bg-white border border-gray-200';
  const mutedPanelClass = isDark ? 'bg-slate-800/40 border border-slate-700/80' : 'bg-gray-50 border border-gray-200/80';
  const highlightPanelClass = isDark ? 'bg-blue-500/15 border border-blue-500/40' : 'bg-blue-50 border border-blue-200';
  const warningPanelClass = isDark ? 'bg-red-500/15 border border-red-500/40' : 'bg-red-50 border border-red-200';
  const successPanelClass = isDark ? 'bg-emerald-500/15 border border-emerald-500/40' : 'bg-emerald-50 border border-emerald-200';
  const subtleTextClass = isDark ? 'text-gray-300' : 'text-gray-600';
  const secondaryTextClass = isDark ? 'text-white/70' : 'text-gray-600';
  const headingTextClass = isDark ? 'text-white' : 'text-gray-900';
  const questionSurfaceClass = isDark
    ? 'border border-slate-700 bg-slate-800/40 hover:border-blue-400/60 hover:bg-slate-800/60'
    : 'border border-gray-200 bg-white hover:border-blue-500/40 hover:bg-blue-50';
  const questionBadgeClass = 'bg-gradient-to-br from-blue-500 to-blue-600';
  const questionOptionLabelBase = isDark
    ? 'flex items-center gap-3 rounded-lg bg-slate-800/40 border border-slate-700 text-white/80'
    : 'flex items-center gap-3 rounded-lg bg-white border border-gray-200 text-gray-700';
  const questionOptionEmptyText = isDark ? 'text-white/60' : 'text-gray-500';
  const inputBaseClass = isDark
    ? 'border border-slate-700 bg-slate-800/50 text-white placeholder:text-white/40 focus:border-blue-500 focus:ring-blue-500/40'
    : 'border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:ring-blue-600/20';

  useEffect(() => {
    isStartedRef.current = isStarted;

    if (isStarted) {
      // Disable right-click context menu during exam
      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        console.log('[Blocked] Right-click context menu');
        return false;
      };

      // Prevent text selection and copying
      const handleSelectStart = (e: Event) => {
        // Only block during exam
        if (isStartedRef.current) {
          (e as any).preventDefault?.();
        }
      };

      // Prevent copy
      const handleCopy = (e: ClipboardEvent) => {
        e.preventDefault();
        console.log('[Blocked] Copy attempt');
        return false;
      };

      // Prevent cut
      const handleCut = (e: ClipboardEvent) => {
        e.preventDefault();
        console.log('[Blocked] Cut attempt');
        return false;
      };

      // Warn before unload
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave the exam? All progress will be lost.';
        return e.returnValue;
      };

      document.addEventListener('contextmenu', handleContextMenu, true);
      document.addEventListener('selectstart', handleSelectStart, true);
      document.addEventListener('copy', handleCopy, true);
      document.addEventListener('cut', handleCut, true);
      window.addEventListener('beforeunload', handleBeforeUnload);

      // Disable body selection
      document.body.style.userSelect = 'none';
      (document.body as any).style.webkitUserSelect = 'none';

      return () => {
        document.removeEventListener('contextmenu', handleContextMenu, true);
        document.removeEventListener('selectstart', handleSelectStart, true);
        document.removeEventListener('copy', handleCopy, true);
        document.removeEventListener('cut', handleCut, true);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        document.body.style.userSelect = 'auto';
        (document.body as any).style.webkitUserSelect = 'auto';
      };
    }
  }, [isStarted]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const updateMatch = (target: MediaQueryList | MediaQueryListEvent) => {
      setIsDesktop(target.matches);
    };
    updateMatch(mediaQuery);
    const listener = (event: MediaQueryListEvent) => updateMatch(event);
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', listener);
    } else {
      // Fallback for Safari
      // @ts-ignore
      mediaQuery.addListener(listener);
    }
    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', listener);
      } else {
        // @ts-ignore
        mediaQuery.removeListener(listener);
      }
    };
  }, []);

  // Fetch exam details and start session
  useEffect(() => {
    const initExam = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }
        setUserId(user.id);

        // Fetch exam details
        const { data: exam, error: examError } = await supabase
          .from('exams')
        .select('name, questions')
          .eq('id', examId)
          .single();

        if (examError) {
          console.error('Failed to load exam details', examError);
        }

        if (!exam) {
          setStatus(
            examError?.message
              ? `Error: ${examError.message}`
              : 'Exam not found',
          );
          setTimeout(() => router.push('/dashboard'), 2000);
          return;
        }

        setExamTitle(exam.name);

        const finalizeQuestions = (items: ParsedQuestion[]): ExamQuestion[] =>
          items.map((item, index) => ({
            id: item.id && item.id > 0 ? item.id : index + 1,
            prompt: item.prompt,
            type: item.type,
            ...(item.type === 'mcq' ? { options: item.options ?? [] } : {}),
          }));

        const extractQuestions = (raw: unknown): ExamQuestion[] => {
          if (!raw) {
            return [];
          }

          if (Array.isArray(raw)) {
            const parsed = raw
              .map((item) => normalizeQuestion(item))
              .filter((item): item is ParsedQuestion => item !== null)
              .slice(0, 50);
            return finalizeQuestions(parsed);
          }

          if (typeof raw === 'string') {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                const questions = parsed
                  .map((item) => normalizeQuestion(item))
                  .filter((item): item is ParsedQuestion => item !== null)
                  .slice(0, 50);
                return finalizeQuestions(questions);
              }
            } catch (error) {
              console.warn('Failed to parse questions JSON', error);
            }
          }

          return [];
        };

        setQuestions(extractQuestions(exam.questions));

        // Start exam session
        const response = await fetch('/api/exam/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ exam_id: examId, student_id: user.id }),
        });

        if (!response.ok) {
          const error = await response.json();
          setStatus(`Error: ${error.error || 'Failed to start exam'}`);
          setTimeout(() => router.push('/dashboard'), 2000);
          return;
        }

        const result = await response.json();
        if (result.success) {
          setSessionId(result.session_id);
          setRoomId(`exam-${result.session_id}`);
        } else {
          setStatus(`Error: ${result.error || 'Failed to start exam'}`);
          setTimeout(() => router.push('/dashboard'), 2000);
        }
      } catch (error) {
        console.error('Error initializing exam:', error);
        setStatus('Error initializing exam');
        setTimeout(() => router.push('/dashboard'), 2000);
      }
    };

    initExam();
  }, [examId, router, supabase]);

  // Setup WebRTC for admin live viewing
  const setupWebRTC = useCallback(async (stream: MediaStream) => {
    if (!roomId) return;

    // Cleanup existing connection first
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    
    if (channelRef.current) {
      await channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    peerRef.current = peer;

    stream.getTracks().forEach((track) => peer.addTrack(track, stream));

    const channel = supabase.channel(`webrtc:${roomId}`, {
      config: { broadcast: { ack: true } },
    });
    channelRef.current = channel;

    peer.onicecandidate = async (event) => {
      if (event.candidate && channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'streamer-candidate',
          payload: { candidate: event.candidate.toJSON() },
        });
      }
    };

    channel.on('broadcast', { event: 'viewer-ready' }, async () => {
      if (!peerRef.current) return;
      try {
        const offer = await peerRef.current.createOffer();
        await peerRef.current.setLocalDescription(offer);
        await channel.send({
          type: 'broadcast',
          event: 'offer',
          payload: { sdp: offer.sdp },
        });
      } catch (error) {
        console.error('WebRTC offer creation failed:', error);
        // Continue exam even if WebRTC fails - proctoring is optional
      }
    });

    channel.on('broadcast', { event: 'answer' }, async ({ payload }) => {
      if (!peerRef.current || !payload?.sdp) return;
      try {
        await peerRef.current.setRemoteDescription(
          new RTCSessionDescription({ type: 'answer', sdp: payload.sdp })
        );
      } catch (error) {
        console.error('WebRTC answer handling failed:', error);
      }
    });

    channel.on('broadcast', { event: 'viewer-candidate' }, async ({ payload }) => {
      if (!peerRef.current || !payload?.candidate) return;
      try {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (error) {
        console.error('WebRTC ice candidate failed:', error);
      }
    });

    await channel.subscribe();
  }, [roomId, supabase]);

  // Start exam
  const startExam = async () => {
    if (!sessionId || !userId) return;

    try {
      setManualAlerts([]);
      remoteAlertsRef.current = [];
      setAlerts([]);
      // Get webcam access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Setup WebRTC for admin viewing
      await setupWebRTC(stream);

      // Start ML analysis (no WebSocket needed, using HTTP POST)
      console.log('Starting ML analysis via HTTP');
      setStatus('Monitoring started');
      setIsStarted(true);
      isStartedRef.current = true;

      // Request fullscreen for maximum security
      try {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
          isFullscreenRef.current = true;
          console.log('[Exam] Entered fullscreen mode');
        } else if ((elem as any).webkitRequestFullscreen) {
          await (elem as any).webkitRequestFullscreen();
          isFullscreenRef.current = true;
        }
      } catch (error) {
        console.warn('Could not enter fullscreen:', error);
        // Still allow exam to proceed
      }

      await captureAndAnalyze();

    } catch (error) {
      console.error('Failed to start exam:', error);
      alert('Failed to access webcam. Please allow camera access.');
    }
  };

  // Capture frame and send to ML model via HTTP POST
  const captureAndAnalyze = async () => {
    if (!isStartedRef.current) {
      console.log('[Capture] Stopped - exam not started');
      return;
    }
    if (!videoRef.current || !canvasRef.current) {
      console.log('[Capture] Waiting for video/canvas...');
      setTimeout(captureAndAnalyze, 1000);
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    // Send frame to ML server via HTTP POST
    try {
      const baseUrl = process.env.NEXT_PUBLIC_ML_SERVER_URL || '/api/ml-proxy';
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frame: imageData }),
      });

      if (response.ok) {
        const result: AnalysisResult = await response.json();
        
        console.log('[ML Result]', result.success ? '✅' : '❌', `Focus: ${result.focus_score}`);
        
        if (result.success) {
          setCurrentScore(Math.round(result.focus_score));
          setStatus(result.status);
          const remoteAlerts = result.alerts || [];
          remoteAlertsRef.current = remoteAlerts;
          setAlerts(Array.from(new Set([...remoteAlerts, ...manualAlertsRef.current])));

          // Add to buffer
          scoreBufferRef.current.push(result);
          console.log('[Score Buffer] Size:', scoreBufferRef.current.length);

          // More rigorous snapshot criteria
          const now = Date.now();
          const timeSinceLastSnapshot = now - lastSnapshotTimeRef.current;
          const hasCriticalAlerts = remoteAlerts.some(alert => 
            alert.includes('device_detected') || 
            alert.includes('looking_away') || 
            alert.includes('no_face')
          );

          // Track consecutive low scores
          if (result.focus_score < LOW_SCORE_THRESHOLD) {
            lowScoreCountRef.current++;
          } else {
            lowScoreCountRef.current = 0; // Reset if score improves
          }

          // Only capture snapshot if:
          // 1. Cooldown period has passed (10 seconds)
          // 2. Score is critically low (< 30) for 3 consecutive frames
          // 3. OR there are critical alerts present
          const shouldCapture = 
            timeSinceLastSnapshot > SNAPSHOT_COOLDOWN &&
            (
              (lowScoreCountRef.current >= CONSECUTIVE_LOW_SCORES) ||
              hasCriticalAlerts
            );

          if (shouldCapture) {
            console.log('[Snapshot Trigger]', {
              lowScoreCount: lowScoreCountRef.current,
              hasCriticalAlerts,
              currentScore: result.focus_score
            });
            captureSnapshot();
            lastSnapshotTimeRef.current = now;
            lowScoreCountRef.current = 0; // Reset counter after capture
          }
        }
      } else {
        console.error('[ML Error]', response.status, await response.text());
      }
    } catch (error) {
      console.error('[ML analysis error]', error);
    }

    // Continue at 30 FPS
    setTimeout(captureAndAnalyze, 33);
  };

  // Capture and save suspicious snapshot
  const captureSnapshot = async () => {
    if (!canvasRef.current || !sessionId || !userId) {
      console.log('Cannot capture snapshot - missing requirements:', {
        canvas: !!canvasRef.current,
        sessionId: !!sessionId,
        userId: !!userId
      })
      return;
    }

    console.log('Capturing suspicious snapshot...')
    const canvas = canvasRef.current;
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.9);
    });

    // Upload to Supabase Storage
    const filename = `${userId}/${sessionId}/${Date.now()}.jpg`;
    console.log('Uploading snapshot:', filename)
    
    const { data, error } = await supabase.storage
      .from('exam-snapshots')
      .upload(filename, blob);

    if (error) {
      console.error('Error uploading snapshot:', error)
      return
    }

    if (data) {
      console.log('Snapshot uploaded successfully, path:', data.path)
      
      // Save metadata to database - use the exact path returned
      const { error: dbError } = await supabase.from('suspicious_snapshots').insert({
        session_id: sessionId,
        storage_path: data.path, // This should be the full path like "userId/sessionId/timestamp.jpg"
        captured_at: new Date().toISOString(),
      });

      if (dbError) {
        console.error('Error saving snapshot metadata:', dbError)
      } else {
        console.log('Snapshot metadata saved successfully')
      }
    }
  };

  useEffect(() => {
    if (!isStarted) {
      return;
    }

    // Track user activity (keyboard, mouse, focus)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Add tab switch alert - student switched to another tab
        setManualAlerts((prev) => (prev.includes(TAB_SWITCH_ALERT) ? prev : [...prev, TAB_SWITCH_ALERT]));
        console.log('[Tab Switch] Student switched away from exam tab');
      }
    };

    const handleWindowBlur = () => {
      // Also flag as tab switch for extra severity
      setManualAlerts((prev) => (prev.includes(TAB_SWITCH_ALERT) ? prev : [...prev, TAB_SWITCH_ALERT]));
    };

    // Block keyboard shortcuts that could open new tabs or navigate away
    const handleKeyDownShortcuts = (e: KeyboardEvent) => {
      if (!isStartedRef.current) return;

      // Ctrl+T, Cmd+T - New Tab
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        console.log('[Blocked] Ctrl+T - New tab attempt');
        return false;
      }

      // Ctrl+N, Cmd+N - New Window
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        console.log('[Blocked] Ctrl+N - New window attempt');
        return false;
      }

      // Ctrl+W, Cmd+W - Close Tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        console.log('[Blocked] Ctrl+W - Close tab attempt');
        return false;
      }

      // Alt+Tab - Switch Application (Windows)
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        console.log('[Blocked] Alt+Tab - App switch attempt');
        return false;
      }

      // Cmd+Tab - Switch Application (Mac)
      if (e.metaKey && e.key === 'Tab') {
        e.preventDefault();
        console.log('[Blocked] Cmd+Tab - App switch attempt');
        return false;
      }

      // F11 - Fullscreen toggle (prevent exiting)
      if (e.key === 'F11') {
        e.preventDefault();
        console.log('[Blocked] F11 - Fullscreen toggle attempt');
        return false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('keydown', handleKeyDownShortcuts, true); // Block dangerous shortcuts

    // Fullscreen change detection
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement
      );

      if (isFullscreenRef.current && !isCurrentlyFullscreen) {
        // Student exited fullscreen - show prompt to return
        console.log('[Fullscreen] Student exited fullscreen - showing prompt');
        setShowFullscreenPrompt(true);
        setStatus('⚠️ Please return to fullscreen');
      } else if (isCurrentlyFullscreen) {
        // Entered or re-entered fullscreen
        isFullscreenRef.current = true;
        setShowFullscreenPrompt(false);
        setStatus('Monitoring your exam...');
        console.log('[Fullscreen] Entered fullscreen mode');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('keydown', handleKeyDownShortcuts, true);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  }, [isStarted]);

  const startResize = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDesktop) return;
    event.preventDefault();
    isResizingRef.current = true;
    document.body.style.userSelect = 'none';
  }, [isDesktop]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizingRef.current || !layoutRef.current) return;
      const rect = layoutRef.current.getBoundingClientRect();
      const relativeX = (event.clientX - rect.left) / rect.width;
      const clamped = Math.max(0.45, Math.min(0.85, relativeX));
      setQuestionPaneWidth(clamped);
    };

    const stopResize = () => {
      if (!isResizingRef.current) return;
      isResizingRef.current = false;
      document.body.style.removeProperty('user-select');
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResize);
    window.addEventListener('mouseleave', stopResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResize);
      window.removeEventListener('mouseleave', stopResize);
    };
  }, []);

  useEffect(() => {
    if (!isDesktop && isResizingRef.current) {
      isResizingRef.current = false;
      document.body.style.removeProperty('user-select');
    }
  }, [isDesktop]);


  // Batch save scores every 3 seconds
  useEffect(() => {
    if (!isStarted) return;

    const interval = setInterval(async () => {
      if (scoreBufferRef.current.length === 0) return;

      // Take every 10th score to reduce DB writes
      const scores = scoreBufferRef.current.filter((score, i) => {
        if (Array.isArray(score.alerts) && score.alerts.length > 0) {
          return true;
        }
        return i % 10 === 0;
      });
      
      if (scores.length > 0) {
        await fetch('/api/exam/analyze-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionId,
            scores,
          }),
        });
        
        scoreBufferRef.current = [];
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isStarted, sessionId, userId]);

  // Submit exam
  const submitExam = useCallback(async (options?: { forceCheatScore?: number; forceStatus?: 'submitted' | 'flagged'; reason?: string }) => {
    if (!sessionId) return;

    // Stop everything
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (channelRef.current) {
      await channelRef.current.unsubscribe();
    }
    if (peerRef.current) {
      peerRef.current.close();
    }
    tabInactiveRef.current = false;
    remoteAlertsRef.current = [];
    setManualAlerts([]);
    setAlerts([]);

    detectorWarningActiveRef.current = false;
    detectorForcedSubmitRef.current = true;
    if (detectorCountdownIntervalRef.current) {
      clearInterval(detectorCountdownIntervalRef.current);
      detectorCountdownIntervalRef.current = null;
    }
    if (detectorPollIntervalRef.current) {
      clearInterval(detectorPollIntervalRef.current);
      detectorPollIntervalRef.current = null;
    }

    console.log('SUBMITTED');
    isStartedRef.current = false;
    setIsStarted(false);

    const payload: Record<string, unknown> = { session_id: sessionId };
    if (typeof options?.forceCheatScore === 'number') {
      const clamped = Math.max(0, Math.min(100, Math.round(options.forceCheatScore)));
      payload.force_cheat_score = clamped;
    }
    if (options?.forceStatus) {
      payload.force_status = options.forceStatus;
    }

    const response = await fetch('/api/exam/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (result.success) {
      router.push(`/exam/${examId}/results?score=${result.final_cheat_score}&status=${result.status}&sessionId=${sessionId}`);
    }
  }, [examId, router, sessionId]);

  const clearDetectorCountdown = useCallback(() => {
    if (detectorCountdownIntervalRef.current) {
      clearInterval(detectorCountdownIntervalRef.current);
      detectorCountdownIntervalRef.current = null;
    }
  }, []);

  const finalizeDetectorViolation = useCallback(() => {
    detectorWarningActiveRef.current = false;
    setDetectorWarningActive(false);
    setDetectorCountdown(0);
    clearDetectorCountdown();
    submitExam({ forceCheatScore: 0, forceStatus: 'flagged' });
  }, [clearDetectorCountdown, submitExam]);

  const startDetectorCountdown = useCallback((result: any) => {
    if (detectorForcedSubmitRef.current) {
      return;
    }

    const nextCount = detectorWarningCountRef.current + 1;
    detectorWarningCountRef.current = nextCount;
    setDetectorWarningCount(nextCount);

    detectorWarningActiveRef.current = true;
    setDetectorWarningActive(true);
    setDetectorCountdown(20);

    const suspiciousProcesses = Array.isArray(result?.findings)
      ? result.findings
          .map((finding: any) => finding?.name || finding?.match?.signature || finding?.match?.label)
          .filter((item: unknown): item is string => typeof item === 'string')
          .slice(0, 3)
      : [];

    const message = suspiciousProcesses.length > 0
      ? `Detected unauthorized application: ${suspiciousProcesses.join(', ')}.`
      : 'Detected unauthorized external manipulation.';

    setDetectorWarningMessage(message);
    setDetectorStatusDetails(null);

    clearDetectorCountdown();
    detectorCountdownIntervalRef.current = setInterval(() => {
      setDetectorCountdown((prev) => {
        if (prev <= 1) {
          clearDetectorCountdown();
          finalizeDetectorViolation();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearDetectorCountdown, finalizeDetectorViolation]);

  const resolveDetectorWarning = useCallback(() => {
    if (!detectorWarningActiveRef.current) {
      return;
    }
    clearDetectorCountdown();
    detectorWarningActiveRef.current = false;
    setDetectorWarningActive(false);
    setDetectorCountdown(20);
    setDetectorWarningMessage('');
    addManualAlert('external_manipulation_detected');
    setDetectorStatusDetails('External manipulation attempt logged. You may continue.');
  }, [addManualAlert, clearDetectorCountdown]);

  // Save student answer for MCQ questions
  const handleMCQAnswer = async (questionId: number | string, selectedOption: string) => {
    if (!sessionId) {
      console.error('Cannot save answer: sessionId is missing');
      return;
    }

    console.log(`Saving MCQ answer - Question: ${questionId}, Option: "${selectedOption}"`);

    const answer = {
      session_id: sessionId,
      question_id: questionId,  // Keep type as-is (number or string matching exam questions)
      selected_options: [selectedOption],
      answered_at: new Date().toISOString(),
    };

    try {
      // Upsert will update if exists (due to UNIQUE constraint), insert if new
      const { data, error } = await supabase
        .from('student_answers')
        .upsert([answer], {
          onConflict: 'session_id,question_id'
        });
      
      if (error) {
        console.error('Error upserting MCQ answer:', { 
          error, 
          answer,
          questionId,
          selectedOption 
        });
        alert('Failed to save answer. Please try again.');
        return;
      } else {
        console.log(`✓ MCQ answer saved successfully for question ${questionId}`);
      }

      // Update local state
      setStudentAnswers((prev) => {
        const newMap = new Map(prev);
        newMap.set(questionId, answer);
        return newMap;
      });

    } catch (error) {
      console.error('Exception while saving answer:', error);
      alert('An error occurred while saving your answer. Please try again.');
    }
  };

  // Save student answer for text questions
  const handleTextAnswer = async (questionId: number | string, text: string) => {
    if (!sessionId) {
      console.error('Cannot save answer: sessionId is missing');
      return;
    }
    
    if (!text.trim()) {
      console.log(`Skipping empty text answer for question ${questionId}`);
      return;
    }

    console.log(`Saving text answer - Question: ${questionId}, Length: ${text.length} chars`);

    const answer = {
      session_id: sessionId,
      question_id: questionId,  // Keep type as-is (number or string matching exam questions)
      text_answer: text,
      answered_at: new Date().toISOString(),
    };

    try {
      // Upsert will update if exists (due to UNIQUE constraint), insert if new
      const { data, error } = await supabase
        .from('student_answers')
        .upsert([answer], {
          onConflict: 'session_id,question_id'
        });
      
      if (error) {
        console.error('Error upserting text answer:', { 
          error, 
          answer,
          questionId 
        });
        alert('Failed to save answer. Please try again.');
        return;
      } else {
        console.log(`✓ Text answer saved successfully for question ${questionId}`);
      }

      // Update local state
      setStudentAnswers((prev) => {
        const newMap = new Map(prev);
        newMap.set(questionId, answer);
        return newMap;
      });

    } catch (error) {
      console.error('Exception while saving text answer:', error);
      alert('An error occurred while saving your answer. Please try again.');
    }
  };

  // Check if question has been answered
  const isQuestionAnswered = (questionId: number | string) => {
    return studentAnswers.has(questionId);
  };

  // Get selected option for MCQ
  const getSelectedOption = (questionId: number | string) => {
    const answer = studentAnswers.get(questionId);
    return answer?.selected_options?.[0] || null;
  };

  // Get text answer
  const getTextAnswer = (questionId: number | string) => {
    const answer = studentAnswers.get(questionId);
    return answer?.text_answer || '';
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isStartedRef.current = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
      if (peerRef.current) {
        peerRef.current.close();
      }
      tabInactiveRef.current = false;
      document.body.style.removeProperty('user-select');
    };
  }, []);

  useEffect(() => {
    if (!isStarted) {
      if (detectorPollIntervalRef.current) {
        clearInterval(detectorPollIntervalRef.current);
        detectorPollIntervalRef.current = null;
      }
      clearDetectorCountdown();
      detectorWarningActiveRef.current = false;
      setDetectorWarningActive(false);
      setDetectorCountdown(20);
      setDetectorWarningMessage('');
      setDetectorStatusDetails(null);
      detectorForcedSubmitRef.current = false;
      return;
    }

    detectorForcedSubmitRef.current = false;
    let cancelled = false;

    const pollDetector = async () => {
      try {
        const response = await fetch(DETECTOR_ENDPOINT, {
          method: 'GET',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Detector responded with ${response.status}`);
        }

        const data = await response.json();
        if (cancelled) return;

        const flaggedCount = Number.isFinite(data?.flaggedProcessCount)
          ? Number(data.flaggedProcessCount)
          : Array.isArray(data?.findings)
          ? data.findings.length
          : 0;

        const hasIssue = flaggedCount > 0;

        if (hasIssue) {
          setDetectorStatusDetails(null);
          if (detectorWarningActiveRef.current) {
            return;
          }
          if (detectorWarningCountRef.current >= 2) {
            if (!detectorForcedSubmitRef.current) {
              detectorForcedSubmitRef.current = true;
              submitExam({ forceCheatScore: 100, forceStatus: 'flagged' });
            }
            return;
          }
          startDetectorCountdown(data);
        } else {
          if (detectorWarningActiveRef.current) {
            resolveDetectorWarning();
          } else {
            setDetectorStatusDetails(null);
          }
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Detector polling error:', error);
        setDetectorStatusDetails('Unable to reach monitoring service. Ensure the detector app is running.');
      }
    };

    pollDetector();
    detectorPollIntervalRef.current = setInterval(pollDetector, 3000);

    return () => {
      cancelled = true;
      if (detectorPollIntervalRef.current) {
        clearInterval(detectorPollIntervalRef.current);
        detectorPollIntervalRef.current = null;
      }
    };
  }, [clearDetectorCountdown, isStarted, resolveDetectorWarning, startDetectorCountdown, submitExam]);

  useEffect(() => {
    if (!detectorStatusDetails) {
      return;
    }
    const timeout = setTimeout(() => {
      setDetectorStatusDetails(null);
    }, 8000);

    return () => clearTimeout(timeout);
  }, [detectorStatusDetails]);

  return (
    <div className={`min-h-screen py-8 transition-colors duration-300 ${pageBackgroundClass}`}>
      {/* Fullscreen Re-enter Button */}
      {showFullscreenPrompt && isStarted && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <div className={`bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl shadow-2xl border ${isDark ? 'border-blue-400/40' : 'border-blue-300/60'} p-8 backdrop-blur-xl max-w-md`}>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white">Please Return to Fullscreen</h3>
              <p className="text-white/90 text-sm">
                You exited fullscreen mode. Click below to continue your exam in fullscreen.
              </p>
              <button
                onClick={() => {
                  const elem = document.documentElement;
                  if (elem.requestFullscreen) {
                    elem.requestFullscreen();
                  } else if ((elem as any).webkitRequestFullscreen) {
                    (elem as any).webkitRequestFullscreen();
                  } else if ((elem as any).mozRequestFullScreen) {
                    (elem as any).mozRequestFullScreen();
                  }
                }}
                className="w-full bg-white text-blue-600 font-bold py-4 px-6 rounded-xl hover:bg-white/90 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                Return to Fullscreen
              </button>
            </div>
          </div>
        </div>
      )}

      {detectorWarningActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div
            className={`max-w-lg w-full rounded-2xl p-8 shadow-2xl border ${
              isDark
                ? 'bg-red-900/90 border-red-500/60 text-red-100'
                : 'bg-white border-red-200 text-red-700'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600/80 text-white shadow-lg">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold">High Alert: External Manipulation Detected</p>
                <p className="text-sm opacity-80">Warning {detectorWarningCount} of 2</p>
              </div>
            </div>
            <p className="mb-4 leading-relaxed">
              {detectorWarningMessage || 'Unauthorized software interacting with your camera was detected. Close all external applications immediately.'}
            </p>
            <div className={`mb-6 rounded-xl border px-4 py-3 text-center ${isDark ? 'border-red-500/40 bg-red-500/10 text-red-100' : 'border-red-200 bg-red-50 text-red-700'}`}>
              <p className="text-sm font-medium">Exam will auto-submit in</p>
              <p className="mt-1 text-4xl font-bold">{detectorCountdown}s</p>
            </div>
            <p className="text-sm opacity-80">
              Close any external screen-sharing, virtual camera, or manipulation tools immediately to avoid automatic termination of your exam.
            </p>
          </div>
        </div>
      )}

      {detectorStatusDetails && !detectorWarningActive && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 px-4">
          <div
            className={`rounded-xl px-5 py-3 shadow-lg border ${
              isDark
                ? 'bg-yellow-500/20 border-yellow-400/40 text-yellow-100'
                : 'bg-yellow-50 border-yellow-200 text-yellow-700'
            }`}
          >
            {detectorStatusDetails}
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-6xl mx-auto flex flex-col gap-6 h-full px-4 lg:px-0">
        <div className={`rounded-lg shadow-md p-6 ${cardClass}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{examTitle}</h1>
            </div>
            <div className="flex items-center gap-2">
              {isStarted ? (
                <>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                  </span>
                  <span className="text-sm font-semibold text-blue-500">Monitoring Active</span>
                </>
              ) : (
                <span className={`text-sm font-semibold ${isDark ? 'text-white/60' : 'text-gray-500'}`}>Ready to Start</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 flex-1" ref={layoutRef}>
          <div
            className="relative flex flex-col"
            style={isDesktop ? { flexBasis: `${(questionPaneWidth * 100).toFixed(2)}%`, maxWidth: `${(questionPaneWidth * 100).toFixed(2)}%` } : undefined}
          >
            <div className={`rounded-lg shadow-md p-6 flex-1 ${cardClass}`}>
              {!isStarted ? (
                // Show instructions before exam starts
                <>
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                        <span className={`${headingTextClass} text-2xl`}>📋</span>
                      </div>
                      <div>
                        <h2 className={`text-3xl font-bold ${headingTextClass}`}>Exam Instructions</h2>
                        <p className={`text-sm mt-1 ${subtleTextClass}`}>Please read carefully before starting</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Important Guidelines */}
                    <div className={`rounded-lg border-l-4 border-red-500 p-6 ${warningPanelClass}`}>
                      <h3 className="font-bold mb-4 flex items-center gap-2 text-lg text-red-500">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                        Important Guidelines
                      </h3>
                      <ul className={`space-y-3 text-sm ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                        <li className="flex gap-3">
                          <svg className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                          <span><strong>Camera Monitoring:</strong> Your webcam will be monitored throughout the exam</span>
                        </li>
                        <li className="flex gap-3">
                          <svg className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                          <span><strong>Face Detection:</strong> Keep your face visible and centered at all times</span>
                        </li>
                        <li className="flex gap-3">
                          <svg className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                          <span><strong>Stay Focused:</strong> Looking away repeatedly will be flagged as suspicious</span>
                        </li>
                        <li className="flex gap-3">
                          <svg className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                          <span><strong>No Tab Switching:</strong> Leaving this tab will trigger alerts</span>
                        </li>
                        <li className="flex gap-3">
                          <svg className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                          <span><strong>No Devices:</strong> Keep phones and tablets out of camera view</span>
                        </li>
                      </ul>
                    </div>

                    {/* Setup Checklist */}
                    <div className={`rounded-lg border-l-4 border-emerald-500 p-6 ${successPanelClass}`}>
                      <h3 className="font-bold mb-4 flex items-center gap-2 text-lg text-emerald-500">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.707 2.293a1 1 0 00-1.414 1.414l9 9a1 1 0 001.414-1.414l-9-9zM4 10a2 2 0 11-4 0 2 2 0 014 0zm12 0a2 2 0 11-4 0 2 2 0 014 0z" clipRule="evenodd"/></svg>
                        Setup Checklist
                      </h3>
                      <ul className={`space-y-2.5 text-sm ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                        <li className="flex gap-3">
                          <svg className="w-5 h-5 flex-shrink-0 text-emerald-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                          <span>Environment is well-lit</span>
                        </li>
                        <li className="flex gap-3">
                          <svg className="w-5 h-5 flex-shrink-0 text-emerald-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                          <span>Face is centered in camera</span>
                        </li>
                        <li className="flex gap-3">
                          <svg className="w-5 h-5 flex-shrink-0 text-emerald-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                          <span>All other tabs and apps closed</span>
                        </li>
                        <li className="flex gap-3">
                          <svg className="w-5 h-5 flex-shrink-0 text-emerald-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                          <span>Stable internet connection verified</span>
                        </li>
                      </ul>
                    </div>

                    {/* Exam Info Card */}
                    <div className={`rounded-lg border p-6 ${mutedPanelClass}`}>
                      <h3 className={`font-bold mb-4 text-lg ${headingTextClass}`}>📝 Exam Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className={`text-xs uppercase font-semibold tracking-wide ${secondaryTextClass}`}>Title</p>
                          <p className={`text-lg font-semibold mt-1 ${headingTextClass}`}>{examTitle}</p>
                        </div>
                        <div>
                          <p className={`text-xs uppercase font-semibold tracking-wide ${secondaryTextClass}`}>Questions</p>
                          <p className={`text-lg font-semibold mt-1 ${headingTextClass}`}>{questions.length > 0 ? questions.length : 'Loading...'}</p>
                        </div>
                      </div>
                      <div className={`mt-4 pt-4 border-t ${isDark ? 'border-slate-700/60' : 'border-gray-200'}`}>
                        <p className={`text-xs uppercase font-semibold tracking-wide ${secondaryTextClass}`}>Session ID</p>
                        <p className={`text-sm font-mono mt-1 break-all ${isDark ? 'text-white/70' : 'text-gray-600'}`}>{sessionId || 'Loading...'}</p>
                      </div>
                    </div>

                    {/* Warning Banner */}
                    <div className={`rounded-lg border-l-4 border-blue-500 p-6 ${highlightPanelClass}`}>
                      <p className={`text-sm leading-relaxed ${isDark ? 'text-white/85' : 'text-gray-700'}`}>
                        <strong>⚠️ Ready to start?</strong> Once you click &quot;Start Exam&quot;, monitoring begins immediately. Make sure you have completed all the setup checks above. You cannot pause the exam once started.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                // Show questions after exam starts
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                      <span className={`${headingTextClass} text-xl`}>📝</span>
                    </div>
                    <div>
                      <h2 className={`text-xl font-semibold ${headingTextClass}`}>Exam Questions</h2>
                      <p className={`text-sm mt-0.5 ${subtleTextClass}`}>Answer all questions carefully</p>
                    </div>
                  </div>
                  <div className="mt-6 space-y-4">
                    {questions.length === 0 ? (
                      <div className={`rounded-lg px-4 py-8 text-center border ${mutedPanelClass}`}>
                        <p className={`mb-2 ${headingTextClass}`}>📚 Sample Questions</p>
                        <p className={`text-sm ${subtleTextClass}`}>Questions will appear here once added by your instructor.</p>
                      </div>
                    ) : (
                      questions.map((question, index) => (
                        <div
                          key={question.id}
                          className={`rounded-lg backdrop-blur-sm p-5 transition-all duration-200 ${questionSurfaceClass}`}
                        >
                          <div className="flex items-start gap-3">
                            <span className={`flex-shrink-0 w-8 h-8 ${questionBadgeClass} rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-lg`}>
                              {question.id ?? index + 1}
                            </span>
                            <div className="flex-1 pt-1">
                              <p className={`${headingTextClass} text-base leading-relaxed`}>{question.prompt}</p>
                              {question.type === 'mcq' ? (
                                <div className="mt-4 space-y-2">
                                  {question.options && question.options.length > 0 ? (
                                    question.options.map((option, optionIndex) => {
                                      const optionLetter = String.fromCharCode(65 + optionIndex);
                                      const isSelected = getSelectedOption(question.id) === option.text;
                                      return (
                                        <label
                                          key={optionIndex}
                                          className={`flex items-center gap-3 ${questionOptionLabelBase} ${
                                            isSelected ? 'border-blue-500 bg-blue-500/10' : 'hover:bg-white/10'
                                          } transition-colors cursor-pointer px-3 py-2`}
                                        >
                                          <input
                                            type="radio"
                                            name={`question-${question.id}`}
                                            value={option.text}
                                            checked={isSelected}
                                            onChange={() => handleMCQAnswer(question.id, option.text)}
                                            className="h-4 w-4 text-blue-500 focus:ring-blue-500"
                                            disabled={!isStarted}
                                          />
                                          <span className="flex items-center gap-2">
                                            <span className="font-bold">{optionLetter}.</span>
                                            <span>{option.text}</span>
                                          </span>
                                          {isSelected && (
                                            <span className="ml-auto text-blue-400 text-sm">✓ Selected</span>
                                          )}
                                        </label>
                                      );
                                    })
                                  ) : (
                                    <p className={`text-sm mt-3 italic ${questionOptionEmptyText}`}>
                                      No answer options have been provided yet.
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <textarea
                                  value={getTextAnswer(question.id)}
                                  onChange={(e) => setStudentAnswers(prev => {
                                    const newMap = new Map(prev);
                                    newMap.set(question.id, { text_answer: e.target.value });
                                    return newMap;
                                  })}
                                  onBlur={(e) => handleTextAnswer(question.id, e.target.value)}
                                  disabled={!isStarted}
                                  onPaste={(event) => {
                                    event.preventDefault();
                                  }}
                                  onCopy={(event) => {
                                    event.preventDefault();
                                  }}
                                  onCut={(event) => {
                                    event.preventDefault();
                                  }}
                                  className={`mt-4 w-full rounded-lg px-4 py-3 outline-none resize-none transition-all focus:ring-2 focus:border-blue-500 focus:ring-blue-500/40 ${inputBaseClass} ${
                                    !isStarted ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                  rows={3}
                                  placeholder={isStarted ? "Type your answer here..." : "Start the exam to answer"}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
            <div
              className="hidden lg:flex absolute top-0 right-0 h-full w-2 cursor-col-resize items-center justify-center group"
              onMouseDown={startResize}
              role="presentation"
            >
              <span className="h-12 w-1 rounded-full bg-blue-500/30 transition-colors group-hover:bg-blue-500" />
            </div>
          </div>

          <div
            className="lg:flex-1 flex flex-col gap-4"
            style={isDesktop ? { flexBasis: `${((1 - questionPaneWidth) * 100).toFixed(2)}%` } : undefined}
          >
            <div className={`backdrop-blur-md rounded-lg shadow-lg p-6 flex flex-col gap-4 ${cardClass}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-xl font-semibold flex items-center gap-2 ${headingTextClass}`}>
                  <span>📹</span> Your Webcam
                </h2>
                {isStarted ? (
                  <span className="flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-500 text-sm font-semibold rounded-full border border-red-500/30">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    Recording
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-500 text-sm font-semibold rounded-full border border-yellow-500/30">
                    Ready
                  </span>
                )}
              </div>
              <div className="relative bg-black/50 border border-black/20 rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!isStarted && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="text-center text-white space-y-3 px-6">
                      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium">Camera will activate when you start</p>
                      <p className="text-xs text-white/60">Ensure your face is centered and well-lit</p>
                    </div>
                  </div>
                )}
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className={`rounded-lg shadow-md p-6 flex flex-col gap-4 ${cardClass}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold ${headingTextClass}`}>Exam Controls</h3>
                <span className={`text-sm ${subtleTextClass}`}>
                  {isStarted ? 'Session active' : 'Session not started'}
                </span>
              </div>
              {isStarted && questions.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${headingTextClass}`}>Progress</span>
                    <span className="text-sm text-blue-400 font-bold">
                      {studentAnswers.size} / {questions.length}
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                      style={{ width: `${(studentAnswers.size / questions.length) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-white/60 mt-2">
                    {studentAnswers.size === questions.length
                      ? '✅ All questions answered!'
                      : `${questions.length - studentAnswers.size} question${questions.length - studentAnswers.size !== 1 ? 's' : ''} remaining`}
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                {!isStarted ? (
                  <button
                    onClick={startExam}
                    disabled={!sessionId}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:shadow-lg text-white font-semibold py-3.5 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    <span>▶️</span> Start Exam
                  </button>
                ) : (
                  <button
                    onClick={() => submitExam()}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-lg text-white font-semibold py-3.5 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <span>✅</span> Submit Exam
                  </button>
                )}
              </div>
              <div className={`rounded-lg px-4 py-3 text-sm ${mutedPanelClass} ${secondaryTextClass}`}>
                {status}
              </div>
            </div>

            <div className={`rounded-lg shadow-md p-6 flex flex-col gap-4 ${cardClass}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-lg font-semibold ${headingTextClass}`}>Detection Results</h3>
                  <p className={`text-sm ${subtleTextClass}`}>Focus score</p>
                </div>
                <span
                  className={`text-2xl font-bold ${
                    currentScore >= 85
                      ? 'text-green-400'
                      : currentScore >= 70
                      ? 'text-yellow-400'
                      : currentScore >= 50
                      ? 'text-orange-400'
                      : 'text-red-400'
                  }`}
                >
                  {currentScore}%
                </span>
              </div>
              <div className={`rounded-full h-3 overflow-hidden ${isDark ? 'bg-slate-700/40' : 'bg-gray-200'}`}>
                <div
                  className={`h-full transition-all ${
                    currentScore >= 85
                      ? 'bg-green-500'
                      : currentScore >= 70
                      ? 'bg-yellow-500'
                      : currentScore >= 50
                      ? 'bg-orange-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${currentScore}%` }}
                />
              </div>
              <div className={`text-sm ${secondaryTextClass}`}>
                <p className={`font-semibold mb-1 ${headingTextClass}`}>Current state:</p>
                <p>{status}</p>
              </div>
              <div>
                <p className={`text-sm font-semibold mb-2 flex items-center gap-2 ${headingTextClass}`}>
                  <span>🚨</span> Live alerts
                </p>
                {alerts.length === 0 ? (
                  <div className={`rounded-lg px-4 py-3 text-sm text-center ${mutedPanelClass} ${subtleTextClass}`}>
                    No suspicious activity detected
                  </div>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {alerts.map((alert, index) => (
                      <li
                        key={index}
                        className={`rounded-lg px-4 py-2.5 flex items-center gap-2 ${
                          isDark
                            ? 'border border-red-500/30 bg-red-500/10 text-red-300'
                            : 'border border-red-200 bg-red-50 text-red-600'
                        }`}
                      >
                        <span>⚠️</span>
                        <span>{alert.replace(/_/g, ' ').toUpperCase()}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
