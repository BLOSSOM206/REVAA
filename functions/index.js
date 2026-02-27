const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {onRequest} = require("firebase-functions/v2/https");
const {setGlobalOptions, logger} = require("firebase-functions/v2");
const admin = require("firebase-admin");
const crypto = require("crypto");
const textToSpeech = require("@google-cloud/text-to-speech");
const speech = require("@google-cloud/speech");
const {YoutubeTranscript} = require("youtube-transcript");

admin.initializeApp();
setGlobalOptions({region: "asia-south1"});

const db = admin.firestore();
const ttsClient = new textToSpeech.TextToSpeechClient();
const speechClient = new speech.SpeechClient();

const DEFAULT_LANGUAGE = "en-IN";
const DEFAULT_VOICE_NAME = "en-IN-Standard-A";
const DEFAULT_SPEED = 1.0;
const DEFAULT_STORAGE_BUCKET = "revaa-11823.firebasestorage.app";

const PROCESS_STAGE = {
  QUEUED: "queued",
  INGESTING: "ingesting",
  TRANSCRIBING: "transcribing",
  PACKAGING: "packaging",
  COMPLETED: "completed",
  FAILED: "failed",
};

const YOUTUBE_HOSTS = [
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
];

const normalizeText = (value = "") => value
    .trim()
    .toLowerCase()
    .replace(/[.!?]+$/, "")
    .replace(/\s+/g, " ");

const buildTtsHash = ({
  normalizedText,
  languageCode,
  voice,
  speakingRate,
}) => {
  const hashPayload = JSON.stringify({
    normalizedText,
    languageCode,
    voice,
    speakingRate,
  });

  return crypto.createHash("sha256").update(hashPayload).digest("hex");
};

const resolveStorageBucketName = () => {
  const envBucket =
    process.env.STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET;
  if (envBucket) {
    return envBucket;
  }

  const firebaseConfigRaw = process.env.FIREBASE_CONFIG;
  if (firebaseConfigRaw) {
    try {
      const parsedConfig = JSON.parse(firebaseConfigRaw);
      if (parsedConfig && parsedConfig.storageBucket) {
        return parsedConfig.storageBucket;
      }
    } catch (error) {
      logger.warn("Failed to parse FIREBASE_CONFIG for storage bucket", {
        message: error.message,
      });
    }
  }

  return DEFAULT_STORAGE_BUCKET;
};

const bucket = admin.storage().bucket(resolveStorageBucketName());

const stageToStatus = (stage) => {
  if (stage === PROCESS_STAGE.COMPLETED) {
    return "completed";
  }
  if (stage === PROCESS_STAGE.FAILED) {
    return "failed";
  }
  return "processing";
};

const durationToMs = (duration = {}) => {
  const seconds = Number(duration.seconds || 0);
  const nanos = Number(duration.nanos || 0);
  const total = (seconds * 1000) + (nanos / 1e6);
  return Number.isFinite(total) && total >= 0 ? Math.round(total) : 0;
};

const toMilliseconds = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return 0;
  }
  if (numeric > 1000) {
    return Math.round(numeric);
  }
  return Math.round(numeric * 1000);
};

const extractYouTubeVideoId = (urlValue = "") => {
  const raw = String(urlValue || "").trim();
  if (!raw) {
    return null;
  }

  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.toLowerCase();
    if (!YOUTUBE_HOSTS.includes(host)) {
      return null;
    }

    if (host.includes("youtu.be")) {
      const shortId = parsed.pathname.replace("/", "").trim();
      return shortId || null;
    }

    const watchId = parsed.searchParams.get("v");
    if (watchId) {
      return watchId.trim();
    }

    const pathParts = parsed.pathname.split("/").filter(Boolean);
    const embedIndex = pathParts.findIndex((part) => part === "embed");
    if (embedIndex !== -1 && pathParts[embedIndex + 1]) {
      return pathParts[embedIndex + 1].trim();
    }
  } catch (error) {
    const fallbackMatch =
      raw.match(/(?:v=|\/embed\/|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/);
    if (fallbackMatch && fallbackMatch[1]) {
      return fallbackMatch[1];
    }
  }

  return null;
};

