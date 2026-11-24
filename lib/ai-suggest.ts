/**
 * Prototype for checklist item 15 ("AI scoring of spoken replies: build a prototype to test differences").
 * This is a transparent keyword heuristic standing in for an AI model, so HR can compare a suggested
 * score with their own manual rubric score. No data leaves the browser. Replace with a real model later.
 */
const CUES: string[][] = [
  // Acknowledges the customer's concern
  ["sorry", "understand", "apolog", "frustrat", "faham", "maaf", "minta maaf", "明白", "抱歉", "对不起", "理解"],
  // Clarifies needs and verifies the facts
  ["?", "can i ask", "how many", "when", "check", "confirm", "boleh saya", "berapa", "bila", "semak", "请问", "多少", "什么时候", "确认"],
  // Offers an honest, feasible solution
  ["i will", "i'll", "arrange", "offer", "option", "replace", "saya akan", "boleh", "tawarkan", "我会", "安排", "可以"],
  // Agrees a clear follow-up
  ["call you", "by ", "today", "tomorrow", "follow up", "back to you", "hari ini", "esok", "hubungi", "今天", "明天", "回复", "联系"],
];
export function suggestRatings(transcript: string) {
  const text = (transcript ?? "").toLowerCase();
  const ratings = CUES.map((cues) => {
    const hits = cues.filter((c) => text.includes(c)).length;
    return Math.min(4, hits === 0 ? 0 : hits === 1 ? 2 : hits === 2 ? 3 : 4);
  });
  // Very short replies cannot show specific, clear content.
  const short = text.trim().split(/\s+/).length < 15 && text.length < 40;
  const final = short ? ratings.map((r) => Math.min(r, 2)) : ratings;
  return {
    ratings: final,
    score: Math.round((final.reduce((a, b) => a + b, 0) / 16) * 100),
    method: "keyword-prototype-v1",
  };
}
