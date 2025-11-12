import React, { useState, useRef, useEffect } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  MessageSquare,
  Clock,
  User,
  MapPin,
  AlertTriangle,
  X,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import type { AlertWithStats } from '../types';

interface AICallModalProps {
  alert: AlertWithStats;
  onClose: () => void;
}

interface TranscriptMessage {
  speaker: 'AI' | 'User';
  text: string;
  timestamp: Date;
}

export default function AICallModal({ alert, onClose }: AICallModalProps) {
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'active' | 'ended'>('idle');
  const [sessionId, setSessionId] = useState<string>('');
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callSummary, setCallSummary] = useState('');
  const [error, setError] = useState('');
  
  const transcriptRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  // Call duration timer
  useEffect(() => {
    if (callStatus === 'active') {
      intervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [callStatus]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const initiateCall = async () => {
    try {
      setCallStatus('connecting');
      setError('');

      const response = await fetch('http://localhost:3000/api/ai-call/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          alertId: alert._id,
          reporterPhone: alert.contactInfo?.phone || 'Unknown',
          reporterName: alert.contactInfo?.name || 'Reporter',
          disasterType: alert.type,
          location: `${alert.geometry.coordinates[1]}, ${alert.geometry.coordinates[0]}`
        })
      });

      const data = await response.json();

      if (data.success) {
        setSessionId(data.sessionId);
        setCallStatus('active');
        setTranscript([{
          speaker: 'AI',
          text: data.aiGreeting,
          timestamp: new Date()
        }]);
        
        // Play AI greeting using text-to-speech
        await speakText(data.aiGreeting);
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate call');
      setCallStatus('idle');
    }
  };

  const sendMessage = async () => {
    if (!userInput.trim() || callStatus !== 'active') return;

    try {
      const userMessage = userInput.trim();
      setUserInput('');

      // Add user message to transcript immediately
      setTranscript(prev => [...prev, {
        speaker: 'User',
        text: userMessage,
        timestamp: new Date()
      }]);

      const response = await fetch('http://localhost:3000/api/ai-call/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          sessionId,
          userInput: userMessage
        })
      });

      const data = await response.json();

      if (data.success) {
        setTranscript(prev => [...prev, {
          speaker: 'AI',
          text: data.aiResponse,
          timestamp: new Date()
        }]);
        
        // Play AI response
        await speakText(data.aiResponse);
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    }
  };

  const speakText = async (text: string) => {
    if (isMuted) return;

    try {
      setIsSpeaking(true);
      
      const response = await fetch('http://localhost:3000/api/ai-call/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ text })
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.pause();
        }
        
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        await audio.play();
      }
    } catch (err) {
      console.error('TTS Error:', err);
      setIsSpeaking(false);
    }
  };

  const endCall = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/ai-call/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ sessionId })
      });

      const data = await response.json();

      if (data.success) {
        setCallSummary(data.summary);
        setCallStatus('ended');
        
        if (audioRef.current) {
          audioRef.current.pause();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to end call');
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-violet-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-full ${
                callStatus === 'active' ? 'bg-green-500 animate-pulse' : 
                callStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                'bg-gray-500'
              }`}>
                <Phone className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">AI Emergency Call</h2>
                <p className="text-pink-100 text-sm flex items-center gap-2">
                  {callStatus === 'idle' && 'Ready to connect'}
                  {callStatus === 'connecting' && 'Connecting...'}
                  {callStatus === 'active' && (
                    <>
                      <Clock className="h-4 w-4" />
                      {formatDuration(callDuration)}
                    </>
                  )}
                  {callStatus === 'ended' && 'Call Ended'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Alert Info */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 border-b border-purple-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-purple-600" />
              <span className="text-gray-600">Type:</span>
              <span className="font-bold text-purple-900">{alert.type}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-purple-600" />
              <span className="text-gray-600">Reporter:</span>
              <span className="font-bold text-purple-900">{alert.contactInfo?.name || 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <MapPin className="h-4 w-4 text-purple-600" />
              <span className="text-gray-600">Location:</span>
              <span className="font-bold text-purple-900">{alert.location}</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-4" style={{ maxHeight: 'calc(90vh - 300px)', overflowY: 'auto' }}>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {callStatus === 'idle' && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4">
                <Phone className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Start AI Call</h3>
              <p className="text-gray-600 mb-6">
                Initiate an AI-powered call to gather more information about this disaster
              </p>
              <button
                onClick={initiateCall}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 font-bold shadow-lg"
              >
                Start Call
              </button>
            </div>
          )}

          {(callStatus === 'active' || callStatus === 'connecting') && (
            <>
              {/* Transcript */}
              <div 
                ref={transcriptRef}
                className="bg-gray-50 rounded-xl p-4 space-y-3 max-h-80 overflow-y-auto border border-gray-200"
              >
                <div className="flex items-center gap-2 text-sm text-gray-600 pb-2 border-b">
                  <MessageSquare className="h-4 w-4" />
                  <span>Call Transcript</span>
                </div>
                {transcript.map((msg, idx) => (
                  <div 
                    key={idx}
                    className={`flex ${msg.speaker === 'AI' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[80%] rounded-2xl p-3 ${
                      msg.speaker === 'AI' 
                        ? 'bg-gradient-to-br from-purple-100 to-pink-100 text-purple-900' 
                        : 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold">
                          {msg.speaker === 'AI' ? '🤖 AI Assistant' : '👤 Admin'}
                        </span>
                        <span className="text-xs opacity-70">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  </div>
                ))}
                {isSpeaking && (
                  <div className="flex justify-start">
                    <div className="bg-purple-100 rounded-2xl p-3">
                      <div className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4 text-purple-600 animate-pulse" />
                        <span className="text-sm text-purple-900">AI is speaking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type your response..."
                  className="flex-1 px-4 py-3 border-2 border-purple-200 rounded-full focus:border-purple-500 focus:outline-none"
                  disabled={callStatus !== 'active' || isSpeaking}
                />
                <button
                  onClick={sendMessage}
                  disabled={!userInput.trim() || callStatus !== 'active' || isSpeaking}
                  className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <MessageSquare className="h-5 w-5" />
                </button>
              </div>
            </>
          )}

          {callStatus === 'ended' && callSummary && (
            <div className="space-y-4">
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <h3 className="font-bold text-green-900 mb-2">✅ Call Completed</h3>
                <p className="text-sm text-gray-600">Duration: {formatDuration(callDuration)}</p>
              </div>

              <div className="bg-white border-2 border-purple-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Call Summary</h3>
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                  {callSummary}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 max-h-60 overflow-y-auto">
                <h4 className="font-bold text-gray-900 mb-3">Full Transcript</h4>
                <div className="space-y-2">
                  {transcript.map((msg, idx) => (
                    <div key={idx} className="text-sm">
                      <span className={`font-bold ${
                        msg.speaker === 'AI' ? 'text-purple-600' : 'text-blue-600'
                      }`}>
                        {msg.speaker}:
                      </span>
                      <span className="text-gray-700 ml-2">{msg.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 border-t border-purple-200">
          <div className="flex items-center justify-center gap-4">
            {callStatus === 'active' && (
              <>
                <button
                  onClick={toggleMute}
                  className={`p-4 rounded-full transition-all transform hover:scale-110 ${
                    isMuted 
                      ? 'bg-red-500 text-white' 
                      : 'bg-white text-purple-600 border-2 border-purple-300'
                  }`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                </button>

                <button
                  onClick={endCall}
                  className="px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full hover:from-red-600 hover:to-red-700 transition-all transform hover:scale-105 font-bold shadow-lg flex items-center gap-2"
                >
                  <PhoneOff className="h-5 w-5" />
                  End Call
                </button>
              </>
            )}

            {callStatus === 'ended' && (
              <button
                onClick={onClose}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 font-bold"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
