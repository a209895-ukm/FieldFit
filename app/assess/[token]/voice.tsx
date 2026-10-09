import { useEffect, useRef, useState } from "react";
import { Headphones, Mic, Square, RotateCcw, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Lang } from "@/lib/assessment";
import { countUnits, type DeliveryMetrics } from "@/lib/communication";

const SPEECH_LANG: Record<Lang, string[]> = {
  en: ["en-GB", "en-US", "en"],
  ms: ["ms-MY", "ms", "id-ID", "id"],
  zh: ["zh-CN", "cmn", "zh"],
};
const RECOGNITION_LANG: Record<Lang, string> = {
  en: "en-US",
  ms: "ms-MY",
  zh: "zh-CN",
};
const MAX_SECONDS = 90;

function pickVoice(lang: Lang) {
  if (typeof speechSynthesis === "undefined") return null;
  const voices = speechSynthesis.getVoices();
  for (const code of SPEECH_LANG[lang]) {
    const v = voices.find((x) =>
      x.lang.toLowerCase().replace("_", "-").startsWith(code.toLowerCase()),
    );
    if (v) return v;
  }
  return null;
}

/**
 * Plays the customer voicemail, at most `maxPlays` times. Recorded audio is used when
 * supplied; until then the browser's speech synthesis reads the script (a placeholder).
 */
export function ListeningClip({
  lang,
  script,
  audio,
  maxPlays,
  plays,
  onPlay,
  t,
}: {
  lang: Lang;
  script: Record<Lang, string>;
  audio?: Partial<Record<Lang, string>>;
  maxPlays: number;
  plays: number;
  onPlay: () => void;
  t: any;
}) {
  const [playing, setPlaying] = useState(false);
  const [voiceReady, setVoiceReady] = useState<boolean | null>(null);
  const player = useRef<HTMLAudioElement | null>(null);
  const recorded = audio?.[lang];
  useEffect(() => {
    if (recorded) return setVoiceReady(true);
    const check = () => setVoiceReady(!!pickVoice(lang));
    check();
    if (typeof speechSynthesis !== "undefined") {
      speechSynthesis.addEventListener?.("voiceschanged", check);
      return () => {
        speechSynthesis.removeEventListener?.("voiceschanged", check);
        speechSynthesis.cancel();
      };
    }
  }, [lang, recorded]);
  useEffect(() => () => player.current?.pause(), []);
  function play() {
    if (plays >= maxPlays || playing) return;
    onPlay();
    setPlaying(true);
    if (recorded) {
      player.current = new Audio(recorded);
      player.current.onended = () => setPlaying(false);
      player.current.onerror = () => setPlaying(false);
      player.current.play().catch(() => setPlaying(false));
      return;
    }
    const u = new SpeechSynthesisUtterance(script[lang]);
    const voice = pickVoice(lang);
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
    }
    u.rate = 0.95;
    u.onend = () => setPlaying(false);
    u.onerror = () => setPlaying(false);
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }
  const left = Math.max(0, maxPlays - plays);
  return (
    <div className="listening-player">
      <span className="role-icon">
        <Headphones size={22} />
      </span>
      <div>
        <strong>{t.voicemail}</strong>
        <p className="muted">
          {playing ? t.playing : left ? t.playsLeft(left) : t.noPlays}
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        disabled={!left || playing || voiceReady === false}
        onClick={play}
      >
        <Volume2 size={15} />
        {plays ? t.replay : t.play}
      </Button>
      {voiceReady === false && (
        <div className="listening-fallback">
          <p className="muted">{t.noVoice}</p>
          <blockquote>{script[lang]}</blockquote>
        </div>
      )}
    </div>
  );
}

type Result = { blob: Blob; transcript: string; metrics: DeliveryMetrics };

/**
 * Records a spoken reply. Captures audio for the hiring team, a live transcript where
 * the browser supports speech recognition, and simple delivery signals: duration,
 * pace and silences longer than three seconds. Voice quality and accent are not measured.
 */
