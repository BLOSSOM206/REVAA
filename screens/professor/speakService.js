import Tts from "react-native-tts";
import CryptoJS from "crypto-js";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../services/firebaseConfig";

const normalizeText = (text) => {
  return text
    .trim()
    .toLowerCase()
    .replace(/[.!?]+$/, "")
    .replace(/\s+/g, " ");
};

export const speakText = async (text, settings) => {
  const normalized = normalizeText(text);

  const cacheKey = CryptoJS.SHA256(
    normalized +
      settings.language +
      settings.voice +
      settings.speed
  ).toString();

  const cacheRef = doc(db, "ttsCache", cacheKey);
  const cacheSnap = await getDoc(cacheRef);

  if (cacheSnap.exists() && cacheSnap.data().status === "ready") {
    const audioUrl = cacheSnap.data().audioUrl;
    return playFromUrl(audioUrl);
  }

  // Fallback instantly with device TTS
  Tts.setDefaultLanguage(settings.language);
  Tts.setDefaultRate(settings.speed);
  Tts.speak(text);

  // Trigger cloud generation in background
  await fetch("https://your-cloud-function-url/generateTTS", {
    method: "POST",
    body: JSON.stringify({
      text,
      cacheKey,
      settings,
    }),
  });
};

const playFromUrl = async (url) => {
  // Use react-native-sound or expo-av
};
