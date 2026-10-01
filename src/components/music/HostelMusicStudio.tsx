import React, { useState, useEffect, useRef } from 'react';
import {
  Music,
  Play,
  Pause,
  RotateCcw,
  Download,
  Trash2,
  Sparkles,
  Volume2,
  VolumeX,
  Radio,
  Clock,
  Tag,
  Headphones,
  Upload,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../services/api';

interface MusicTrack {
  id: string;
  title: string;
  genre: string;
  prompt: string;
  model: 'lyria-3-clip-preview' | 'lyria-3-pro-preview';
  durationSeconds: number;
  mimeType: string;
  audioBase64: string;
  lyrics?: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
}

const PRESET_PROMPTS = [
  {
    title: 'Late Night Exam Lofi',
    genre: 'Lofi / Study',
    prompt: 'Warm lo-fi hip hop beat with cozy vinyl crackle, gentle rain on hostel window, soft electric piano, 75 bpm for deep study focus',
    modelType: 'clip' as const,
  },
  {
    title: 'Dorm Sleep Ambience',
    genre: 'Ambient / Sleep',
    prompt: 'Peaceful ambient soundscape with warm synthesizer pads, soft wind chimes, relaxing night tranquility for deep sleep in dorm room',
    modelType: 'full' as const,
  },
  {
    title: 'Hostel Common Room Chill',
    genre: 'Acoustic / Chill',
    prompt: 'Gentle acoustic guitar with subtle shaker, mellow sunshine afternoon vibe, uplifting coffeehouse melody for hostel lounge',
    modelType: 'clip' as const,
  },
  {
    title: 'Morning Routine Energy',
    genre: 'Indie / Morning',
    prompt: 'Breezy optimistic indie pop rhythm with bright guitar riffs, cheerful groove to wake up energized for morning classes',
    modelType: 'clip' as const,
  },
  {
    title: 'Hostel Workout Hype',
    genre: 'Electronic / Gym',
    prompt: 'Pumping synthwave workout track with driving bassline, crisp drums, energetic 128 bpm motivation for hostel fitness session',
    modelType: 'full' as const,
  },
];

export const HostelMusicStudio: React.FC = () => {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [activeTrack, setActiveTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Form State
  const [prompt, setPrompt] = useState<string>('Warm lo-fi hip hop beat with cozy vinyl crackle, gentle rain on hostel window, soft electric piano');
  const [title, setTitle] = useState<string>('Exam Study Lofi');
  const [genre, setGenre] = useState<string>('Lofi / Study');
  const [modelType, setModelType] = useState<'clip' | 'full'>('clip');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentBlobUrlRef = useRef<string | null>(null);

  // Load existing tracks
  useEffect(() => {
    loadTracks();
  }, []);

  const loadTracks = async () => {
    try {
      const data = await api.getMusicTracks();
      setTracks(data);
      if (data.length > 0 && !activeTrack) {
        setActiveTrack(data[0]);
      }
    } catch (err) {
      console.warn('Could not load tracks:', err);
    }
  };

  // Setup audio element when activeTrack changes
  useEffect(() => {
    if (!activeTrack) return;

    if (currentBlobUrlRef.current) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
      currentBlobUrlRef.current = null;
    }

    try {
      const binary = atob(activeTrack.audioBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: activeTrack.mimeType || 'audio/wav' });
      const url = URL.createObjectURL(blob);
      currentBlobUrlRef.current = url;

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      audioRef.current.src = url;
      audioRef.current.volume = isMuted ? 0 : volume;

      audioRef.current.ontimeupdate = () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      };

      audioRef.current.onloadedmetadata = () => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration || activeTrack.durationSeconds);
        }
      };

      audioRef.current.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    } catch (err) {
      console.error('Audio initialization error:', err);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [activeTrack]);

  const togglePlayPause = () => {
    if (!audioRef.current || !activeTrack) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => {
        console.error('Playback error:', e);
        setIsPlaying(false);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    setIsMuted(vol === 0);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const handleDownload = (track: MusicTrack) => {
    try {
      const binary = atob(track.audioBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: track.mimeType || 'audio/wav' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${track.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this music track?')) return;
    try {
      await api.deleteMusicTrack(id);
      setTracks((prev) => prev.filter((t) => t.id !== id));
      if (activeTrack?.id === id) {
        if (audioRef.current) audioRef.current.pause();
        setActiveTrack(null);
        setIsPlaying(false);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to delete track');
    }
  };

  const handleApplyPreset = (preset: typeof PRESET_PROMPTS[0]) => {
    setPrompt(preset.prompt);
    setTitle(preset.title);
    setGenre(preset.genre);
    setModelType(preset.modelType);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setGenerating(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const newTrack = await api.generateMusic({
        prompt: prompt.trim(),
        modelType,
        title: title.trim() || undefined,
        genre,
        imageBase64: imagePreview || undefined,
      });

      setTracks((prev) => [newTrack, ...prev]);
      setActiveTrack(newTrack);
      setIsPlaying(true);
      setSuccessMsg(`"${newTrack.title}" generated successfully with ${newTrack.model}!`);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setError(err?.message || 'Music generation failed. Please try a different prompt.');
    } finally {
      setGenerating(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = Math.floor(sec % 60);
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-stone-900 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 text-xs font-semibold uppercase tracking-wider mb-3 border border-purple-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Music Generator with Google Lyria Models</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Hostel Music & Ambiance Studio
          </h1>
          <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
            Generate custom AI audio tracks for hostel life: late-night exam study lofi, dorm room relaxation, common area playlists, and morning hype. Powered by{' '}
            <span className="font-semibold text-purple-300">lyria-3-clip-preview</span> (up to 30s clips) and{' '}
            <span className="font-semibold text-indigo-300">lyria-3-pro-preview</span> (full-length tracks).
          </p>
        </div>

        <div className="absolute right-4 bottom-[-10px] opacity-10 pointer-events-none">
          <Music className="w-56 h-56 text-white" />
        </div>
      </div>

      {/* Interactive Global Audio Player (When a track is active) */}
      {activeTrack && (
        <div className="bg-stone-900 text-white rounded-xl shadow-lg border border-stone-800 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-600/30 text-purple-400 flex items-center justify-center border border-purple-500/40 shrink-0">
                <Music className="w-6 h-6 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-white truncate">{activeTrack.title}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {activeTrack.model}
                  </span>
                </div>
                <p className="text-xs text-stone-400 truncate mt-0.5">
                  <span className="text-purple-400 font-medium">{activeTrack.genre}</span> · Generated by {activeTrack.createdByName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownload(activeTrack)}
                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5 border border-stone-700"
                title="Download .wav audio file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download WAV</span>
              </button>
            </div>
          </div>

          {/* Player Controls & Scrubber */}
          <div className="space-y-2 pt-2 border-t border-stone-800/80">
            <div className="flex items-center gap-3">
              <span className="text-xs text-stone-400 font-mono w-10 text-right">
                {formatSeconds(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration || activeTrack.durationSeconds || 30}
                step="0.1"
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <span className="text-xs text-stone-400 font-mono w-10">
                {formatSeconds(duration || activeTrack.durationSeconds || 30)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlayPause}
                  className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center transition-transform hover:scale-105 shadow-md"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <button
                  onClick={() => {
                    if (audioRef.current) audioRef.current.currentTime = 0;
                  }}
                  className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
                  title="Restart track"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="text-stone-400 hover:text-white p-1">
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </div>

            {/* Prompt details */}
            <div className="text-xs text-stone-400 bg-stone-800/60 p-2.5 rounded-lg border border-stone-800 mt-2">
              <span className="font-semibold text-stone-300">Prompt: </span>
              "{activeTrack.prompt}"
              {activeTrack.lyrics && (
                <div className="mt-1 pt-1 border-t border-stone-700 text-stone-300 italic">
                  Lyrics/Notes: {activeTrack.lyrics}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Generator Form & Track Library */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Music Generation Creator */}
        <div className="lg:col-span-7 bg-white rounded-xl shadow-xs border border-stone-200 p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span>Compose New Track</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Specify the musical style, mood, tempo, and instruments for your hostel study or lounge track.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
              Hostel Presets
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors text-left"
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            {/* Model Selection */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Model Duration Target
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setModelType('clip')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    modelType === 'clip'
                      ? 'border-purple-600 bg-purple-50/70 text-purple-900 ring-2 ring-purple-600/20'
                      : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm">Short Clip (30s)</span>
                    <Clock className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-xs text-stone-500 font-mono">lyria-3-clip-preview</p>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Fast generation, ideal for loops and study background bites.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setModelType('full')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    modelType === 'full'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-600/20'
                      : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm">Full Track</span>
                    <Headphones className="w-4 h-4 text-indigo-600" />
                  </div>
                  <p className="text-xs text-stone-500 font-mono">lyria-3-pro-preview</p>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Extended full-length composition with evolving chords.
                  </p>
                </button>
              </div>
            </div>

            {/* Prompt */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Music Prompt Description
                </label>
                <span className="text-[11px] text-stone-400">{prompt.length} chars</span>
              </div>
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe instruments, tempo, mood, genre, and ambiance..."
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-colors"
                required
              />
            </div>

            {/* Track Title & Genre */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Track Name
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Room 304 Rainy Study"
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Genre / Mood Tag
                </label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                >
                  <option value="Lofi / Study">Lofi / Study</option>
                  <option value="Ambient / Sleep">Ambient / Sleep</option>
                  <option value="Acoustic / Chill">Acoustic / Chill</option>
                  <option value="Electronic / Gym">Electronic / Gym</option>
                  <option value="Classical Piano">Classical Piano</option>
                  <option value="Hostel Common Room">Hostel Common Room</option>
                </select>
              </div>
            </div>

            {/* Optional Image Inspiration (Image + Text) */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Visual Inspiration (Optional Image)
              </label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium border border-stone-300 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{imagePreview ? 'Change Photo' : 'Upload Image Inspiration'}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                {imagePreview && (
                  <div className="flex items-center gap-2">
                    <img src={imagePreview} alt="Preview" className="w-9 h-9 rounded object-cover border" />
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={generating}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Audio via {modelType === 'clip' ? 'Lyria Clip' : 'Lyria Pro'}...</span>
                </>
              ) : (
                <>
                  <Music className="w-4 h-4" />
                  <span>Generate Music with {modelType === 'clip' ? 'Lyria Clip (30s)' : 'Lyria Pro'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Hostel Track Library */}
        <div className="lg:col-span-5 bg-white rounded-xl shadow-xs border border-stone-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Radio className="w-5 h-5 text-purple-600" />
              <span>Hostel Library ({tracks.length})</span>
            </h2>
            <button onClick={loadTracks} className="text-xs font-semibold text-purple-600 hover:underline">
              Refresh
            </button>
          </div>

          {tracks.length === 0 ? (
            <div className="p-8 border border-dashed border-stone-200 rounded-xl text-center">
              <Headphones className="w-8 h-8 text-stone-400 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-stone-700">No tracks generated yet</p>
              <p className="text-xs text-stone-500 mt-1">
                Choose a preset or type a prompt on the left to generate the first track for the hostel.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {tracks.map((track) => {
                const isSelected = activeTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    onClick={() => {
                      setActiveTrack(track);
                      setIsPlaying(true);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/70 shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isSelected) {
                            togglePlayPause();
                          } else {
                            setActiveTrack(track);
                            setIsPlaying(true);
                          }
                        }}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isSelected && isPlaying
                            ? 'bg-purple-600 text-white'
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                        }`}
                      >
                        {isSelected && isPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <h4 className="font-semibold text-stone-900 text-sm truncate">{track.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                          <span className="text-purple-700 font-medium">{track.genre}</span>
                          <span>·</span>
                          <span className="font-mono text-[10px] text-stone-400">
                            {track.model.includes('pro') ? 'Pro' : '30s'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(track);
                        }}
                        className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
                        title="Download WAV"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(track.id, e)}
                        className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                        title="Delete track"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
