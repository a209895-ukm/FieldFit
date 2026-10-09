import type { Lang, Question } from "./assessment";
import type { Listening, Speaking } from "./communication";

type Text = Record<Lang, string>;
const t = (en: string, ms: string, zh: string): Text => ({ en, ms, zh });

export const LISTENING: Listening = {
  id: "LIS-A",
  maxPlays: 2,
  script: t(
    "Hello, this is Mei Ling from Kedai Runcit Harmoni in Bangi. I'd like to order twenty cartons of the one-and-a-half-litre mineral water for our weekend promotion. Last time, the delivery arrived a day late, so I really need this one by Friday, ten in the morning, at the latest. Please call me back to confirm the price and the delivery time. Thank you.",
    "Helo, saya Mei Ling dari Kedai Runcit Harmoni di Bangi. Saya ingin memesan dua puluh karton air mineral satu setengah liter untuk promosi hujung minggu kami. Kali lepas, penghantaran tiba lewat sehari, jadi saya betul-betul perlukan pesanan ini selewat-lewatnya pada hari Jumaat, jam sepuluh pagi. Sila hubungi saya semula untuk mengesahkan harga dan masa penghantaran. Terima kasih.",
    "你好，我是班吉和谐杂货店的美玲。我想订二十箱一点五升的矿泉水，用于我们的周末促销。上次送货迟了一天，所以这次最迟一定要在星期五早上十点前送到。请回电确认价格和送货时间。谢谢。",
  ),
  questions: [
    {
      id: "LIS-A1",
      prompt: t(
        "What does the customer want to order?",
        "Apakah yang ingin dipesan oleh pelanggan?",
        "顾客想订购什么？",
      ),
      options: {
        en: [
          "20 cartons of 1.5-litre mineral water",
          "15 cartons of 1.5-litre mineral water",
          "20 cartons of 500 ml mineral water",
          "Only a price list",
        ],
        ms: [
          "20 karton air mineral 1.5 liter",
          "15 karton air mineral 1.5 liter",
          "20 karton air mineral 500 ml",
          "Senarai harga sahaja",
        ],
        zh: [
          "20箱1.5升矿泉水",
          "15箱1.5升矿泉水",
          "20箱500毫升矿泉水",
          "只要一份价格表",
        ],
      },
      points: [100, 0, 0, 0],
    },
    {
      id: "LIS-A2",
      prompt: t(
        "What is the customer's main concern?",
        "Apakah kebimbangan utama pelanggan?",
        "顾客最担心的是什么？",
      ),
      options: {
        en: [
          "The price is too high",
          "The delivery must arrive on time",
          "The product quality",
          "The payment terms",
        ],
        ms: [
          "Harga terlalu tinggi",
          "Penghantaran mesti tiba tepat pada masanya",
          "Kualiti produk",
          "Terma pembayaran",
        ],
        zh: ["价格太高", "必须准时送达", "产品质量", "付款条件"],
      },
      points: [0, 100, 0, 0],
    },
    {
      id: "LIS-A3",
      prompt: t(
        "What is the latest time the order must arrive?",
        "Bilakah masa paling lewat pesanan mesti tiba?",
        "订单最迟必须在什么时候送到？",
      ),
      options: {
        en: [
          "Thursday, 10 a.m.",
          "Friday, 10 p.m.",
          "Friday, 10 a.m.",
          "Saturday morning",
        ],
        ms: [
          "Khamis, 10 pagi",
          "Jumaat, 10 malam",
          "Jumaat, 10 pagi",
          "Sabtu pagi",
        ],
        zh: [
          "星期四早上十点",
          "星期五晚上十点",
          "星期五早上十点",
          "星期六早上",
        ],
      },
      points: [0, 0, 100, 0],
    },
  ],
};

export const SPEAKING: Speaking = {
  customer: t(
    "“Your price is higher, and my last delivery was late. Why should I order from you again?”",
    "“Harga anda lebih tinggi, dan penghantaran terakhir lewat. Mengapa saya patut membeli daripada anda lagi?”",
    "“你的价格更高，上次交货也迟了。为什么我还应该向你下单？”",
  ),
};

