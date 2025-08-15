import EmailDemo from "@/components/EmailDemo";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="rounded-xl border bg-white p-6">
        <h1 className="text-2xl font-semibold">AI Digital Assistant — Demo</h1>
        <p className="text-sm text-gray-600 mt-1">
          Cloud-generated UI via CDN • Vaulted session • Edge-streamed feel
        </p>
      </div>

      {/* Add the email demo below */}
      <EmailDemo />
    </main>
  );
}
