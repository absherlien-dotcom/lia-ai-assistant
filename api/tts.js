export default async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      return res.status(204).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    const apiKey = String(process.env.ELEVENLABS_API_KEY || '').trim();
    const voiceId = String(process.env.ELEVENLABS_VOICE_ID || '').trim();

    if (!apiKey || !voiceId) {
      return res.status(500).json({
        ok: false,
        error: 'ElevenLabs env vars are missing',
        hasApiKey: Boolean(apiKey),
        hasVoiceId: Boolean(voiceId),
      });
    }

    const { text } = req.body || {};
    const cleanText = String(text || '')
      .replace(/[*#`_]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 1200);

    if (!cleanText) {
      return res.status(400).json({ ok: false, error: 'Text is required' });
    }

    const elevenResponse = await fetch(
      'https://api.elevenlabs.io/v1/text-to-speech/' + encodeURIComponent(voiceId),
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.78,
            style: 0.18,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!elevenResponse.ok) {
      const errorText = await elevenResponse.text().catch(() => '');
      return res.status(502).json({
        ok: false,
        error: 'ElevenLabs TTS failed',
        elevenStatus: elevenResponse.status,
        details: errorText.slice(0, 1500),
      });
    }

    const audioBuffer = Buffer.from(await elevenResponse.arrayBuffer());
    res.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'Content-Length': String(audioBuffer.length),
      'Cache-Control': 'no-store',
    });
    return res.end(audioBuffer);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: 'TTS server error',
      name: error?.name || 'Error',
      details: error?.message || String(error),
    });
  }
}
