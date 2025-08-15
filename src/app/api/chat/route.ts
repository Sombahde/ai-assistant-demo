import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!message) return Response.json({ error: "Missing message" }, { status: 400 });

    // Cheaper model suggestion once quota is back:
    const model = "gpt-4o-mini"; // low cost, good for demos

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: message },
      ],
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content ?? "(no reply)";
    return Response.json({ reply });
  } catch (err: any) {
    const status = err?.status ?? 500;
    // If OpenAI returns 429, surface a friendly message
    if (status === 429) {
      return Response.json(
        {
          error: "Server error",
          detail:
            "OpenAI quota exceeded for this API key. Add billing or switch to a key with credits, then retry.",
        },
        { status: 429 }
      );
    }
    return Response.json(
      { error: "Server error", detail: err?.message ?? String(err) },
      { status }
    );
  }
}

export async function GET() {
  return Response.json({
    up: true,
    hasKey: Boolean(process.env.OPENAI_API_KEY),
  });
}