const buildYouTubeWatchUrl = (videoId) =>
  `https://www.youtube.com/watch?v=${videoId}`;

const inferSourceType = (contentData = {}) => {
  const declaredType = (contentData.type || "").toLowerCase();
  const mimeType = (contentData.mimeType || "").toLowerCase();
  const youtubeUrl =
    contentData.youtubeUrl ||
    contentData.originalVideoURL ||
    "";

  if (
    declaredType === "youtube" ||
    mimeType === "text/youtube-url" ||
    extractYouTubeVideoId(youtubeUrl)
  ) {
    return "youtube";
  }

  if (declaredType === "video" || mimeType.startsWith("video/")) {
    return "video";
  }
  if (declaredType === "pdf" || mimeType.includes("pdf")) {
    return "pdf";
  }
  if (declaredType === "image" || mimeType.startsWith("image/")) {
    return "image";
  }
  return "unknown";
};

const buildManualTranscriptScaffold = ({
  contentData = {},
  sourceType = "unknown",
  sourceUrl = null,
  transcriptSource = "manual",
}) => {
  const manualTranscript = String(contentData.manualTranscript || "").trim();
  const normalizedMimeType =
    sourceType === "video" ? "video/mp4" :
    sourceType === "pdf" ? "application/pdf" :
    sourceType === "image" ?
      (contentData.mimeType || "image/jpeg") :
      (contentData.mimeType || "application/octet-stream");

  if (!manualTranscript) {
    return {
      sourceType,
      normalizedMimeType,
      normalizedFileURL: sourceUrl,
      extractedText: null,
      easyReadText: null,
      transcript: null,
      captions: [],
      textInteractions: [],
      signVideoURL: contentData.signVideoURL || null,
      transcriptSource: "unavailable",
    };
  }

  return {
    sourceType,
    normalizedMimeType,
    normalizedFileURL: sourceUrl,
    extractedText: manualTranscript,
    easyReadText: manualTranscript,
    transcript: manualTranscript,
    captions: [],
    textInteractions: [
      "Summarize this transcript in simple words.",
      "Generate key points from this transcript.",
    ],
    signVideoURL: contentData.signVideoURL || null,
    transcriptSource,
  };
};

const buildCaptionsFromSpeechResults = (results = []) => {
  const captions = [];
  let cursorMs = 0;

  for (const result of results) {
    const alternative =
      Array.isArray(result.alternatives) && result.alternatives[0] ?
        result.alternatives[0] :
        null;

    if (!alternative || !String(alternative.transcript || "").trim()) {
      continue;
    }

    const transcript = String(alternative.transcript || "").trim();
    const words = Array.isArray(alternative.words) ? alternative.words : [];

    let startMs = cursorMs;
    let endMs = startMs + 2000;

    if (words.length > 0) {
      const firstWord = words[0] || {};
      const lastWord = words[words.length - 1] || {};
      const wordStart = durationToMs(firstWord.startTime || {});
      const wordEnd = durationToMs(lastWord.endTime || {});
      startMs = wordStart || cursorMs;
      endMs = wordEnd > startMs ? wordEnd : startMs + 2000;
    } else if (result.resultEndTime) {
      const resultEndMs = durationToMs(result.resultEndTime);
      endMs = resultEndMs > startMs ? resultEndMs : startMs + 2000;
    }

    captions.push({
      startMs,
      endMs,
      text: transcript,
      confidence: Number(alternative.confidence || 0),
    });

    cursorMs = endMs;
  }

  return captions;
};

