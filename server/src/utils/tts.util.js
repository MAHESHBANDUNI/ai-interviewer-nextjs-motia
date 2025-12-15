import { SarvamAIClient } from "sarvamai";
import { ApiError } from "./apiError.util";

export const getTTSAudio = async (text) => {
  try {
    if (!text) {
      throw new ApiError("Missing text", 400);
    }

    const client = new SarvamAIClient({
      apiSubscriptionKey: process.env.SARVAM_API_KEY
    });

    const response = await client.textToSpeech.convert({
      text,
      target_language_code: "en-IN",
      speaker: "hitesh",
      pitch: 0,
      pace: 1,
      loudness: 1,
      speech_sample_rate: 22050,
      enable_preprocessing: true,
      model: "bulbul:v2"
    });

    if (!response?.audios?.length) {
      throw new ApiError("No audio returned", 500);
    }

    const audioBase64 = response.audios[0];
    const audioBuffer = Buffer.from(audioBase64, "base64");

    return {
        audioBuffer,
        contentType: 'audio/wav',
        contentDisposition: 'inline; filename="sarvam_output.wav"'
    }

  } catch (error) {
    throw new ApiError('Failed to generate TTS audio', 500);
  }
}

// import { GoogleGenAI } from "@google/genai";
// import wav from "wav";
// import { PassThrough } from "stream";
// import { ApiError } from "./apiError.util";

// /**
//  * Converts raw PCM data into a valid WAV file stream.
//  */
// function pcmToWav(pcmBuffer, channels = 1, sampleRate = 24000, bitDepth = 16) {
//   const writer = new wav.Writer({
//     channels,
//     sampleRate,
//     bitDepth,
//   });

//   const stream = new PassThrough();
//   writer.pipe(stream);
//   writer.write(pcmBuffer);
//   writer.end();

//   return stream;
// }

// export const getTTSAudio = async (text) => {
//   try {
//     if (!text) {
//       throw new ApiError("Missing text", 400);
//     }

//     const ai = new GoogleGenAI({
//       apiKey: process.env.GEMINI_API_KEY1,
//     });

//     // 🧠 Call Gemini TTS model
//     const response = await ai.models.generateContent({
//       model: "gemini-2.5-flash-preview-tts",
//       contents: [{ parts: [{ text }] }],
//       config: {
//         responseModalities: ["AUDIO"],
//         speechConfig: {
//           voiceConfig: {
//             prebuiltVoiceConfig: { voiceName: voice || "Charon" },
//           },
//         },
//       },
//     });

//     const inlineData = response?.candidates?.[0]?.content?.parts?.[0]?.inlineData;

//     if (!inlineData?.data) {
//       throw new ApiError("No audio data returned", 500);
//     }

//     const audioBuffer = Buffer.from(inlineData.data, "base64");

//     // 🧩 Convert PCM → playable WAV stream
//     const wavStream = pcmToWav(audioBuffer);

//     // ✅ Send back a real WAV file
//     return {
//         audioBuffer: wavStream,
//         contentType: 'audio/wav',
//         contentDisposition: 'inline; filename="sarvam_output.wav"'
//     }

//   } catch (error) {
//     throw new ApiError('Failed to generate TTS audio', 500);
//   }
// }

// import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
// import { ApiError } from "./apiError.util";

// export const getTTSAudio = async (text, voice) => {
//   try {
//     if (!text) {
//       throw new ApiError("Missing text", 400);
//     }

//     const client = new ElevenLabsClient({
//       apiKey: process.env.ELEVENLABS_API_KEY,
//     });

//     const voiceId = voice || "JBFqnCBsd6RMkjVDRZzb"; // fallback

//     const audio = await client.textToSpeech.convert(
//       voiceId,
//       {
//         text,
//         modelId: "eleven_multilingual_v2",
//         outputFormat: "mp3_44100_128",
//       }
//     );

//     return {
//         audioBuffer: audio,
//         contentType: 'audio/wav',
//         contentDisposition: 'inline; filename="sarvam_output.wav"'
//     }

//   } catch (error) {
//     throw new ApiError('Failed to generate TTS audio', 500);
//   }
// };
