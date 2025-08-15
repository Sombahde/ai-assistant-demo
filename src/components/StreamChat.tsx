"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export default function StreamChat() {
  const [input, setInput] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  async function send() {
    if (!input.trim()) return;
    setReply("");
    setLoading(true);

    // cancel any prior stream
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        setReply(prev => prev + decoder.decode(value, { stream: true }));
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";
      setReply(prev => `${prev}\n\n[client-error]: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  function stop() {
    controllerRef.current?.abort();
    setLoading(false);
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="font-medium">Streaming Chat (live tokens)</div>
      <div className="flex gap-2">
        <input
          className="w-full rounded-md border px-3 py-2"
          placeholder="Ask something to stream…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <Button onClick={send} disabled={loading}>Send</Button>
        <Button variant="secondary" onClick={stop} disabled={!loading}>Stop</Button>
      </div>
      <div className="rounded-md border p-3 text-sm whitespace-pre-wrap min-h-[4rem]">
        {reply || (loading ? "…" : "Response will appear here")}
      </div>
    </div>
  );
}