const transcribeVideoFromStorage = async (contentData = {}) => {
  const storagePath = String(contentData.storagePath || "").trim();
  if (!storagePath) {
    throw new Error("Missing storage path for video transcription.");
  }

  const gcsUri = `gs://${bucket.name}/${storagePath}`;
  const languageCode = String(
      contentData.languageCode || contentData.language || DEFAULT_LANGUAGE,
  ).trim();

  const [operation] = await speechClient.longRunningRecognize({
    audio: {uri: gcsUri},
    config: {
      languageCode,
      enableAutomaticPunctuation: true,
      enableWordTimeOffsets: true,
      model: "latest_long",
    },
  });

  const [response] = await operation.promise();
  const results = Array.isArray(response.results) ? response.results : [];
  const captions = buildCaptionsFromSpeechResults(results);
  const transcript = captions
      .map((segment) => segment.text)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

  if (!transcript) {
    throw new Error("Speech-to-text returned empty transcript.");
  }

  return {
    sourceType: "video",
    normalizedMimeType: "video/mp4",
    normalizedFileURL: contentData.originalVideoURL || null,
    extractedText: transcript,
    easyReadText: transcript,
    transcript,
    captions,
    textInteractions: [
      "Summarize this lecture in short points.",
      "Explain this section in simpler terms.",
    ],
    signVideoURL: contentData.signVideoURL || null,
    transcriptSource: "speech_to_text",
    audioSourceUri: gcsUri,
  };
};

const buildVideoConversionScaffold = async (contentData = {}) => {
  try {
    return await transcribeVideoFromStorage(contentData);
  } catch (error) {
    logger.error("Video transcription failed", {
      message: error.message,
      code: error.code || null,
      storagePath: contentData.storagePath || null,
    });

    const fallback = buildManualTranscriptScaffold({
      contentData,
      sourceType: "video",
      sourceUrl: contentData.originalVideoURL || null,
      transcriptSource: "manual_fallback",
    });

    if (!fallback.transcript) {
      throw error;
    }

    return {
      ...fallback,
      processingWarning: error.message,
    };
  }
};

