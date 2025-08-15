import StreamChat from "@/components/StreamChat";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow p-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          AI Digital Assistant — Demo
        </h1>
        <p className="text-sm text-gray-600 mt-2">
          Cloud-generated UI via CDN • Vaulted session • Edge-streamed feel
        </p>

        <div className="mt-6 grid gap-3 text-sm">
          <div className="rounded-lg border p-4">
            <div className="font-medium">Status</div>
            <div className="text-gray-600">Day 1: Deployed shell ready.</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="font-medium">Next Steps</div>
            <ul className="list-disc pl-5 text-gray-600">
              <li>Passkey (WebAuthn) login</li>
              <li>CDN-published UI schema</li>
              <li>“Go to my email” flow</li>
            </ul>
          </div>
        </div>
         <div className="mt-6">
             <StreamChat />
         </div>

        <Button className="mt-4">It Lives 🎉</Button>
      </div>
    </main>
  );
}
