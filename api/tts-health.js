export default function handler(req, res) {
  try {
    const apiKey = String(process.env.ELEVENLABS_API_KEY || '').trim();
    const voiceId = String(process.env.ELEVENLABS_VOICE_ID || '').trim();

    return res.status(200).json({
      ok: true,
      hasApiKey: Boolean(apiKey),
      apiKeyLength: apiKey.length,
      hasVoiceId: Boolean(voiceId),
      voiceIdLength: voiceId.length,
      node: process.version,
    });
  } catch (error) {
    return res.status(200).json({
      ok: false,
      error: error.message,
    });
  }
}
