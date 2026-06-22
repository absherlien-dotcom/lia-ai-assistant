export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;

  if (!apiKey || !voiceId) {
    return res.status(500).json({
      ok: false,
      error: 'ElevenLabs environment variables are missing',
    });
  }

  try {
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
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
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
      return res.status(elevenResponse.status).json({
        ok: false,
        error: 'ElevenLabs TTS failed',
        details: errorText.slice(0, 500),
      });
    }

    const audioBuffer = Buffer.from(await elevenResponse.arrayBuffer());

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(audioBuffer);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: 'TTS server error',
      details: error.message,
    });
  }
}
