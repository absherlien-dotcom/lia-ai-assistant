export default async function handler(req, res) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;

  if (!apiKey || !voiceId) {
    return res.status(500).json({
      ok: false,
      hasApiKey: Boolean(apiKey),
      hasVoiceId: Boolean(voiceId),
      error: 'Missing ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID',
    });
  }

  try {
    const text = 'مرحباً يا هشام، أنا ليا. هذا اختبار مباشر لصوتي الحقيقي من ElevenLabs.';
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
      return res.status(elevenResponse.status).json({
        ok: false,
        error: 'ElevenLabs request failed',
        status: elevenResponse.status,
        details: details.slice(0, 1000),
      });
    }

    const audioBuffer = Buffer.from(await elevenResponse.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Disposition', 'inline; filename="lia-tts-test.mp3"');
    return res.status(200).send(audioBuffer);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: 'TTS test server error',
      details: error.message,
    });
  }
}
