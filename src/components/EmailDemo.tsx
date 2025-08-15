"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Email = {
  id: string;
  from: string;
  subject: string;
  preview: string;
  body: string;
  receivedAt: string; // ISO string
};

type Analysis = {
  status: "idle" | "loading" | "done" | "error";
  summary?: string;
  phishingRisk?: "low" | "medium" | "high";
  reason?: string;
  error?: string;
};

// --- Demo inbox data (static, hydration-safe times) -------------------------
const DEMO_INBOX: Email[] = [
  {
    id: "1",
    from: "account-security@contoso.com",
    subject: "Important: Action required on your account",
    preview:
      "We noticed unusual sign-in activity. Please confirm your account info…",
    body:
      "Dear user,\n\nWe detected unusual sign-in activity from a new device. " +
      "To keep your account safe, please confirm your identity by reviewing your account information at the secure link below. " +
      "Failure to do so may result in limited access.\n\nVerify now: https://contoso-security.example/verify\n\nThank you,\nAccount Security Team",
    receivedAt: "2025-08-15T16:00:00Z",
  },
  {
    id: "2",
    from: "events@kissuxtalks.com",
    subject: "You’re invited: Design Systems Roundtable",
    preview:
      "Join us on Friday for a live, 30-minute roundtable with Q&A. RSVP inside.",
    body:
      "Hi Sam,\n\nWe’re hosting a 30-minute Design Systems Roundtable this Friday with live Q&A. " +
      "We’d love to have you join. No downloads required—just RSVP and we’ll send a calendar hold.\n\nBest,\nKISS UX Talks",
    receivedAt: "2025-08-15T12:00:00Z",
  },
  {
    id: "3",
    from: "shipping@faster-ship.example",
    subject: "Package on hold — pay $1 to release",
    preview: "Your package is waiting. Pay the small fee to release delivery.",
    body:
      "Your package is pending delivery. Pay a $1 processing fee to release it. " +
      "Use this payment link: http://fast-ship-pay.example/link\n\nThank you.",
    receivedAt: "2025-08-14T15:00:00Z",
  },
];

// --- helpers ---------------------------------------------------------------
async function callOpenAI(message: string): Promise<string> {
  // Uses your existing /api/chat endpoint (non-streaming)
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  const data = (await res.json()) as { reply?: string; error?: string };
  if (data.error) throw new Error(data.error);
  return data.reply ?? "";
}

// A concise prompt that does BOTH: summarize + phishing risk label.
function buildAnalysisPrompt(email: Email) {
  return `
You are a security-savvy assistant.
Given this email, first provide a 1-2 sentence summary for a busy user.
Then classify phishing_risk as one of: low, medium, high.
If medium or high, add a short reason.

Return strict JSON with keys:
{
  "summary": string,
  "phishing_risk": "low" | "medium" | "high",
  "reason": string // optional, only if risk is medium/high
}

Email metadata:
- From: ${email.from}
- Subject: ${email.subject}
- Received At: ${email.receivedAt}

Email body:
"""${email.body}"""
`.trim();
}