/** Practice-only material. None of it appears in a real assessment. */
export const PRACTICE_LISTENING: Listening = {
  id: "LIS-P",
  maxPlays: 2,
  script: t(
    "Hi, this is Raj from Restoran Seri Murni. Please email me your latest price list today. I'll decide on my order tomorrow morning. Thanks!",
    "Hai, saya Raj dari Restoran Seri Murni. Sila e-mel senarai harga terkini anda kepada saya hari ini. Saya akan membuat keputusan tentang pesanan saya esok pagi. Terima kasih!",
    "你好，我是Seri Murni餐厅的Raj。请今天把你们最新的价格表电邮给我。我明天早上会决定订单。谢谢！",
  ),
  questions: [
    {
      id: "LIS-P1",
      prompt: t(
        "What does Raj ask for?",
        "Apakah yang diminta oleh Raj?",
        "Raj要求什么？",
      ),
      options: {
        en: [
          "The price list by email",
          "A delivery today",
          "A phone call tomorrow",
          "Free samples",
        ],
        ms: [
          "Senarai harga melalui e-mel",
          "Penghantaran hari ini",
          "Panggilan telefon esok",
          "Sampel percuma",
        ],
        zh: ["通过电邮发送价格表", "今天送货", "明天打电话", "免费样品"],
      },
      points: [100, 0, 0, 0],
    },
    {
      id: "LIS-P2",
      prompt: t(
        "When will Raj decide on his order?",
        "Bilakah Raj akan membuat keputusan tentang pesanannya?",
        "Raj什么时候决定订单？",
      ),
      options: {
        en: ["Today", "Tomorrow morning", "Tomorrow evening", "Next week"],
        ms: ["Hari ini", "Esok pagi", "Esok petang", "Minggu depan"],
        zh: ["今天", "明天早上", "明天晚上", "下周"],
      },
      points: [0, 100, 0, 0],
    },
  ],
};
export const PRACTICE_SPEAKING: Speaking = {
  customer: t(
    "“I'm interested, but I'm not sure your product suits my small shop. Can you help me decide?”",
    "“Saya berminat, tetapi saya tidak pasti produk anda sesuai untuk kedai kecil saya. Boleh anda bantu saya membuat keputusan?”",
    "“我有兴趣，但不确定你们的产品适不适合我的小店。你能帮我做决定吗？”",
  ),
};
const days = {
  en: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  ms: ["Isn", "Sel", "Rab", "Kha", "Jum"],
  zh: ["周一", "周二", "周三", "周四", "周五"],
};
const pq = (
  id: string,
  cap: number,
  prompt: Text,
  options: Record<Lang, string[]>,
  points: number[],
  extra: Partial<Question> = {},
): Question => ({
  id,
  cap,
  prompt,
  options,
  points,
  explanation: "Practice item.",
  enabled: true,
  ...extra,
});
export const PRACTICE_QUESTIONS: Question[] = [
  pq(
    "PRAC-1",
    0,
    t(
      "A shirt costs RM 40 and is 10% off. What is the sale price?",
      "Sehelai baju berharga RM 40 dan diberi diskaun 10%. Berapakah harga jualannya?",
      "一件衬衫售价 RM 40，打九折（减10%）。售价是多少？",
    ),
    {
      en: ["RM 36", "RM 30", "RM 44", "RM 4"],
      ms: ["RM 36", "RM 30", "RM 44", "RM 4"],
      zh: ["RM 36", "RM 30", "RM 44", "RM 4"],
    },
    [100, 0, 0, 0],
  ),
  pq(
    "PRAC-2",
    1,
    t(
      "Every order needs a signed form before delivery. Order 7 has no signed form. What follows?",
      "Setiap pesanan memerlukan borang bertandatangan sebelum penghantaran. Pesanan 7 tiada borang bertandatangan. Apakah kesimpulannya?",
      "每张订单在送货前都需要签署的表格。第7号订单没有签署的表格。可得出什么结论？",
    ),
    {
      en: [
        "Order 7 can be delivered",
        "Order 7 is not ready for delivery",
        "Order 7 is cancelled",
        "Order 7 was paid",
      ],
      ms: [
        "Pesanan 7 boleh dihantar",
        "Pesanan 7 belum sedia untuk dihantar",
        "Pesanan 7 dibatalkan",
        "Pesanan 7 telah dibayar",
      ],
      zh: [
        "第7号订单可以送货",
        "第7号订单还不能送货",
        "第7号订单已取消",
        "第7号订单已付款",
      ],
    },
    [0, 100, 0, 0],
  ),
  pq(
    "PRAC-3",
    2,
    t(
      "A customer asks a question you cannot answer. What do you do?",
      "Pelanggan bertanya soalan yang anda tidak dapat jawab. Apakah tindakan anda?",
      "顾客问了一个你答不出的问题。你会怎么做？",
    ),
    {
      en: [
        "Guess an answer",
        "Change the topic",
        "Say you will check and reply by an agreed time",
        "Tell them to search online",
      ],
      ms: [
        "Teka jawapan",
        "Tukar topik",
        "Katakan anda akan menyemak dan membalas pada masa yang dipersetujui",
        "Suruh mereka mencari dalam talian",
      ],
      zh: [
        "随便猜一个答案",
        "转移话题",
        "说你会查清楚，并在约定时间回复",
        "叫他们自己上网查",
      ],
    },
    [0, 0, 100, 10],
  ),
  pq(
    "PRAC-4",
    3,
    t(
      "Your car breaks down on the way to a customer meeting. What is the best first step?",
      "Kereta anda rosak dalam perjalanan ke mesyuarat pelanggan. Apakah langkah pertama terbaik?",
      "你在去见客户的路上车坏了。最好的第一步是什么？",
    ),
    {
      en: [
        "Wait and hope the customer understands",
        "Tell the customer and offer a call now or a new time",
        "Cancel without explanation",
        "Ask a colleague to go without briefing them",
      ],
      ms: [
        "Tunggu dan harap pelanggan faham",
        "Maklumkan pelanggan dan tawarkan panggilan sekarang atau masa baharu",
        "Batalkan tanpa penjelasan",
        "Minta rakan pergi tanpa memberi taklimat",
      ],
      zh: [
        "等着，希望客户能理解",
        "通知客户，并提议现在通电话或改约时间",
        "不解释就取消",
        "让同事代替前往，但不交代情况",
      ],
    },
    [0, 100, 0, 10],
  ),
  pq(
    "PRAC-5",
    4,
    t(
      "At the start of a working day, which is MOST like you?",
      "Pada awal hari bekerja, yang manakah PALING menggambarkan anda?",
      "在一天工作开始时，以下哪一项最像你？",
    ),
    {
      en: [
        "I check messages and reply to whatever comes first",
        "I set my three priorities for the day",
        "I start with the tasks I enjoy most",
        "I ask my manager what to do first",
      ],
      ms: [
        "Saya menyemak mesej dan membalas yang mana sampai dahulu",
        "Saya menetapkan tiga keutamaan saya untuk hari itu",
        "Saya mulakan dengan tugas yang paling saya gemari",
        "Saya bertanya kepada pengurus apa yang perlu dibuat dahulu",
      ],
      zh: [
        "先看信息，谁先来就先回复谁",
        "定下当天的三个重点",
        "先做自己最喜欢的工作",
        "先问主管该做什么",
      ],
    },
    [40, 100, 30, 30],
  ),
  pq(
    "PRAC-6",
    5,
    t(
      "The chart shows your sales this week. Which day had the highest sales?",
      "Carta menunjukkan jualan anda minggu ini. Hari manakah jualan paling tinggi?",
      "图表显示你本周的销售额。哪一天的销售额最高？",
    ),
    {
      en: ["Monday", "Wednesday", "Thursday", "Friday"],
      ms: ["Isnin", "Rabu", "Khamis", "Jumaat"],
      zh: ["星期一", "星期三", "星期四", "星期五"],
    },
    [0, 0, 100, 0],
    {
      visual: {
        kind: "bar",
        title: t(
          "Sales this week (RM)",
          "Jualan minggu ini (RM)",
          "本周销售额（RM）",
        ),
        unit: "RM",
        categories: days,
        series: [
          {
            name: t("Sales", "Jualan", "销售额"),
            values: [1200, 900, 1500, 1800, 1600],
          },
        ],
      },
    },
  ),
];
