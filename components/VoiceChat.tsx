import React, { useState, useEffect } from 'react';
import {
    LiveKitRoom,
    VideoConference,
    ControlBar,
    RoomAudioRenderer,
    useTracks,
    AudioConference,
    TrackLoop,
    ParticipantAudioTile,
    useParticipantContext,
    useParticipantInfo,
    useConnectionState,
    LayoutContextProvider,
    DisconnectButton,
    TrackToggle,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';
import { Mic, MicOff, Phone, PhoneOff, Users, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../constants';
import { useAuth } from '../contexts/authContext';

interface VoiceChatProps {
    teamId: string;
    className?: string;
}

export const VoiceChat: React.FC<VoiceChatProps> = ({ teamId, className }) => {
    const { token } = useAuth();
    const [lkToken, setLkToken] = useState<string | null>(null);
    const [roomName, setRoomName] = useState<string | null>(null);
    const [serverUrl, setServerUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isJoining, setIsJoining] = useState(false);
    const [isActive, setIsActive] = useState(false);

    const fetchToken = async () => {
        if (!token) return;
        setIsJoining(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/teams/${teamId}/livekit-token`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to get voice token');
            const data = await res.json();
            setLkToken(data.token);
            setRoomName(data.room_name);
            setServerUrl(data.url);
            setIsActive(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsJoining(false);
        }
    };

    if (!isActive) {
        return (
            <div className={`bg-slate-800/40 border border-slate-700/50 p-6 rounded-xl text-center ${className}`}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-primary/10 flex items-center justify-center rounded-full border border-primary/20">
                        <Mic className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white uppercase tracking-wider">Kênh voice đàm thoại</h3>
                        <p className="text-slate-400 text-sm mt-1">Chat voice cùng đồng đội để leo rank hiệu quả hơn</p>
                    </div>
                    <button
                        onClick={fetchToken}
                        disabled={isJoining}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50 group"
                    >
                        {isJoining ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Phone className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        )}
                        <span>{isJoining ? 'Đang kết nối...' : 'Vào kênh Voice'}</span>
                    </button>
                    {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-slate-900 border border-primary/30 rounded-xl overflow-hidden flex flex-col shadow-2xl ${className}`}>
            <LiveKitRoom
                video={false}
                audio={true}
                token={lkToken || ''}
                serverUrl={serverUrl || ''}
                onDisconnected={() => setIsActive(false)}
                className="flex flex-col h-full"
            >
                <LayoutContextProvider>
                    <div className="bg-slate-800/90 backdrop-blur-md p-3 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative flex items-center justify-center">
                                <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
                                <div className="w-2.5 h-2.5 bg-green-500 rounded-full relative z-10 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                            </div>
                            <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">Đang đàm thoại</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] text-slate-500 font-mono bg-slate-900/50 px-2 py-0.5 rounded border border-white/5">
                                HQ AUDIO
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 p-4 md:p-8 flex flex-col items-center justify-center min-h-[180px] bg-gradient-to-b from-slate-900 to-slate-950">
                        <VoiceParticipants teamId={teamId} />
                    </div>

                    <div className="bg-slate-900/80 backdrop-blur-md p-4 flex items-center justify-center gap-6 border-t border-white/5 relative z-20">
                        <div className="flex items-center gap-4 lk-control-bar">
                            <TrackToggle source={Track.Source.Microphone} className="lk-button !bg-slate-800 hover:!bg-slate-700 !border-slate-700 !rounded-xl !p-3 transition-all" />
                            <DisconnectButton className="lk-button !bg-red-900/30 hover:!bg-red-800/40 !text-red-400 !border-red-900/40 !rounded-xl !p-3 transition-all flex items-center gap-2">
                                <PhoneOff className="w-5 h-5" />
                                <span className="text-sm font-bold uppercase tracking-wider hidden sm:inline">Rời kênh</span>
                            </DisconnectButton>
                        </div>
                    </div>
                    <RoomAudioRenderer />
                </LayoutContextProvider>
            </LiveKitRoom>
        </div>
    );
};

const VoiceParticipants: React.FC<{ teamId: string }> = ({ teamId }) => {
    const tracks = useTracks([Track.Source.Microphone]);

    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6 w-full max-w-4xl mx-auto">
            {tracks.map((trackReference) => (
                <div
                    key={trackReference.participant.identity}
                    className="flex flex-col items-center gap-3 transition-all duration-300"
                >
                    <div className="relative group">
                        <div className={`w-20 h-20 rounded-full p-1 transition-all duration-500 flex items-center justify-center ${trackReference.participant.isSpeaking
                                ? 'bg-gradient-to-tr from-primary to-blue-500 animate-pulse-slow shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)]'
                                : 'bg-slate-800 border border-white/10'
                            }`}>
                            <div className="w-full h-full rounded-full overflow-hidden border-2 border-slate-900 bg-slate-800 relative">
                                <img
                                    src={trackReference.participant.metadata ? JSON.parse(trackReference.participant.metadata).avatar_url : 'https://via.placeholder.com/80'}
                                    alt={trackReference.participant.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                {trackReference.participant.isSpeaking && (
                                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                        <div className="flex gap-0.5 items-end h-4">
                                            <div className="w-1 bg-white rounded-full animate-music-bar-1" />
                                            <div className="w-1 bg-white rounded-full animate-music-bar-2" />
                                            <div className="w-1 bg-white rounded-full animate-music-bar-3" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="absolute -bottom-1 -right-1 z-20 flex gap-1">
                            {!trackReference.participant.isMicrophoneEnabled ? (
                                <div className="bg-red-500 p-1.5 rounded-full border-2 border-slate-900 shadow-lg">
                                    <MicOff className="w-3 h-3 text-white" />
                                </div>
                            ) : trackReference.participant.isSpeaking ? (
                                <div className="bg-primary p-1.5 rounded-full border-2 border-slate-900 shadow-lg animate-bounce-short">
                                    <Mic className="w-3 h-3 text-white" />
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div className="flex flex-col items-center min-w-0 w-full">
                        <span className={`text-xs font-bold truncate w-full text-center transition-colors ${trackReference.participant.isSpeaking ? 'text-primary' : 'text-slate-400'}`}>
                            {trackReference.participant.name || 'Anonymous'}
                        </span>
                        {trackReference.participant.metadata && (
                            <span className="text-[9px] text-slate-600 font-mono uppercase tracking-tighter">
                                {JSON.parse(trackReference.participant.metadata).rank || ''}
                            </span>
                        )}
                    </div>
                </div>
            ))}
            {tracks.length === 0 && (
                <div className="col-span-full flex flex-col items-center text-slate-500 py-12">
                    <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 border border-white/5 animate-pulse">
                        <Users className="w-8 h-8 opacity-20" />
                    </div>
                    <p className="text-sm font-medium opacity-50 tracking-wide uppercase">Đang chờ thành viên khác...</p>
                </div>
            )}
        </div>
    );
};
