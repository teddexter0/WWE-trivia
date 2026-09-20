import { NextResponse } from "next/server";

const normalize = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

function similarity(a: string, b: string) {
  const left = new Set(normalize(a).split(" ").filter(Boolean));
  const right = new Set(normalize(b).split(" ").filter(Boolean));
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
  if (normalizedUser === normalizedCanonical || normalizedCanonical.includes(normalizedUser) || similarity(userAnswer, canonicalAnswer) >= 0.66) {
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