const buildYouTubeConversionScaffold = async (contentData = {}) => {
  const videoId =
    contentData.youtubeVideoId ||
    extractYouTubeVideoId(
        contentData.youtubeUrl || contentData.originalVideoURL,
    );

  if (!videoId) {
    throw new Error("Unable to parse YouTube video ID.");
  }

  try {
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
    if (!Array.isArray(transcriptItems) || transcriptItems.length === 0) {
      throw new Error("No transcript found for this YouTube video.");
    }

    const captions = transcriptItems
        .map((item) => {
          const text = String(item.text || "").trim();
          if (!text) {
            return null;
          }

          const startMs = toMilliseconds(item.offset);
          const durationMs = toMilliseconds(item.duration);
          const endMs = durationMs > 0 ? startMs + durationMs : startMs;

          return {
            startMs,
            endMs,
            text,
            confidence: 1,
          };
        })
        .filter(Boolean);

    const extractedText = captions
        .map((item) => item.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

    const canonicalUrl = buildYouTubeWatchUrl(videoId);

    return {
      sourceType: "youtube",
      normalizedMimeType: "text/plain",
      normalizedFileURL: canonicalUrl,
      extractedText: extractedText || null,
      easyReadText: extractedText || null,
      transcript: extractedText || null,
      captions,
      textInteractions: [
        "Summarize this video in simple language.",
        "List key points from this transcript.",
      ],
      signVideoURL: null,
      youtubeUrl: canonicalUrl,
      youtubeVideoId: videoId,
      transcriptSource: "youtube_captions",
    };
  } catch (error) {
    const fallback = buildManualTranscriptScaffold({
      contentData,
      sourceType: "youtube",
      sourceUrl: buildYouTubeWatchUrl(videoId),
      transcriptSource: "manual_fallback",
    });

    if (!fallback.transcript) {
      throw error;
    }

    return {
      ...fallback,
      youtubeUrl: buildYouTubeWatchUrl(videoId),
      youtubeVideoId: videoId,
      processingWarning: error.message,
    };
  }
};

const buildConversionScaffold = async (contentData = {}) => {
  const sourceType = inferSourceType(contentData);
  const sourceUrl = contentData.originalVideoURL || null;

  if (sourceType === "youtube") {
    return buildYouTubeConversionScaffold(contentData);
  }

  if (sourceType === "video") {
    return buildVideoConversionScaffold(contentData);
  }

  if (sourceType === "pdf" || sourceType === "image") {
    return buildManualTranscriptScaffold({
      contentData,
      sourceType,
      sourceUrl,
    });
  }

  return {
    sourceType: "unknown",
    normalizedMimeType: contentData.mimeType || "application/octet-stream",
    normalizedFileURL: sourceUrl,
    extractedText: null,
    easyReadText: null,
    transcript: null,
    captions: [],
    textInteractions: [],
    signVideoURL: null,
    transcriptSource: "unavailable",
  };
};

const transitionContentStage = async ({
  contentRef,
  contentData,
  stage,
  sourceType,
  targetNormalization,
  errorMessage,
}) => {
  const now = admin.firestore.FieldValue.serverTimestamp();
  const currentConversion = contentData.conversion || {};
  const conversion = {
    ...currentConversion,
    required: true,
    schemaVersion: "v2",
    pipelineVersion: "v2",
    processedBy: "processContent",
    sourceType: sourceType || inferSourceType(contentData),
    targetNormalization:
      targetNormalization ||
      currentConversion.targetNormalization ||
      null,
    stage,
    lastStageAt: now,
    retryCount: Number(currentConversion.retryCount || 0),
  };

  if (stage === PROCESS_STAGE.INGESTING && !currentConversion.startedAt) {
    conversion.startedAt = now;
  }
  if (stage === PROCESS_STAGE.COMPLETED) {
    conversion.completedAt = now;
    conversion.lastError = null;
  }
  if (stage === PROCESS_STAGE.FAILED) {
    conversion.failedAt = now;
    conversion.lastError = errorMessage || "Processing failed";
  }

  const patch = {
    conversion,
    conversionStatus: stageToStatus(stage),
    status: stageToStatus(stage),
    processingState: {
      currentStage: stage,
      updatedAt: now,
    },
  };

  if (stage === PROCESS_STAGE.COMPLETED) {
    patch.processedAt = now;
    patch.errorMessage = admin.firestore.FieldValue.delete();
  }

  if (stage === PROCESS_STAGE.FAILED) {
    patch.errorMessage = errorMessage || "Processing failed";
  }

  await contentRef.set(patch, {merge: true});
  contentData.conversion = conversion;
};

exports.processContent = onDocumentCreated(
    {
      document: "content/{contentId}",
      timeoutSeconds: 540,
      memory: "1GiB",
    },
    async (event) => {
      const snapshot = event.data;
      if (!snapshot) {
        logger.warn("No snapshot in event payload");
        return;
      }

      const contentId = event.params.contentId;
      const contentRef = db.collection("content").doc(contentId);
      const contentData = snapshot.data() || {};
      const hasSource = Boolean(
          contentData.originalVideoURL ||
          contentData.youtubeUrl ||
          contentData.storagePath,
      );
      const shouldProcess =
        contentData.status === "processing" &&
        hasSource;

      if (!shouldProcess) {
        logger.info("Skipping non-processable content", {
          contentId,
          status: contentData.status || null,
          hasSource,
        });
        return;
      }

      const sourceType = inferSourceType(contentData);
      logger.info("Processing content", {contentId, sourceType});

      try {
        await transitionContentStage({
          contentRef,
          contentData,
          stage: PROCESS_STAGE.INGESTING,
          sourceType,
        });

        await transitionContentStage({
          contentRef,
          contentData,
          stage: PROCESS_STAGE.TRANSCRIBING,
          sourceType,
        });

        const conversionScaffold = await buildConversionScaffold(contentData);

        await transitionContentStage({
          contentRef,
          contentData,
          stage: PROCESS_STAGE.PACKAGING,
          sourceType: conversionScaffold.sourceType,
          targetNormalization: conversionScaffold.normalizedMimeType,
        });

        const updatePayload = {
          normalizedMimeType: conversionScaffold.normalizedMimeType || null,
          normalizedFileURL: conversionScaffold.normalizedFileURL || null,
          extractedText: conversionScaffold.extractedText || null,
          easyReadText: conversionScaffold.easyReadText || null,
          transcript: conversionScaffold.transcript || null,
          captions: conversionScaffold.captions || [],
          textInteractions: conversionScaffold.textInteractions || [],
          signVideoURL: conversionScaffold.signVideoURL || null,
          transcriptSource:
            conversionScaffold.transcriptSource || "unavailable",
        };

        if (conversionScaffold.processingWarning) {
          updatePayload.processingWarning =
            conversionScaffold.processingWarning;
        }
        if (conversionScaffold.audioSourceUri) {
          updatePayload.audioSourceUri = conversionScaffold.audioSourceUri;
        }
        if (conversionScaffold.youtubeVideoId) {
          updatePayload.youtubeVideoId = conversionScaffold.youtubeVideoId;
          updatePayload.youtubeUrl = conversionScaffold.youtubeUrl;
          updatePayload.originalVideoURL = conversionScaffold.youtubeUrl;
        }

        await contentRef.set(updatePayload, {merge: true});

        await transitionContentStage({
          contentRef,
          contentData,
          stage: PROCESS_STAGE.COMPLETED,
          sourceType: conversionScaffold.sourceType,
          targetNormalization: conversionScaffold.normalizedMimeType,
        });

        logger.info("Processing completed", {contentId, sourceType});
      } catch (error) {
        logger.error("Processing failed", {
          contentId,
          sourceType,
          message: error.message,
          code: error.code || null,
        });

        await transitionContentStage({
          contentRef,
          contentData,
          stage: PROCESS_STAGE.FAILED,
          sourceType,
          errorMessage: error.message || "Processing failed",
        });
      }
    },
);

exports.generateTTS = onRequest(async (req, res) => {
  let hash = null;
  let cacheRef = null;

  try {
    const body = req.body || {};
    const {text, language, voiceName, speed} = body;

    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).send("Text is required");
    }

    const normalizedText = normalizeText(text);
    const languageCode = (language || DEFAULT_LANGUAGE).trim();
    const selectedVoice = (voiceName || DEFAULT_VOICE_NAME).trim();
    const parsedSpeed = Number(speed);
    const speakingRate = Number.isFinite(parsedSpeed) && parsedSpeed > 0 ?
      parsedSpeed :
      DEFAULT_SPEED;

    hash = buildTtsHash({
      normalizedText,
      languageCode,
      voice: selectedVoice,
      speakingRate,
    });

    cacheRef = db.collection("ttsCache").doc(hash);
    const cacheSnap = await cacheRef.get();
    const cacheData = cacheSnap.data() || {};

    const isReadyCache =
      cacheSnap.exists &&
      cacheData.status === "ready" &&
      Boolean(cacheData.audioUrl);

    if (isReadyCache) {
      return res.status(200).json({
        message: "Cached",
        audioUrl: cacheData.audioUrl,
      });
    }

    if (cacheSnap.exists && cacheData.status === "processing") {
      return res.status(202).json({
        message: "Processing already in progress",
      });
    }

    await cacheRef.set(
        {
          status: "processing",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        {merge: true},
    );

    logger.info("Generating TTS", {hash});

    const request = {
      input: {text},
      voice: {
        languageCode,
        name: selectedVoice,
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate,
      },
    };

    const [response] = await ttsClient.synthesizeSpeech(request);
    if (!response || !response.audioContent) {
      throw new Error("TTS provider returned empty audio content");
    }

    const filePath = `tts-cache/${hash}.mp3`;
    const file = bucket.file(filePath);

    await file.save(response.audioContent, {
      contentType: "audio/mpeg",
    });

    const [audioUrl] = await file.getSignedUrl({
      action: "read",
      expires: "03-01-2030",
    });

    await cacheRef.set(
        {
          status: "ready",
          audioUrl,
          language: languageCode,
          voiceName: selectedVoice,
          speed: speakingRate,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        {merge: true},
    );

    logger.info("TTS generation complete", {
      hash,
      bucket: bucket.name,
      filePath,
    });

    return res.status(200).json({
      message: "Generated",
      audioUrl,
    });
  } catch (error) {
    logger.error("TTS generation failed", {
      message: error.message,
      code: error.code || null,
      details: error.details || null,
      stack: error.stack,
      bucket: bucket.name,
      hash,
    });

    if (cacheRef || hash) {
      const fallbackRef = cacheRef || db.collection("ttsCache").doc(hash);
      await fallbackRef.set(
          {
            status: "failed",
            errorMessage: error.message,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          {merge: true},
      );
    }

    return res.status(500).json({
      message: "TTS generation failed",
      error: error.message,
      code: error.code || null,
      details: error.details || null,
      bucket: bucket.name,
      hash,
    });
  }
});
