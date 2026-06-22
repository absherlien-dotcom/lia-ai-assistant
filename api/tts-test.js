export default async function handler(req, res) {
  try {
    const apiKey = String(process.env.ELEVENLABS_API_KEY || '').trim();
    const voiceId = String(process.env.ELEVENLABS_VOICE_ID || '').trim();

    res.setHeader('Cache-Control', 'no-store');

    if (req.query?.mode === 'env') {
      return res.status(200).json({
        ok: true,
        hasApiKey: Boolean(apiKey),
        apiKeyLength: apiKey.length,
        hasVoiceId: Boolean(voiceId),
        voiceIdLength: voiceId.length,
        node: process.version,
      });
    }

    if (!apiKey || !voiceId) {
      return res.status(500).json({
        ok: false,
        hasApiKey: Boolean(apiKey),
        hasVoiceId: Boolean(voiceId),
        error: 'Missing ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID',
      });
    }

    const text = 'مرحباً يا هشام، أنا ليا. هذا اختبار مباشر لصوتي الحقيقي من ElevenLabs.';
    const elevenResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
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
      const details = await elevenResponse.text().catch(() => '');
      return res.status(200).json({
        ok: false,
        error: 'ElevenLabs request failed',
        elevenStatus: elevenResponse.status,
        hasApiKey: true,
        hasVoiceId: true,
        details: details.slice(0, 1500),
      });
    }

    const audioArrayBuffer = await elevenResponse.arrayBuffer();
    const audioBuffer = Buffer.from(audioArrayBuffer);

    res.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'Content-Length': String(audioBuffer.length),
      'Cache-Control': 'no-store',
      'Content-Disposition': 'inline; filename="lia-tts-test.mp3"',
    });
    return res.end(audioBuffer);
  } catch (error) {
    console.error('TTS_TEST_CRASH', error);
    return res.status(200).json({
      ok: false,
      error: 'TTS test crashed safely',
      name: error?.name || 'Error',
      message: error?.message || String(error),
      stack: String(error?.stack || '').slice(0, 1000),
    });
  }
}
