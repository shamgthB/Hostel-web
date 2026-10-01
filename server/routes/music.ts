import { Router } from 'express';
import crypto from 'crypto';
import { ai } from '../gemini.js';
import { authMiddleware, type AuthenticatedRequest } from '../auth.js';
import { db } from '../db.js';

const router = Router();

router.use(authMiddleware);

export interface MusicTrack {
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

// In-memory persistent hostel music library (seeded with sample tracks if desired)
const hostelTracks: MusicTrack[] = [];

router.get('/tracks', (req: AuthenticatedRequest, res) => {
  // Return recent tracks, newest first
  res.json(hostelTracks.slice().reverse());
});

router.post('/generate', async (req: AuthenticatedRequest, res) => {
  try {
    const { prompt, modelType = 'clip', title, genre = 'Lofi / Study', imageBase64, imageMimeType } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required for music generation.' });
    }

    const selectedModel = modelType === 'full' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview';
    const estimatedDuration = modelType === 'full' ? 120 : 30;

    let contentsPayload: any = prompt.trim();
    if (imageBase64) {
      contentsPayload = {
        parts: [
          { text: prompt.trim() },
          {
            inlineData: {
              data: imageBase64.replace(/^data:[^;]+;base64,/, ''),
              mimeType: imageMimeType || 'image/jpeg',
            },
          },
        ],
      };
    }

    const responseStream = await ai.models.generateContentStream({
      model: selectedModel,
      contents: contentsPayload,
    });

    let audioBase64 = '';
    let lyrics = '';
    let mimeType = 'audio/wav';

    for await (const chunk of responseStream) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;
      for (const part of parts) {
        if (part.inlineData?.data) {
          if (!audioBase64 && part.inlineData.mimeType) {
            mimeType = part.inlineData.mimeType;
          }
          audioBase64 += part.inlineData.data;
        }
        if (part.text && !lyrics) {
          lyrics = part.text;
        }
      }
    }

    if (!audioBase64) {
      return res.status(502).json({
        error: 'No audio stream was received from the Lyria music model. Please try a different prompt.',
      });
    }

    const user = db.findUserById(req.user!.userId);
    const creatorName = user?.username || 'Hostel Member';

    const trackId = `track-${crypto.randomUUID()}`;
    const generatedTitle =
      title && title.trim()
        ? title.trim()
        : `${genre} - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newTrack: MusicTrack = {
      id: trackId,
      title: generatedTitle,
      genre,
      prompt: prompt.trim(),
      model: selectedModel,
      durationSeconds: estimatedDuration,
      mimeType,
      audioBase64,
      lyrics: lyrics || undefined,
      createdById: req.user!.userId,
      createdByName: creatorName,
      createdAt: new Date().toISOString(),
    };

    // Store in hostel tracks (keep up to 50 tracks)
    hostelTracks.push(newTrack);
    if (hostelTracks.length > 50) {
      hostelTracks.shift();
    }

    res.status(201).json(newTrack);
  } catch (error: any) {
    console.error('Music generation failed:', error);
    let message = error?.message || 'Music generation failed. Please try again.';
    try {
      const parsed = JSON.parse(message);
      if (parsed?.error?.message) {
        message = parsed.error.message;
      }
    } catch {
      // Keep original message
    }
    res.status(500).json({ error: message });
  }
});

router.delete('/tracks/:id', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const index = hostelTracks.findIndex((t) => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Track not found.' });
  }

  const track = hostelTracks[index];
  // Allow owner or creator to delete
  if (req.user!.role !== 'owner' && track.createdById !== req.user!.userId) {
    return res.status(403).json({ error: 'You do not have permission to delete this track.' });
  }

  hostelTracks.splice(index, 1);
  res.json({ message: 'Track deleted successfully.' });
});

export default router;
