import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!message) {
      return Response.json({ error: "Missing message" }, { status: 400 });
    }

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
  } catch (err: unknown) {
    // Safe helpers to read optional fields without using `any`
    const status =
      typeof err === "object" &&
      err !== null &&
      "status" in err &&
      typeof (err as { status: unknown }).status === "number"
        ? (err as { status: number }).status
        : 500;

    const msg =
      err instanceof Error
        ? err.message
        : typeof err === "string"
        ? err
        : "Unknown error";

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

    return Response.json({ error: "Server error", detail: msg }, { status });
  }
}

export async function GET() {
  return Response.json({
    up: true,
    hasKey: Boolean(process.env.OPENAI_API_KEY),
  });
}
