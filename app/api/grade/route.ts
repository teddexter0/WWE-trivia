import { NextResponse } from "next/server";

const STOP_WORDS = new Set(["a", "an", "the", "wwe", "and", "at", "by", "of", "vs"]);
const normalize = (value: string) => value
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/&/g, " and ")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const usefulTokens = (value: string) => normalize(value).split(" ").filter((token) => token && !STOP_WORDS.has(token));

function editDistance(a: string, b: string) {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let row = 1; row <= a.length; row += 1) {
    let diagonal = previous[0];
    previous[0] = row;
    for (let column = 1; column <= b.length; column += 1) {
      const above = previous[column];
      previous[column] = Math.min(
        previous[column] + 1,
        previous[column - 1] + 1,
        diagonal + (a[row - 1] === b[column - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return previous[b.length];
}

function similarity(a: string, b: string) {
  const left = new Set(usefulTokens(a));
  const right = new Set(usefulTokens(b));
  const matches = Array.from(left).filter((word) => right.has(word)).length;
  return matches / Math.max(left.size, right.size, 1);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const userAnswer = String(body.userAnswer ?? "").slice(0, 160);
  const canonicalAnswer = String(body.canonicalAnswer ?? "").slice(0, 160);
  if (!userAnswer || !canonicalAnswer) return NextResponse.json({ error: "Both answers are required." }, { status: 400 });

  const normalizedUser = normalize(userAnswer);
  const normalizedCanonical = normalize(canonicalAnswer);
  const characterScore = 1 - editDistance(normalizedUser, normalizedCanonical) / Math.max(normalizedUser.length, normalizedCanonical.length, 1);
  const userTokens = usefulTokens(userAnswer);
  const canonicalTokens = usefulTokens(canonicalAnswer);
  const meaningfulPartial = userTokens.length > 0 && canonicalTokens.length <= 2 && userTokens.some((token) => token.length >= 4 && canonicalTokens.includes(token));
  if (normalizedUser === normalizedCanonical || characterScore >= 0.82 || similarity(userAnswer, canonicalAnswer) >= 0.72 || meaningfulPartial) {
    return NextResponse.json({ correct: true, gradedBy: "local" });
  }

  const token = process.env.HUGGINGFACE_API_KEY;
  if (!token) return NextResponse.json({ correct: false, gradedBy: "local" });

  const model = process.env.HUGGINGFACE_MODEL || "Qwen/Qwen2.5-3B-Instruct";
  try {
    const response = await fetch(`https://router.huggingface.co/hf-inference/models/${model}/v1/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 3,
        messages: [{ role: "user", content: `WWE trivia grading. Is USER_ANSWER a correct match for CANONICAL_ANSWER? Reply ONLY correct or incorrect.\nUSER_ANSWER: ${userAnswer}\nCANONICAL_ANSWER: ${canonicalAnswer}` }],
      }),
    });
    if (!response.ok) throw new Error("Hugging Face unavailable");
    const data = await response.json();
    const verdict = String(data.choices?.[0]?.message?.content ?? "").trim().toLowerCase();
    return NextResponse.json({ correct: verdict.startsWith("correct"), gradedBy: "huggingface" });
  } catch {
    return NextResponse.json({ correct: false, gradedBy: "local", note: "AI fallback unavailable" });
  }
}