export function VoiceRecorder({
  lang,
  attempts,
  maxAttempts,
  onDone,
  t,
}: {
  lang: Lang;
  attempts: number;
  maxAttempts: number;
  onDone: (r: Result) => void;
  t: any;
}) {
  const [state, setState] = useState<"idle" | "recording" | "error">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [live, setLive] = useState("");
  const [error, setError] = useState("");
  const session = useRef<any>(null);
  const supported =
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined";
  useEffect(() => () => session.current?.cleanup(), []);

  async function start() {
    setError("");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setState("error");
      setError(t.micDenied);
      return;
    }
    const mime = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg",
    ].find((m) => MediaRecorder.isTypeSupported?.(m));
    const recorder = new MediaRecorder(
      stream,
      mime ? { mimeType: mime } : undefined,
    );
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);

    // Silence detection from the microphone level.
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const buf = new Float32Array(analyser.fftSize);
    let spoken = false,
      silentSince: number | null = null,
      longPauses = 0;
    const began = performance.now();
    const meter = setInterval(() => {
      analyser.getFloatTimeDomainData(buf);
      const rms = Math.sqrt(buf.reduce((s, v) => s + v * v, 0) / buf.length);
      const now = performance.now();
      if (rms > 0.02) {
        if (spoken && silentSince !== null && now - silentSince >= 3000)
          longPauses++;
        spoken = true;
        silentSince = null;
      } else if (silentSince === null) silentSince = now;
      const secs = (now - began) / 1000;
      setElapsed(Math.floor(secs));
      if (secs >= MAX_SECONDS) stop();
    }, 100);

    // Live transcript where the browser offers speech recognition.
    const Recognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    let finalText = "";
    let recognition: any = null;
    let active = true;
    if (Recognition) {
      recognition = new Recognition();
      recognition.lang = RECOGNITION_LANG[lang];
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (e: any) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const text = e.results[i][0].transcript;
          if (e.results[i].isFinal)
            finalText += (lang === "zh" ? "" : " ") + text.trim();
          else interim += text;
        }
        setLive((finalText + " " + interim).trim());
      };
      let failed = false;
      recognition.onerror = (e: any) => {
        // "no-speech" and "aborted" are routine; anything else (blocked, offline,
        // unsupported language) means no transcript this time. Recording continues.
        if (e.error !== "no-speech" && e.error !== "aborted") failed = true;
      };
      recognition.onend = () => {
        if (active && !failed) {
          try {
            recognition.start();
          } catch {}
        }
      };
      try {
        recognition.start();
      } catch {
        recognition = null;
      }
    }

    const cleanup = () => {
      active = false;
      clearInterval(meter);
      try {
        recognition?.stop();
      } catch {}
      stream.getTracks().forEach((track) => track.stop());
      ctx.close().catch(() => {});
    };
    function stop() {
      if (session.current?.stopped) return;
      session.current.stopped = true;
      const durationSec = Math.round((performance.now() - began) / 100) / 10;
      recorder.onstop = () => {
        // Give recognition a moment to deliver its last result.
        setTimeout(() => {
          cleanup();
          const transcript = finalText.trim();
          const units = countUnits(transcript, lang);
          setState("idle");
          setLive("");
          onDone({
            blob: new Blob(chunks, {
              type: recorder.mimeType || mime || "audio/webm",
            }),
            transcript,
            metrics: {
              durationSec,
              units,
              pace:
                transcript && durationSec > 0
                  ? Math.round(units / (durationSec / 60))
                  : null,
              longPauses,
              attempts: attempts + 1,
              transcribed: !!recognition && !!transcript,
            },
          });
        }, 600);
      };
      recorder.stop();
    }
    session.current = { stop, cleanup, stopped: false };
    recorder.start(1000);
    setElapsed(0);
    setLive("");
    setState("recording");
  }

  if (!supported) return <p className="error">{t.noRecorder}</p>;
  const left = maxAttempts - attempts;
  return (
    <div className="voice-recorder">
      {state === "recording" ? (
        <>
          <div className="recording-row">
            <span className="rec-dot" aria-hidden />
            <strong>
              {t.recording} · {Math.floor(elapsed / 60)}:
              {String(elapsed % 60).padStart(2, "0")} / 1:30
            </strong>
            <Button type="button" onClick={() => session.current?.stop()}>
              <Square size={14} />
              {t.stop}
            </Button>
          </div>
          <p className="live-transcript">{live || t.listeningNow}</p>
        </>
      ) : (
        <div className="recording-row">
          <Button type="button" disabled={left <= 0} onClick={start}>
            {attempts ? <RotateCcw size={15} /> : <Mic size={15} />}
            {attempts ? t.reRecord : t.record}
          </Button>
          <span className="muted">
            {left > 0 ? t.attemptsLeft(left) : t.noAttempts}
          </span>
        </div>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
