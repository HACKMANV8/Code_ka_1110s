'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface LiveVideoViewerProps {
  student: {
    studentId: string;
    sessionId: string;
    studentName: string;
  };
  roomId: string;
  onClose: () => void;
}

export default function LiveVideoViewer({ student, roomId, onClose }: LiveVideoViewerProps) {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastOfferSdpRef = useRef<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    startViewing();
    fetchSnapshots();
    
    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const cleanup = () => {
    if (channelRef.current) {
      channelRef.current.unsubscribe().catch(() => undefined);
      channelRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.ontrack = null;
      peerRef.current.onicecandidate = null;
      peerRef.current.onconnectionstatechange = null;
      peerRef.current.close();
      peerRef.current = null;
    }
    lastOfferSdpRef.current = null;
  };

  const startViewing = async () => {
    try {
      const peer = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      peerRef.current = peer;

      peer.ontrack = (event) => {
        const [stream] = event.streams;
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => undefined);
          setStatus('connected');
        }
      };

      peer.onicecandidate = async (event) => {
        if (event.candidate && channelRef.current) {
          await channelRef.current.send({
            type: 'broadcast',
            event: 'viewer-candidate',
            payload: { candidate: event.candidate.toJSON() },
          });
        }
      };

      peer.onconnectionstatechange = () => {
        if (!peerRef.current) return;
        if (['disconnected', 'failed', 'closed'].includes(peerRef.current.connectionState)) {
          setStatus('error');
        }
      };

      const channel = supabase.channel(`webrtc:${roomId}`, {
        config: { broadcast: { ack: true } },
      });
      channelRef.current = channel;

      channel.on('broadcast', { event: 'offer' }, async ({ payload }) => {
        const peerConnection = peerRef.current;
        if (!peerConnection || !payload?.sdp) return;

        if (payload.sdp === lastOfferSdpRef.current) {
          return;
        }

        try {
          const offer = new RTCSessionDescription({ type: 'offer', sdp: payload.sdp });
          await peerConnection.setRemoteDescription(offer);
          lastOfferSdpRef.current = payload.sdp;

          if (peerConnection.signalingState !== 'have-remote-offer') {
            console.warn(`Skipping answer because signaling state is ${peerConnection.signalingState}`);
            return;
          }

          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          await channel.send({
            type: 'broadcast',
            event: 'answer',
            payload: { sdp: answer.sdp },
          });
        } catch (error) {
          console.error('Failed to handle offer', error);
        }
      });

      channel.on('broadcast', { event: 'streamer-candidate' }, async ({ payload }) => {
        if (!peerRef.current || !payload?.candidate) return;
        await peerRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
      });

      await channel.subscribe();

      // Signal that viewer is ready
      await channel.send({
        type: 'broadcast',
        event: 'viewer-ready',
        payload: {},
      });

    } catch (error) {
      console.error('Failed to start viewing:', error);
      setStatus('error');
    }
  };

  const fetchSnapshots = async () => {
    console.log('Fetching snapshots for session:', student.sessionId)
    const { data, error } = await supabase
      .from('suspicious_snapshots')
      .select('*')
      .eq('session_id', student.sessionId)
      .order('captured_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching snapshots:', error)
    }

    if (data) {
      console.log('Fetched snapshots:', data)
      setSnapshots(data);
    }
  };

  // Auto-refresh snapshots every 5 seconds
  useEffect(() => {
    if (!student.sessionId) return;

    const interval = setInterval(() => {
      fetchSnapshots();
    }, 5000);

    return () => clearInterval(interval);
  }, [student.sessionId]);

  const viewSnapshot = async (storagePath: string) => {
    const { data } = await supabase.storage
      .from('exam-snapshots')
      .createSignedUrl(storagePath, 3600); // 1 hour

    if (data) {
      window.open(data.signedUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Live Monitoring</h2>
            <p className="text-indigo-100 text-sm">{student.studentName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Video */}
            <div className="lg:col-span-2">
              <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video relative">
                {status === 'connecting' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                      <p>Connecting to student&apos;s camera...</p>
                    </div>
                  </div>
                )}
                
                {status === 'error' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-red-400 text-center">
                      <p className="text-xl mb-2">⚠️ Connection Failed</p>
                      <p className="text-sm">Student&apos;s camera may be offline</p>
                    </div>
                  </div>
                )}

                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Status */}
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  status === 'connected' ? 'bg-green-500 animate-pulse' :
                  status === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                  'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {status === 'connected' ? '🔴 Live' :
                   status === 'connecting' ? 'Connecting...' :
                   'Disconnected'}
                </span>
              </div>
            </div>

            {/* Suspicious Snapshots */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                📸 Suspicious Snapshots ({snapshots.length})
              </h3>
              
              {snapshots.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No suspicious activity detected</p>
                  <p className="text-sm mt-2">✅ Clean exam so far</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {snapshots.map((snapshot) => (
                    <div
                      key={snapshot.id}
                      className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                      onClick={() => viewSnapshot(snapshot.storage_path)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Captured at
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {new Date(snapshot.captured_at).toLocaleString()}
                          </p>
                        </div>
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={fetchSnapshots}
                className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition text-sm"
              >
                🔄 Refresh Snapshots
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
