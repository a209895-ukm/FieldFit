import { apiFetch } from "@/lib/client-api";
import { pageUrl } from "@/lib/navigation";
import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Globe2,
  Save,
  Keyboard,
  Mic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { LANGS, ROLEPLAY, type Lang } from "@/lib/assessment";
import type { Communication } from "@/lib/communication";
import { saveAudio } from "@/lib/audio-store";
import { QuestionVisual } from "../../question-visual";
import { ListeningClip, VoiceRecorder } from "./voice";

const copy = {
  en: {
    welcome: "Let your potential do the talking.",
    intro:
      "A few real-world sales situations. One opportunity to show how you think.",
    name: "Welcome",
    choose: "Choose your language",
    consent:
      "I agree to my responses being used for this hiring assessment and reviewed by the hiring team.",
    privacy:
      "Your answers, timing, tab changes and your recorded voice reply are stored for this assessment. Your browser's speech service may convert your speech to text. No webcam is used. Records are kept for up to 180 days; the hiring team can process access, correction and deletion requests. This assessment informs an interview; a person makes the hiring decision.",
    draft: "Pilot assessment • Draft questions and translations",
    start: "Start assessment",
    next: "Save & continue",
    back: "Back",
    submit: "Submit assessment",
    saved: "Answers saved",
    saving: "Saving…",
    question: "Question",
    of: "of",
    conversation: "Customer conversation",
    reply: "Your response",
    placeholder: "Write what you would say to the customer…",
    done: "You’re all done.",
    thanks:
      "Thank you for taking the time to show us how you work. Your responses have been submitted to the hiring team.",
    nextSteps:
      "What happens next: the hiring team reviews your results and will contact you about the next step.",
    close: "You can safely close this page.",
    review: "Check your answers",
    ready: "Before you submit",
    remaining: "remaining",
    submitInfo:
      "Submitting completes your assessment. You will not be able to change your answers afterwards.",
    demo: "Practice mode — these are sample questions. Nothing is stored or sent to a hiring team.",
    time: "minutes",
    items: "questions + one conversation",
    itemsVoice: "questions + a short listening and speaking task",
    autosave: "Answers save when you move between questions.",
    resume: "Continue assessment",
    required: "Choose an answer to continue.",
    write: "Write at least 20 characters.",
    complete: "done",
    details: "Your assessment",
    pending: "This conversation will be reviewed using a fixed rubric.",
    sampledone: "Practice complete. No candidate record was created.",
    language: "Language",
    listenTitle: "Listen to a customer",
    listenIntro:
      "Play the customer's voicemail, then answer the questions. You can play it up to twice.",
    voicemail: "Customer voicemail",
    play: "Play",
    replay: "Play again",
    playing: "Playing…",
    playsLeft: (n: number) => `${n} ${n === 1 ? "play" : "plays"} left`,
    noPlays: "No plays left",
    noVoice:
      "Audio is not available in this browser. Read the voicemail below instead.",
    speakTitle: "Reply to the customer",
    speakIntro:
      "Answer out loud as if you were on the phone. Ask what you need to know and agree a practical next step. Don't promise an unapproved discount or delivery date. Aim for 60–90 seconds.",
    typedIntro:
      "Write your reply, including the questions you would ask and a practical next step. Do not promise an unapproved discount or delivery date.",
    record: "Start recording",
    stop: "Stop",
    recording: "Recording",
    reRecord: "Record again",
    attemptsLeft: (n: number) =>
      `${n} ${n === 1 ? "attempt" : "attempts"} left`,
    noAttempts: "No attempts left — your last recording is kept.",
    listeningNow: "Listening… start speaking.",
    yourRecording: "Your recording",
    transcript: "What we heard",
    noTranscript:
      "Your browser could not convert speech to text. Your recording is saved and the hiring team will listen to it.",
    typeInstead: "Type my reply instead",
    typedNote:
      "Typed replies are marked on content only. Choose this if you have a hearing or speech difficulty, or no microphone.",
    useVoice: "Reply by voice instead",
    micDenied:
      "Microphone access was blocked. Allow the microphone in your browser settings, or type your reply instead.",
    noRecorder:
      "This browser cannot record audio. Please type your reply instead.",
    uploading: "Saving your recording…",
    listenReview: "Listening",
    replyReview: "Customer reply",
    recordFirst: "Record your reply (at least 10 seconds) to continue.",
  },
  ms: {
    welcome: "Tunjukkan potensi anda.",
    intro:
      "Situasi jualan sebenar. Peluang untuk menunjukkan cara anda berfikir.",
    name: "Selamat datang",
    choose: "Pilih bahasa anda",
    consent:
      "Saya bersetuju respons saya digunakan untuk penilaian pengambilan ini dan disemak oleh pasukan pengambilan.",
    privacy:
      "Jawapan, masa, pertukaran tab dan rakaman suara anda disimpan untuk penilaian ini. Perkhidmatan pertuturan pelayar anda mungkin menukar suara anda kepada teks. Tiada kamera web digunakan. Rekod disimpan sehingga 180 hari; hubungi pasukan pengambilan untuk akses, pembetulan atau pemadaman. Penilaian menyokong temu duga; keputusan dibuat oleh manusia.",
    draft: "Penilaian rintis • Soalan dan terjemahan draf",
    start: "Mula penilaian",
    next: "Simpan & teruskan",
    back: "Kembali",
    submit: "Hantar penilaian",
    saved: "Jawapan disimpan",
    saving: "Menyimpan…",
    question: "Soalan",
    of: "daripada",
    conversation: "Perbualan pelanggan",
    reply: "Respons anda",
    placeholder: "Tulis apa yang anda akan katakan…",
    done: "Anda telah selesai.",
    thanks:
      "Terima kasih. Respons anda telah dihantar kepada pasukan pengambilan.",
    nextSteps:
      "Langkah seterusnya: pasukan pengambilan akan menyemak keputusan anda dan menghubungi anda.",
    close: "Anda boleh menutup halaman ini.",
    review: "Semak jawapan anda",
    ready: "Sebelum menghantar",
    remaining: "berbaki",
    submitInfo: "Selepas dihantar, jawapan tidak boleh diubah.",
    demo: "Mod latihan — ini soalan contoh. Tiada apa-apa disimpan atau dihantar.",
    time: "minit",
    items: "soalan + satu perbualan",
    itemsVoice: "soalan + tugasan mendengar dan bertutur yang ringkas",
    autosave: "Jawapan disimpan apabila anda beralih soalan.",
    resume: "Teruskan penilaian",
    required: "Pilih satu jawapan untuk teruskan.",
    write: "Tulis sekurang-kurangnya 20 aksara.",
    complete: "selesai",
    details: "Penilaian anda",
    pending: "Perbualan disemak menggunakan rubrik tetap.",
    sampledone: "Latihan selesai. Tiada rekod calon dicipta.",
    language: "Bahasa",
    listenTitle: "Dengar mesej pelanggan",
    listenIntro:
      "Mainkan mel suara pelanggan, kemudian jawab soalan. Anda boleh memainkannya sehingga dua kali.",
    voicemail: "Mel suara pelanggan",
    play: "Main",
    replay: "Main semula",
    playing: "Sedang dimainkan…",
    playsLeft: (n: number) => `${n} kali main lagi`,
    noPlays: "Tiada lagi peluang main",
    noVoice: "Audio tidak tersedia dalam pelayar ini. Baca mel suara di bawah.",
    speakTitle: "Balas pelanggan",
    speakIntro:
      "Jawab secara lisan seolah-olah anda sedang bercakap di telefon. Tanya perkara yang perlu anda tahu dan persetujui langkah seterusnya yang praktikal. Jangan janji diskaun atau tarikh penghantaran tanpa kelulusan. Sasarkan 60–90 saat.",
    typedIntro:
      "Tulis respons anda, termasuk soalan dan langkah seterusnya. Jangan janji diskaun atau tarikh penghantaran tanpa kelulusan.",
    record: "Mula merakam",
    stop: "Berhenti",
    recording: "Merakam",
    reRecord: "Rakam semula",
    attemptsLeft: (n: number) => `${n} cubaan lagi`,
    noAttempts: "Tiada cubaan lagi — rakaman terakhir disimpan.",
    listeningNow: "Sedang mendengar… mulakan bercakap.",
    yourRecording: "Rakaman anda",
    transcript: "Apa yang kami dengar",
    noTranscript:
      "Pelayar anda tidak dapat menukar suara kepada teks. Rakaman anda disimpan dan pasukan pengambilan akan mendengarnya.",
    typeInstead: "Taip respons saya",
    typedNote:
      "Respons bertulis dinilai pada kandungan sahaja. Pilih ini jika anda mempunyai masalah pendengaran atau pertuturan, atau tiada mikrofon.",
    useVoice: "Balas secara lisan",
    micDenied:
      "Akses mikrofon disekat. Benarkan mikrofon dalam tetapan pelayar, atau taip respons anda.",
    noRecorder:
      "Pelayar ini tidak dapat merakam audio. Sila taip respons anda.",
    uploading: "Menyimpan rakaman…",
    listenReview: "Mendengar",
    replyReview: "Respons pelanggan",
    recordFirst:
      "Rakam respons anda (sekurang-kurangnya 10 saat) untuk teruskan.",
  },
  zh: {
    welcome: "让你的潜力说话。",
    intro: "真实的销售情境，一次展示思考方式的机会。",
    name: "欢迎",
    choose: "选择语言",
    consent: "我同意将我的回答用于本次招聘评估，并由招聘团队审核。",
    privacy:
      "系统会保存你的答案、用时、切换标签页的情况以及你的语音回复录音。浏览器的语音服务可能会把你的语音转换成文字。不使用摄像头。记录最多保存180天；如需查阅、更正或删除，请联系招聘团队。评估为面试提供参考，最终决定由人做出。",
    draft: "试点评估 · 题目及翻译为草稿",
    start: "开始评估",
    next: "保存并继续",
    back: "返回",
    submit: "提交评估",
    saved: "答案已保存",
    saving: "保存中…",
    question: "题目",
    of: "/",
    conversation: "客户对话",
    reply: "你的回复",
    placeholder: "写下你会对顾客说的话……",
    done: "你已完成。",
    thanks: "感谢你展示自己的工作方式。你的回答已提交给招聘团队。",
    nextSteps: "接下来：招聘团队会审阅你的结果，并就下一步与你联系。",
    close: "现在可以关闭此页面。",
    review: "检查答案",
    ready: "提交前确认",
    remaining: "剩余",
    submitInfo: "提交后评估将结束，无法再修改答案。",
    demo: "练习模式——以下为示例题目，不会保存或发送给招聘团队。",
    time: "分钟",
    items: "道题及一次对话",
    itemsVoice: "道题，以及一段简短的听力和口语任务",
    autosave: "切换题目时保存答案。",
    resume: "继续评估",
    required: "请选择一个答案。",
    write: "请至少写20个字符。",
    complete: "已完成",
    details: "你的评估",
    pending: "此对话将按固定评分标准审核。",
    sampledone: "练习完成。没有创建候选人记录。",
    language: "语言",
    listenTitle: "聆听顾客留言",
    listenIntro: "播放顾客的语音留言，然后回答问题。最多可以播放两次。",
    voicemail: "顾客语音留言",
    play: "播放",
    replay: "再播放一次",
    playing: "正在播放……",
    playsLeft: (n: number) => `还可播放${n}次`,
    noPlays: "已无播放次数",
    noVoice: "此浏览器无法播放音频。请阅读下面的留言内容。",
    speakTitle: "回复顾客",
    speakIntro:
      "请像打电话一样开口回答。询问你需要了解的情况，并约定可行的下一步。不要承诺未经批准的折扣或交货日期。时长约60至90秒。",
    typedIntro:
      "请写出你的回应，包括你会提出的问题和可行的下一步。不要承诺未经批准的折扣或交货日期。",
    record: "开始录音",
    stop: "停止",
    recording: "录音中",
    reRecord: "重新录音",
    attemptsLeft: (n: number) => `还可录${n}次`,
    noAttempts: "已无录音机会，将保留最后一次录音。",
    listeningNow: "正在聆听……请开始说话。",
    yourRecording: "你的录音",
    transcript: "识别到的内容",
    noTranscript:
      "你的浏览器无法将语音转换成文字。录音已保存，招聘团队会收听。",
    typeInstead: "改为文字回复",
    typedNote:
      "文字回复只评估内容。如果你有听力或语言障碍，或没有麦克风，可选择此方式。",
    useVoice: "改为语音回复",
    micDenied:
      "麦克风权限被阻止。请在浏览器设置中允许使用麦克风，或改为文字回复。",
    noRecorder: "此浏览器无法录音，请改为文字回复。",
    uploading: "正在保存录音……",
    listenReview: "听力",
    replyReview: "顾客回复",
    recordFirst: "请先录下你的回复（至少10秒）再继续。",
  },
};
const MAX_ATTEMPTS = 2;
const emptyComm = (mode: "voice" | "typed"): Communication => ({
  mode,
  listening: { answers: {}, plays: 0 },
});
export default function Assessment({ token }: { token: string }) {
  const demo = token === "demo";
  const [data, setData] = useState<any>(null),
    [lang, setLang] = useState<Lang>("en"),
    [consent, setConsent] = useState(false),
    [answers, setAnswers] = useState<Record<string, number>>({}),
    [conversation, setConversation] = useState(""),
    [comm, setComm] = useState<Communication>(emptyComm("voice")),
    [clip, setClip] = useState<string | null>(null),
    [index, setIndex] = useState(0),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [revision, setRevision] = useState(0),
    [seconds, setSeconds] = useState(1200),
    [saved, setSaved] = useState(false);
  const locked = useRef(false);
  const t = copy[lang];
  const total = data?.questions.length ?? 12;
  const listening = data?.listening ?? null;
  const voiceTask = !!data?.speaking;
  const LISTEN = listening ? total : -1;
  const SPEAK = total + (listening ? 1 : 0);
  const REVIEW = SPEAK + 1;
  const listenDone =
    !listening ||
    listening.questions.every(
      (q: any) => comm.listening.answers[q.id] !== undefined,
    );
  const replyDone =
    comm.mode === "voice" && voiceTask
      ? (comm.metrics?.durationSec ?? 0) >= 10
      : conversation.trim().length >= 20;
  async function request(action = "", body?: any) {
    const res = await apiFetch(
      demo
        ? "/api/demo"
        : "/api/assessment/" + token + (action ? "/" + action : ""),
      {
        method: body ? "POST" : "GET",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      },
    );
    const d: any = await res.json();
    if (!res.ok) throw Error(d.error);
    return d;
  }
  async function load() {
    try {
      setError("");
      const d = await request();
      setData(d);
      setLang(d.language);
      setAnswers(d.answers);
      setConversation(d.conversation);
      setComm(d.communication ?? emptyComm(d.speaking ? "voice" : "typed"));
      setRevision(d.revision);
      const first = d.questions.findIndex(
        (q: any) => d.answers[q.id] === undefined,
      );
      setIndex(first >= 0 ? first : d.questions.length);
    } catch (e: any) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, [token]);
  useEffect(() => {
    document.documentElement.lang = lang;
    return () => {
      document.documentElement.lang = "en";
    };
  }, [lang]);
  useEffect(() => {
    if (data?.status !== "In progress") return;
    const tick = () =>
      setSeconds(
        Math.max(
          0,
          Math.ceil(
            (Date.parse(data.started) + data.minutes * 60000 - Date.now()) /
              1000,
          ),
        ),
      );
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [data?.started, data?.status]);
  useEffect(() => {
    if (data?.status !== "In progress" || demo) return;
    const event = () => {
      if (document.hidden) request("event", {}).catch(() => {});
    };
    document.addEventListener("visibilitychange", event);
    return () => document.removeEventListener("visibilitychange", event);
  }, [data?.status]);
  useEffect(() => {
    if (seconds === 0 && data?.status === "In progress") save("submit", true);
  }, [seconds, data?.status]);
  useEffect(() => {
    if (data?.status !== "In progress") return;
    const exit = (e: BeforeUnloadEvent) => {
      if (!saved) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", exit);
    return () => window.removeEventListener("beforeunload", exit);
  }, [saved, data?.status]);
  useEffect(
    () => () => {
      if (clip) URL.revokeObjectURL(clip);
    },
    [clip],
  );
  async function start() {
    setBusy(true);
    setError("");
    try {
      if (demo)
        setData({
          ...data,
          status: "In progress",
          started: new Date().toISOString(),
        });
      else {
        await request("start", { language: lang, consent });
        await load();
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function save(
    action = "save",
    timeout = false,
    next?: number,
    current = comm,
  ) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      if (demo) {
        if (action === "submit") setData({ ...data, status: "Completed" });
        else if (next !== undefined) setIndex(next);
      } else {
        const r = await request(action, {
          answers,
          conversation,
          communication: data?.listening || data?.speaking ? current : null,
          revision,
        });
        setRevision(r.revision ?? revision);
        if (r.status === "Completed") setData({ ...data, status: "Completed" });
        else if (next !== undefined) setIndex(next);
      }
      setSaved(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  async function recorded(r: {
    blob: Blob;
    transcript: string;
    metrics: Communication["metrics"];
  }) {
    if (clip) URL.revokeObjectURL(clip);
    setClip(URL.createObjectURL(r.blob));
    setConversation(r.transcript);
    setSaved(false);
    let audio = comm.audio;
    if (!demo) {
      setBusy(true);
      try {
        audio = await saveAudio(token, r.blob);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setBusy(false);
      }
    }
    const nextComm = {
      ...comm,
      mode: "voice" as const,
      metrics: r.metrics,
      audio,
    };
    setComm(nextComm);
    if (!demo) save("save", false, undefined, nextComm);
  }
  function switchMode(mode: "voice" | "typed") {
    setComm({
      ...comm,
      mode,
      metrics: mode === "typed" ? undefined : comm.metrics,
    });
    if (mode === "typed" && comm.mode === "voice") setConversation("");
    setSaved(false);
  }
  const q = index < total ? data?.questions[index] : null;
  const steps = total + (listening?.questions.length ?? 0) + 1;
  const done =
    Object.keys(answers).length +
    Object.keys(comm.listening.answers).length +
    (replyDone ? 1 : 0);
  const canContinue = q
    ? answers[q.id] !== undefined
    : index === LISTEN
      ? listenDone
      : replyDone;
  const languagePicker = (
    <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
      <SelectTrigger className="lang-switch" aria-label={t.language}>
        <Globe2 size={13} />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(LANGS).map(([k, v]) => (
          <SelectItem key={k} value={k}>
            {v}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
  return (
    <div className="assessment-page">
      <header className="assessment-header">
        <a href={pageUrl("/")} className="brand">
          <span className="brand-mark">ff</span>FieldFit
          <span className="brand-dot">.</span>
        </a>
        <span>
          <ShieldCheck size={16} /> {t.draft}
        </span>
      </header>
      <main className="assessment-main" lang={lang}>
        {demo && <div className="notice">{t.demo}</div>}
        {error && (
          <div className="error" role="alert">
            {error}{" "}
            {!data && (
              <Button variant="outline" onClick={load}>
                Retry / Cuba lagi / 重试
              </Button>
            )}
          </div>
        )}
        {!data && !error ? (
          <p>Loading / Memuatkan / 加载中…</p>
        ) : data?.status === "Completed" ? (
          <section className="complete-card">
            <CheckCircle2 size={52} />
            <div className="eyebrow">FIELDFIT</div>
            <h1>{t.done}</h1>
            <p>{demo ? t.sampledone : t.thanks}</p>
            {!demo && <p className="next-steps">{t.nextSteps}</p>}
            <p className="muted">{t.close}</p>
            {demo && (
              <Button asChild>
                <a href={pageUrl("/employee")}>Return to Employee portal</a>
              </Button>
            )}
          </section>
        ) : data?.status === "Invited" ? (
          <section className="welcome-card">
            <div className="eyebrow">
              {t.name}, {demo ? "future field professional" : data.name}
            </div>
            <h1>{t.welcome}</h1>
            <p>{t.intro}</p>
            <div className="assessment-facts">
              <span>
                <Clock3 /> {data.minutes} {t.time}
              </span>
              <span>
                <CheckCircle2 /> {total} {voiceTask ? t.itemsVoice : t.items}
              </span>
              <span>
                <Globe2 /> English · BM · 中文
              </span>
            </div>
            <label className="form-label">{t.choose}</label>
            <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LANGS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="privacy">
              <ShieldCheck />
              <p>{t.privacy}</p>
            </div>
            <label className="consent">
              <Checkbox
                checked={consent}
                onCheckedChange={(v) => setConsent(v === true)}
              />
              <span>{t.consent}</span>
            </label>
            <Button
              className="wide"
              disabled={!consent || busy}
              onClick={start}
            >
              {t.start}
              <ArrowRight size={16} />
            </Button>
          </section>
        ) : (
          data && (
            <>
              <div className="assessment-progress">
                <div>
                  <span>{t.details}</span>
                  <strong>
                    {done}/{steps} {t.complete}
                  </strong>
                </div>
                <Progress value={(done / steps) * 100} />
                <div className="assessment-status">
                  <span>
                    <Save size={13} />
                    {busy ? t.saving : saved ? t.saved : t.autosave}
                  </span>
                  <div className="status-right">
                    {languagePicker}
                    <strong className={seconds < 120 ? "urgent" : ""}>
                      <Clock3 size={15} />
                      {Math.floor(seconds / 60)}:
                      {String(seconds % 60).padStart(2, "0")} {t.remaining}
                    </strong>
                  </div>
                </div>
              </div>
              <section className="question-card">
                {q ? (
                  <>
                    <div className="eyebrow">
                      {t.question} {index + 1} {t.of} {total}
                    </div>
                    <h1>{q.prompt[lang]}</h1>
                    {q.visual && (
                      <QuestionVisual visual={q.visual} lang={lang} />
                    )}
                    <RadioGroup
                      value={
                        answers[q.id] === undefined ? "" : String(answers[q.id])
                      }
                      onValueChange={(v) => {
                        setAnswers({ ...answers, [q.id]: Number(v) });
                        setSaved(false);
                      }}
                    >
                      {q.options[lang].map((option: string, i: number) => (
                        <label
                          className={
                            "answer-option " +
                            (answers[q.id] === i ? "chosen" : "")
                          }
                          key={i}
                        >
                          <RadioGroupItem value={String(i)} />
                          <span className="option-letter">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span>{option}</span>
                        </label>
                      ))}
                    </RadioGroup>
                  </>
                ) : index === LISTEN ? (
                  <>
                    <div className="eyebrow">{t.listenReview}</div>
                    <h1>{t.listenTitle}</h1>
                    <p className="muted">{t.listenIntro}</p>
                    <ListeningClip
                      lang={lang}
                      script={listening.script}
                      audio={listening.audio}
                      maxPlays={listening.maxPlays}
                      plays={comm.listening.plays}
                      onPlay={() =>
                        setComm({
                          ...comm,
                          listening: {
                            ...comm.listening,
                            plays: comm.listening.plays + 1,
                          },
                        })
                      }
                      t={t}
                    />
                    {listening.questions.map((lq: any, n: number) => (
                      <div className="listening-question" key={lq.id}>
                        <p>
                          <strong>{n + 1}.</strong> {lq.prompt[lang]}
                        </p>
                        <RadioGroup
                          value={
                            comm.listening.answers[lq.id] === undefined
                              ? ""
                              : String(comm.listening.answers[lq.id])
                          }
                          onValueChange={(v) => {
                            setComm({
                              ...comm,
                              listening: {
                                ...comm.listening,
                                answers: {
                                  ...comm.listening.answers,
                                  [lq.id]: Number(v),
                                },
                              },
                            });
                            setSaved(false);
                          }}
                        >
                          {lq.options[lang].map((option: string, i: number) => (
                            <label
                              key={i}
                              className={
                                "answer-option compact " +
                                (comm.listening.answers[lq.id] === i
                                  ? "chosen"
                                  : "")
                              }
                            >
                              <RadioGroupItem value={String(i)} />
                              <span className="option-letter">
                                {String.fromCharCode(65 + i)}
                              </span>
                              <span>{option}</span>
                            </label>
                          ))}
                        </RadioGroup>
                      </div>
                    ))}
                  </>
                ) : index === SPEAK ? (
                  <>
                    <div className="eyebrow">{t.conversation}</div>
                    <h1>
                      {(data.speaking?.customer ?? null)?.[lang] ??
                        ROLEPLAY[lang]}
                    </h1>
                    {voiceTask && comm.mode === "voice" ? (
                      <>
                        <p className="muted">{t.speakIntro}</p>
                        <VoiceRecorder
                          lang={lang}
                          attempts={comm.metrics?.attempts ?? 0}
                          maxAttempts={MAX_ATTEMPTS}
                          onDone={recorded}
                          t={t}
                        />
                        {(clip || comm.metrics) && (
                          <div className="voice-result">
                            {clip && (
                              <>
                                <span className="form-label">
                                  {t.yourRecording}
                                </span>
                                <audio controls src={clip} />
                              </>
                            )}
                            <span className="form-label">{t.transcript}</span>
                            <blockquote>
                              {conversation || t.noTranscript}
                            </blockquote>
                          </div>
                        )}
                        {!replyDone && comm.metrics && (
                          <p className="muted">{t.recordFirst}</p>
                        )}
                        <button
                          type="button"
                          className="link-button"
                          onClick={() => switchMode("typed")}
                        >
                          <Keyboard size={14} /> {t.typeInstead}
                        </button>
                        <p className="muted small">{t.typedNote}</p>
                      </>
                    ) : (
                      <>
                        <p className="muted">
                          {voiceTask ? t.typedIntro : t.pending}
                        </p>
                        <label className="form-label" htmlFor="conversation">
                          {t.reply}
                        </label>
                        <textarea
                          id="conversation"
                          value={conversation}
                          maxLength={6000}
                          placeholder={t.placeholder}
                          onChange={(e) => {
                            setConversation(e.target.value);
                            setSaved(false);
                          }}
                        />
                        <small className="muted">
                          {conversation.length}/6000 · {t.write}
                        </small>
                        {voiceTask && (
                          <button
                            type="button"
                            className="link-button"
                            onClick={() => switchMode("voice")}
                          >
                            <Mic size={14} /> {t.useVoice}
                          </button>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <div className="eyebrow">{t.ready}</div>
                    <h1>{t.review}</h1>
                    <p>{t.submitInfo}</p>
                    <div className="review-grid">
                      {data.questions.map((item: any, i: number) => (
                        <button
                          key={item.id}
                          onClick={() => setIndex(i)}
                          className={
                            answers[item.id] === undefined ? "missing" : ""
                          }
                        >
                          {i + 1} {answers[item.id] !== undefined ? "✓" : "—"}
                        </button>
                      ))}
                      {listening && (
                        <button
                          className={"wide " + (listenDone ? "" : "missing")}
                          onClick={() => setIndex(LISTEN)}
                        >
                          {t.listenReview} {listenDone ? "✓" : "—"}
                        </button>
                      )}
                      <button
                        className={"wide " + (replyDone ? "" : "missing")}
                        onClick={() => setIndex(SPEAK)}
                      >
                        {voiceTask ? t.replyReview : t.conversation}{" "}
                        {replyDone ? "✓" : "—"}
                      </button>
                    </div>
                  </>
                )}
                <div className="question-nav">
                  <Button
                    variant="outline"
                    disabled={index === 0 || busy}
                    onClick={() => save("save", false, index - 1)}
                  >
                    <ArrowLeft size={15} />
                    {t.back}
                  </Button>
                  {index >= REVIEW ? (
                    <Button
                      disabled={
                        busy ||
                        Object.keys(answers).length !== total ||
                        !listenDone ||
                        !replyDone
                      }
                      onClick={() => save("submit")}
                    >
                      {t.submit}
                      <CheckCircle2 size={16} />
                    </Button>
                  ) : (
                    <Button
                      disabled={busy || !canContinue}
                      onClick={() => save("save", false, index + 1)}
                    >
                      {t.next}
                      <ArrowRight size={15} />
                    </Button>
                  )}
                </div>
              </section>
            </>
          )
        )}
      </main>
      <div className="assessment-footer">
        FieldFit · Every candidate, measured the same way.
      </div>
    </div>
  );
}
