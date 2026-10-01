import { Router } from 'express';
import { ai } from '../gemini.js';
import { authMiddleware, type AuthenticatedRequest } from '../auth.js';

const router = Router();

// Protect route so only authenticated users (residents and owners) can search
router.use(authMiddleware);

interface PlaceItem {
  id: string;
  title: string;
  uri: string;
  reviewSnippets: string[];
  address?: string;
  rating?: number;
}

router.post('/search', async (req: AuthenticatedRequest, res) => {
  try {
    const { query, category, location, latLng } = req.body;

    if (!query && !category) {
      return res.status(400).json({ error: 'Search query or category is required.' });
    }

    const searchTerm = query || category || 'essentials';
    const locString = location ? ` near ${location}` : '';

    const prompt = `As a local hostel neighborhood guide assistant, find and recommend the top places for "${searchTerm}"${locString} for hostel residents and students.
For each place:
1. Provide the exact name and specific location details.
2. Explain why it is convenient or recommended for hostel residents (e.g. pricing, walkability, late night hours, student discounts, atmosphere).
3. Mention key highlights or tips (e.g. Wi-Fi availability for study cafes, 24/7 service for pharmacies, bus/metro lines).
Format your response with clear markdown headings and bullet points.`;

    const config: any = {
      tools: [{ googleMaps: {} }],
    };

    if (latLng && typeof latLng.latitude === 'number' && typeof latLng.longitude === 'number') {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: latLng.latitude,
            longitude: latLng.longitude,
          },
        },
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config,
    });

    const candidate = response.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata;
    const rawChunks = groundingMetadata?.groundingChunks || [];

    const places: PlaceItem[] = [];
    const seenUris = new Set<string>();

    for (let i = 0; i < rawChunks.length; i++) {
      const chunk = rawChunks[i];
      if (chunk.maps) {
        const uri = chunk.maps.uri || '';
        const title = chunk.maps.title || `Location ${i + 1}`;
        if (uri && !seenUris.has(uri)) {
          seenUris.add(uri);
          const reviewSnippets: string[] = [];
          const sourceSnippets =
            chunk.maps.placeAnswerSources?.reviewSnippets ||
            chunk.maps.placeAnswerSources?.reviewSnippet;
          if (Array.isArray(sourceSnippets)) {
            for (const r of sourceSnippets) {
              const snippetText = r.review || r.title || (r as any).reviewText;
              if (snippetText) reviewSnippets.push(snippetText);
            }
          }

          places.push({
            id: `place-${i}-${Date.now()}`,
            title,
            uri,
            reviewSnippets,
            address:
              (chunk.maps as any).address ||
              (chunk.maps as any).formattedAddress ||
              chunk.maps.text ||
              undefined,
          });
        }
      }
    }

    res.json({
      text: response.text || 'No description returned.',
      places,
      groundingMetadata: {
        webSearchQueries: groundingMetadata?.webSearchQueries || [],
        searchEntryPoint: groundingMetadata?.searchEntryPoint,
      },
    });
  } catch (error: any) {
    console.error('Maps Grounding search failed:', error);
    let message = error?.message || 'Failed to fetch Google Maps data. Please check connection and try again.';
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

export default router;
