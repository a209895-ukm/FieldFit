import type { Question, Visual } from "./assessment";
const t = (en: string, ms: string, zh: string) => ({ en, ms, zh });
const q = (
  id: string,
  cap: number,
  p: string[],
  o: string[][],
  points: number[],
  explanation: string,
  extra: { rev?: number; visual?: Visual } = {},
): Question => ({
  id,
  cap,
  prompt: { en: p[0], ms: p[1], zh: p[2] },
  options: { en: o[0], ms: o[1], zh: o[2] },
  points,
  explanation,
  enabled: true,
  ...extra,
});
const weeks = {
  en: ["Week 1", "Week 2", "Week 3", "Week 4"],
  ms: ["Minggu 1", "Minggu 2", "Minggu 3", "Minggu 4"],
  zh: ["第1周", "第2周", "第3周", "第4周"],
};
const regions = {
  en: ["North", "South", "East", "West"],
  ms: ["Utara", "Selatan", "Timur", "Barat"],
  zh: ["北区", "南区", "东区", "西区"],
};
export const QUESTIONS: Question[] = [
  q(
    "NUM-01",
    0,
    [
      "A customer buys an RM 250 product with a 12% discount. What is the final price?",
      "Pelanggan membeli produk RM 250 dengan diskaun 12%. Berapakah harga akhir?",
      "顾客购买售价 RM 250 的产品，享有12%的折扣。最终价格是多少？",
    ],
    [
      ["RM 220", "RM 230", "RM 238", "RM 280"],
      ["RM 220", "RM 230", "RM 238", "RM 280"],
      ["RM 220", "RM 230", "RM 238", "RM 280"],
    ],
    [100, 0, 0, 0],
    "250 × 0.88 = RM 220.",
  ),
  q(
    "NUM-02",
    0,
    [
      "You earn 3% commission on RM 8,000 sales. What is your commission?",
      "Anda menerima komisen 3% daripada jualan RM 8,000. Berapakah komisen anda?",
      "销售额为 RM 8,000，佣金为3%。你能获得多少佣金？",
    ],
    [
      ["RM 24", "RM 240", "RM 800", "RM 2,400"],
      ["RM 24", "RM 240", "RM 800", "RM 2,400"],
      ["RM 24", "RM 240", "RM 800", "RM 2,400"],
    ],
    [0, 100, 0, 0],
    "8,000 × 0.03 = RM 240.",
  ),
  q(
    "NUM-03",
    0,
    [
      "The chart shows your weekly sales. By what percentage did sales rise from Week 1 to Week 4?",
      "Carta menunjukkan jualan mingguan anda. Berapakah peratus peningkatan jualan dari Minggu 1 ke Minggu 4?",
      "图表显示你的每周销售额。从第1周到第4周，销售额增长了百分之几？",
    ],
    [
      ["20%", "25%", "50%", "10%"],
      ["20%", "25%", "50%", "10%"],
      ["20%", "25%", "50%", "10%"],
    ],
    [0, 100, 0, 0],
    "Week 1 RM 4,000 → Week 4 RM 5,000: 1,000 ÷ 4,000 × 100 = 25%.",
    {
      rev: 2,
      visual: {
        kind: "bar",
        title: t(
          "Weekly sales (RM)",
          "Jualan mingguan (RM)",
          "每周销售额（RM）",
        ),
        unit: "RM",
        categories: weeks,
        series: [
          {
            name: t("Sales", "Jualan", "销售额"),
            values: [4000, 4300, 4600, 5000],
          },
        ],
      },
    },
  ),
  q(
    "LOG-01",
    1,
    [
      "All priority leads have verified contact details. Lead A has no verified contact details. What follows?",
      "Semua prospek keutamaan mempunyai butiran hubungan yang disahkan. Butiran prospek A belum disahkan. Apakah kesimpulannya?",
      "所有优先销售线索都有已验证的联系方式。线索A没有已验证的联系方式。可得出什么结论？",
    ],
    [
      [
        "A is a priority lead",
        "A is not a priority lead",
        "A will never buy",
        "A has been contacted",
      ],
      [
        "A ialah prospek keutamaan",
        "A bukan prospek keutamaan",
        "A tidak akan membeli",
        "A telah dihubungi",
      ],
      ["A是优先线索", "A不是优先线索", "A永远不会购买", "A已被联系"],
    ],
    [0, 100, 0, 0],
    "A does not meet the necessary condition for priority status.",
  ),
  q(
    "LOG-02",
    1,
    [
      "Visits follow this rule: call before visiting; verify stock before calling. What is the correct order?",
      "Peraturan lawatan: telefon sebelum melawat; semak stok sebelum menelefon. Apakah urutan yang betul?",
      "拜访规则：先打电话再拜访；先核实库存再打电话。正确的顺序是什么？",
    ],
    [
      [
        "Visit → call → stock",
        "Call → stock → visit",
        "Stock → call → visit",
        "Stock → visit → call",
      ],
      [
        "Lawat → telefon → stok",
        "Telefon → stok → lawat",
        "Stok → telefon → lawat",
        "Stok → lawat → telefon",
      ],
      [
        "拜访 → 电话 → 库存",
        "电话 → 库存 → 拜访",
        "库存 → 电话 → 拜访",
        "库存 → 拜访 → 电话",
      ],
    ],
    [0, 0, 100, 0],
    "Both prerequisites must be satisfied in order.",
  ),
  q(
    "LOG-03",
    1,
    [
      "The daily follow-up targets are 4, 8, 12, 16. If the pattern continues, what is next?",
      "Sasaran susulan harian ialah 4, 8, 12, 16. Jika pola diteruskan, apakah nombor seterusnya?",
      "每日跟进目标为4、8、12、16。按照这个规律，下一个数字是什么？",
    ],
    [
      ["18", "20", "24", "32"],
      ["18", "20", "24", "32"],
      ["18", "20", "24", "32"],
    ],
    [0, 100, 0, 0],
    "The target increases by four each day.",
  ),
  q(
    "SJT-01",
    2,
    [
      "A customer says your price is 10% higher than a competitor’s. What do you do first?",
      "Pelanggan berkata harga anda 10% lebih tinggi daripada pesaing. Apakah tindakan pertama anda?",
      "顾客说你的价格比竞争对手高10%。你首先会怎么做？",
    ],
    [
      [
        "Promise an unapproved discount",
        "Ask which offer they are comparing and what matters most",
        "Say the competitor is unreliable",
        "Repeat the product features",
      ],
      [
        "Janjikan diskaun tanpa kelulusan",
        "Tanya tawaran yang dibandingkan dan keutamaan pelanggan",
        "Katakan pesaing tidak boleh dipercayai",
        "Ulang ciri produk",
      ],
      [
        "承诺未经批准的折扣",
        "询问对比的报价及顾客最重视的需求",
        "说竞争对手不可靠",
        "重复介绍产品特点",
      ],
    ],
    [0, 100, 0, 30],
    "Clarify needs and like-for-like terms before proposing a solution.",
  ),
  q(
    "SJT-02",
    2,
    [
      "A customer is upset about a delayed delivery. What is the best first response?",
      "Pelanggan marah kerana penghantaran lewat. Apakah respons awal yang terbaik?",
      "顾客因延迟交货而生气。最佳的第一步回应是什么？",
    ],
    [
      [
        "Blame logistics",
        "Promise delivery today without checking",
        "Acknowledge the impact, check the order and agree a follow-up time",
        "Avoid the call",
      ],
      [
        "Salahkan logistik",
        "Janji hantar hari ini tanpa semakan",
        "Akui kesannya, semak pesanan dan tetapkan masa susulan",
        "Elakkan panggilan",
      ],
      [
        "责怪物流部门",
        "未经核实便承诺今天送达",
        "承认造成的影响，核实订单并约定跟进时间",
        "回避电话",
      ],
    ],
    [0, 20, 100, 0],
    "Ownership, verification and a realistic next step protect trust.",
  ),
  q(
    "SJT-03",
    2,
    [
      "A customer asks you to hide a fee in the quotation. What do you do?",
      "Pelanggan meminta anda menyembunyikan fi dalam sebut harga. Apakah tindakan anda?",
      "顾客要求你在报价中隐瞒一项费用。你会怎么做？",
    ],
    [
      [
        "Hide it to close the deal",
        "Explain all fees clearly and offer approved alternatives",
        "Ask a colleague to hide it",
        "Ignore the fee question",
      ],
      [
        "Sembunyikan untuk menutup jualan",
        "Terangkan semua fi dan tawarkan alternatif yang diluluskan",
        "Minta rakan menyembunyikannya",
        "Abaikan soalan fi",
      ],
      [
        "为成交而隐瞒",
        "明确解释全部费用，并提供获批的替代方案",
        "让同事隐瞒",
        "忽略费用问题",
      ],
    ],
    [0, 100, 0, 0],
    "Transparent pricing supports an informed customer decision.",
  ),
  q(
    "PRO-01",
    3,
    [
      "You have two hours and three customer visits. One urgent customer is 90 minutes away. What should you do first?",
      "Anda mempunyai dua jam untuk tiga lawatan. Seorang pelanggan yang mendesak berada 90 minit perjalanan. Apakah langkah pertama?",
      "你有两小时安排三次客户拜访。一位急需帮助的顾客距离你90分钟。你首先会怎么做？",
    ],
    [
      [
        "Drive immediately",
        "Confirm urgency and explore a call or nearby colleague",
        "Cancel every visit",
        "Promise to reach everyone",
      ],
      [
        "Terus memandu",
        "Sahkan keperluan segera dan cuba panggilan atau bantuan rakan berdekatan",
        "Batalkan semua lawatan",
        "Janji bertemu semua pelanggan",
      ],
      [
        "立即开车过去",
        "确认紧急程度，考虑电话或附近同事协助",
        "取消所有拜访",
        "承诺拜访所有客户",
      ],
    ],
    [20, 100, 0, 0],
    "Gather the missing constraints before committing travel time.",
  ),
  q(
    "PRO-02",
    3,
    [
      "A popular product is out of stock and your customer needs it tomorrow. What is the best next step?",
      "Produk popular kehabisan stok dan pelanggan memerlukannya esok. Apakah langkah terbaik?",
      "热销产品缺货，顾客明天就需要。最佳下一步是什么？",
    ],
    [
      [
        "Promise stock will arrive",
        "Check alternative stock locations and acceptable substitutes",
        "Ask the customer to wait indefinitely",
        "Close the order as delivered",
      ],
      [
        "Janji stok akan tiba",
        "Semak stok lokasi lain dan pengganti yang boleh diterima",
        "Minta pelanggan menunggu tanpa tempoh",
        "Tandakan pesanan telah dihantar",
      ],
      [
        "承诺库存会到",
        "核查其他地点库存及可接受的替代品",
        "让顾客无限期等待",
        "将订单标记为已交付",
      ],
    ],
    [0, 100, 0, 0],
    "Test feasible alternatives and communicate verified options.",
  ),
  q(
    "PRO-03",
    3,
    [
      "Conversion dropped this week. Which first step best helps find the cause?",
      "Kadar penukaran menurun minggu ini. Langkah awal manakah paling membantu mencari punca?",
      "本周转化率下降。哪一个初步行动最有助于找出原因？",
    ],
    [
      [
        "Double all discounts",
        "Compare lead sources, funnel stages and sample sizes",
        "Replace the whole sales team",
        "Assume demand has disappeared",
      ],
      [
        "Gandakan semua diskaun",
        "Banding sumber prospek, peringkat corong dan saiz sampel",
        "Ganti seluruh pasukan",
        "Anggap permintaan telah hilang",
      ],
      [
        "把所有折扣翻倍",
        "比较线索来源、漏斗阶段和样本量",
        "更换整个销售团队",
        "假设需求已经消失",
      ],
    ],
    [0, 100, 0, 0],
    "Segment the evidence before choosing an intervention.",
  ),
  q(
    "SELF-01",
    4,
    [
      "You are behind target and working on your own. Which is MOST like you?",
      "Anda ketinggalan sasaran dan bekerja sendiri. Yang manakah PALING menggambarkan anda?",
      "你落后于目标，并且独立工作。以下哪一项最像你？",
    ],
    [
      [
        "I ask my manager where I should focus",
        "I review my pipeline and set my own daily targets until I catch up",
        "I ask experienced teammates how they would handle it",
        "I focus on giving excellent service to my existing customers",
      ],
      [
        "Saya bertanya kepada pengurus di mana saya patut fokus",
        "Saya menyemak saluran jualan dan menetapkan sasaran harian sendiri sehingga saya mengejar sasaran",
        "Saya bertanya kepada rakan sepasukan yang berpengalaman cara mereka mengendalikannya",
        "Saya fokus memberikan perkhidmatan terbaik kepada pelanggan sedia ada",
      ],
      [
        "我会问主管应该把重点放在哪里",
        "我会检查销售管道，自己设定每日目标，直到追上进度",
        "我会请教有经验的同事会如何处理",
        "我会专注于为现有客户提供优质服务",
      ],
    ],
    [20, 100, 40, 30],
    "Forced choice: all four are reasonable; only one shows self-directed recovery. Self-report only: probe for an actual example of planning and follow-through.",
    { rev: 2 },
  ),
  q(
    "SELF-02",
    4,
    [
      "A sales approach keeps failing. Which is MOST like you?",
      "Satu pendekatan jualan terus gagal. Yang manakah PALING menggambarkan anda?",
      "某种销售方式一直不奏效。以下哪一项最像你？",
    ],
    [
      [
        "I keep going, because persistence usually pays off",
        "I wait for the next training session to learn a new approach",
        "I change one thing at a time and track whether results improve",
        "I ask my manager to suggest a different approach",
      ],
      [
        "Saya teruskan kerana kegigihan biasanya membuahkan hasil",
        "Saya menunggu sesi latihan seterusnya untuk mempelajari pendekatan baharu",
        "Saya mengubah satu perkara pada satu masa dan memantau sama ada hasilnya bertambah baik",
        "Saya meminta pengurus mencadangkan pendekatan lain",
      ],
      [
        "我会坚持下去，因为坚持通常会有回报",
        "我会等下一次培训，学习新的方法",
        "我每次只改变一个做法，并跟踪结果是否改善",
        "我会请主管建议其他方法",
      ],
    ],
    [30, 20, 100, 40],
    "Forced choice: all four are reasonable; only one shows self-directed learning. Self-report only: look for evidence of an observable change.",
    { rev: 2 },
  ),
  q(
    "SELF-03",
    4,
    [
      "You have promised a customer a follow-up. Which is MOST like you?",
      "Anda telah berjanji membuat susulan dengan pelanggan. Yang manakah PALING menggambarkan anda?",
      "你已答应跟进一位顾客。以下哪一项最像你？",
    ],
    [
      [
        "I follow up when I think the customer is likely to be free",
        "I note a due date in my own tracker and check it every day",
        "I rely on the reminders the company system sends me",
        "I tell my manager so the follow-up is not forgotten",
      ],
      [
        "Saya membuat susulan apabila saya rasa pelanggan mungkin lapang",
        "Saya mencatat tarikh akhir dalam penjejak sendiri dan menyemaknya setiap hari",
        "Saya bergantung pada peringatan daripada sistem syarikat",
        "Saya memaklumkan pengurus supaya susulan tidak dilupakan",
      ],
      [
        "我会在觉得顾客可能有空时跟进",
        "我会在自己的跟踪表中记下截止日期，并每天检查",
        "我依靠公司系统发送的提醒",
        "我会告诉主管，以免忘记跟进",
      ],
    ],
    [30, 100, 40, 20],
    "Forced choice: all four are reasonable; only one shows self-managed tracking. Self-report only: validate how the candidate tracks commitments.",
    { rev: 2 },
  ),
  q(
    "DIG-01",
    5,
    [
      "The chart shows leads and sales by region this month. Which region has the highest conversion rate (sales ÷ leads)?",
      "Carta menunjukkan prospek dan jualan mengikut wilayah bulan ini. Wilayah manakah mempunyai kadar penukaran tertinggi (jualan ÷ prospek)?",
      "图表显示本月各地区的线索和成交数量。哪个地区的转化率（成交 ÷ 线索）最高？",
    ],
    [regions.en, regions.ms, regions.zh],
    [0, 0, 100, 0],
    "North 5/20 = 25%; South 8/40 = 20%; East 9/30 = 30%; West 5/25 = 20%. The region with the most sales is not the best converter.",
    {
      rev: 2,
      visual: {
        kind: "bar",
        title: t(
          "Leads and sales by region",
          "Prospek dan jualan mengikut wilayah",
          "各地区线索与成交",
        ),
        categories: regions,
        series: [
          { name: t("Leads", "Prospek", "线索"), values: [20, 40, 30, 25] },
          { name: t("Sales", "Jualan", "成交"), values: [5, 8, 9, 5] },
        ],
      },
    },
  ),
  q(
    "DIG-02",
    5,
    [
      "A CRM shows the same customer twice, with different phone numbers. What should you do first?",
      "CRM menunjukkan pelanggan sama dua kali dengan nombor telefon berlainan. Apakah tindakan pertama?",
      "CRM中同一位顾客出现两次，电话号码不同。你首先会怎么做？",
    ],
    [
      [
        "Delete both records",
        "Verify the details and follow the duplicate-merge process",
        "Call both numbers repeatedly",
        "Ignore the duplicate",
      ],
      [
        "Padam kedua-duanya",
        "Sahkan butiran dan ikut proses gabung rekod pendua",
        "Telefon kedua-dua nombor berulang kali",
        "Abaikan rekod pendua",
      ],
      [
        "删除两条记录",
        "核实信息并按流程合并重复记录",
        "反复拨打两个号码",
        "忽略重复记录",
      ],
    ],
    [0, 100, 0, 20],
    "Verify accuracy before changing customer records.",
  ),
  q(
    "DIG-03",
    5,
    [
      "Team rule: clear follow-ups that are more than 7 days overdue first, starting with the highest deal value. Using the dashboard, who do you call first?",
      "Peraturan pasukan: selesaikan dahulu susulan yang lewat lebih daripada 7 hari, bermula dengan nilai urusan tertinggi. Berdasarkan papan pemuka, siapakah yang anda hubungi dahulu?",
      "团队规则：优先处理逾期超过7天的跟进，并从交易金额最高的开始。根据仪表板，你应该先联系谁？",
    ],
    [
      [
        "Syarikat Mutiara",
        "Mini Mart Lee",
        "Kedai Ah Seng",
        "Bina Jaya Hardware",
      ],
      [
        "Syarikat Mutiara",
        "Mini Mart Lee",
        "Kedai Ah Seng",
        "Bina Jaya Hardware",
      ],
      [
        "Syarikat Mutiara",
        "Mini Mart Lee",
        "Kedai Ah Seng",
        "Bina Jaya Hardware",
      ],
    ],
    [0, 20, 30, 100],
    "Over 7 days overdue: Kedai Ah Seng (RM 12,000), Mini Mart Lee (RM 1,500), Bina Jaya Hardware (RM 20,000). Bina Jaya has the highest value. Syarikat Mutiara is the biggest deal but only 2 days overdue.",
    {
      rev: 2,
      visual: {
        kind: "dashboard",
        title: t(
          "My follow-ups today",
          "Susulan saya hari ini",
          "我今天的跟进",
        ),
        tiles: [
          { label: t("Overdue", "Lewat", "已逾期"), value: "12" },
          { label: t("New leads", "Prospek baharu", "新线索"), value: "4" },
          { label: t("Meetings", "Mesyuarat", "会面"), value: "3" },
        ],
        columns: {
          en: ["Customer", "Days overdue", "Deal value"],
          ms: ["Pelanggan", "Hari lewat", "Nilai urusan"],
          zh: ["客户", "逾期天数", "交易金额"],
        },
        rows: (() => {
          const rows = [
            ["Syarikat Mutiara", "2", "RM 45,000"],
            ["Kedai Ah Seng", "9", "RM 12,000"],
            ["Mini Mart Lee", "14", "RM 1,500"],
            ["Bina Jaya Hardware", "8", "RM 20,000"],
          ];
          return { en: rows, ms: rows, zh: rows };
        })(),
      },
    },
  ),
];
