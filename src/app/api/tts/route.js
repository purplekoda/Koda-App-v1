import 'server-only';

import { getCurrentUser } from '@/lib/dal/auth';
import { apiLimiter } from '@/lib/rate-limit';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rate = apiLimiter.check(user.id);
    if (!rate.success) {
      return Response.json({ error: 'Too many requests' }, { status: 429 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'TTS not configured' }, { status: 503 });
    }

    const body = await request.json();
    const text = typeof body.text === 'string' ? body.text.trim().slice(0, 5000) : '';
    if (!text) {
      return Response.json({ error: 'Text is required' }, { status: 400 });
    }

    const voiceId = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!res.ok) {
      return Response.json({ error: 'TTS request failed' }, { status: 502 });
    }

    const audioBuffer = await res.arrayBuffer();
    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return Response.json({ error: 'Request failed' }, { status: 500 });
  }
}