function riskColor(risk?: "low" | "medium" | "high") {
  switch (risk) {
    case "low":
      return "bg-green-100 text-green-700 border-green-300";
    case "medium":
      return "bg-amber-100 text-amber-800 border-amber-300";
    case "high":
      return "bg-red-100 text-red-700 border-red-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
}

export default function EmailDemo() {
  const [selected, setSelected] = useState<Email | null>(DEMO_INBOX[0]);
  const [analysis, setAnalysis] = useState<Record<string, Analysis>>({});

  const current = selected ? analysis[selected.id] : undefined;

  async function analyzeSelected() {
    if (!selected) return;
    setAnalysis((m) => ({
      ...m,
      [selected.id]: { status: "loading" },
    }));
    try {
      const prompt = buildAnalysisPrompt(selected);
      const reply = await callOpenAI(prompt);

      // Try to parse the JSON the model returns; if it fails, fall back to plain text.
      let parsed:
        | { summary?: string; phishing_risk?: "low" | "medium" | "high"; reason?: string }
        | null = null;
      try {
        parsed = JSON.parse(reply);
      } catch {
        parsed = null;
      }

      if (parsed?.summary) {
        setAnalysis((m) => ({
          ...m,
          [selected.id]: {
            status: "done",
            summary: parsed!.summary,
            phishingRisk: parsed!.phishing_risk,
            reason: parsed!.reason,
          },
        }));
      } else {
        // fallback: treat the whole reply as the summary
        setAnalysis((m) => ({
          ...m,
          [selected.id]: {
            status: "done",
            summary: reply,
            phishingRisk: "low",
          },
        }));
      }
    } catch (err: any) {
      setAnalysis((m) => ({
        ...m,
        [selected!.id]: {
          status: "error",
          error: err?.message || String(err),
        },
      }));
    }
  }

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Inbox list */}
      <div className="lg:col-span-1 rounded-xl border bg-white">
        <div className="p-4 border-b font-semibold">Inbox (demo)</div>
        <div className="divide-y max-h-[28rem] overflow-auto">
          {DEMO_INBOX.map((email) => {
            const isActive = selected?.id === email.id;
            return (
              <button
                key={email.id}
                onClick={() => setSelected(email)}
                className={`w-full text-left p-4 hover:bg-gray-50 ${
                  isActive ? "bg-gray-50" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium truncate">{email.subject}</div>
                  <div className="text-xs text-gray-500">
                    {/* prevent hydration warning if locale renders differently client-side */}
                    <span suppressHydrationWarning>
                      {new Date(email.receivedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-600 truncate">{email.from}</div>
                <div className="text-sm text-gray-700 mt-1 line-clamp-2">{email.preview}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reading pane */}
      <div className="lg:col-span-2 rounded-xl border bg-white">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="min-w-0">
            <div className="font-semibold truncate">{selected?.subject || "No message"}</div>
            <div className="text-sm text-gray-600 truncate">{selected?.from}</div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="secondary"
              onClick={() =>
                selected && window.alert("Pretend: opened in native email client.")
              }
            >
              Open
            </Button>
            <Button
              onClick={analyzeSelected}
              disabled={!selected || analysis[selected.id]?.status === "loading"}
            >
              {analysis[selected?.id || ""]?.status === "loading" ? "Analyzing…" : "Analyze"}
            </Button>
          </div>
        </div>

        <div className="p-4 grid gap-4 md:grid-cols-5">
          {/* Message body */}
          <div className="md:col-span-3">
            <div className="text-sm whitespace-pre-wrap leading-relaxed">
              {selected?.body || "Select an email to view its content."}
            </div>
          </div>

          {/* AI panel */}
          <div className="md:col-span-2">
            <div className="rounded-lg border p-3">
              <div className="font-medium mb-2">AI Assistant</div>

              {/* Risk pill */}
              <div
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${riskColor(
                  current?.phishingRisk
                )}`}
                title={current?.reason || ""}
              >
                Risk: {current?.phishingRisk ?? "—"}
              </div>

              {/* Summary / states */}
              <div className="mt-3 text-sm text-gray-800">
                {current?.status === "loading" && (
                  <div className="animate-pulse text-gray-600">Analyzing message…</div>
                )}
                {current?.status === "error" && (
                  <div className="text-red-600">
                    Couldn’t analyze this email.
                    <div className="text-xs mt-1">{current.error}</div>
                  </div>
                )}
                {current?.status !== "loading" && current?.summary && (
                  <div>
                    <div className="font-medium mb-1">Summary</div>
                    <div>{current.summary}</div>
                    {current.reason && (
                      <div className="mt-2 text-xs text-red-700">
                        <span className="font-semibold">Reason:</span> {current.reason}
                      </div>
                    )}
                  </div>
                )}
                {!current && (
                  <div className="text-gray-600">
                    Click <span className="font-medium">Analyze</span> to get a summary and phishing check.
                  </div>
                )}
              </div>

              {/* Safety tips block (static copy for demo) */}
              <div className="mt-4 rounded-md bg-gray-50 p-3 text-xs text-gray-700">
                <div className="font-semibold mb-1">Safety checks in a real app:</div>
                <ul className="list-disc pl-4 space-y-1">
                  <li>DKIM/SPF/DMARC reputation</li>
                  <li>Domain mismatch & link preview</li>
                  <li>Urgency & social-engineering cues</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
