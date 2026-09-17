import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { api } from "../../../convex/_generated/api";

export function PartnerChat() {
  const messages = useQuery(api.partners.getMyMessages);
  const sendMessage = useMutation(api.partners.sendMessage);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages?.length]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = text.trim();
    if (trimmed.length === 0) return;
    setSending(true);
    setText("");
    try {
      await sendMessage({ text: trimmed });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-cozy bg-white/70 p-4 shadow-sm">
      <p className="font-bold text-cocoa">Chat</p>
      <div className="flex max-h-64 min-h-[6rem] flex-col gap-1.5 overflow-y-auto rounded-xl bg-cream-dark/40 p-2">
        {messages === undefined ? (
          <p className="text-xs text-cocoa-soft">Loading...</p>
        ) : messages.length === 0 ? (
          <p className="text-xs text-cocoa-soft">Say hello!</p>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-sm ${
                message.isMine ? "self-end bg-peach text-white" : "self-start bg-white text-cocoa"
              }`}
            >
              {message.text}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          placeholder="Type a message..."
          className="flex-1 rounded-xl border border-cream-dark bg-white px-3 py-2 text-sm text-cocoa outline-none focus:border-peach"
        />
        <button
          type="submit"
          disabled={sending || text.trim().length === 0}
          className="rounded-xl bg-peach px-4 py-2 text-sm font-bold text-white transition hover:bg-peach-dark disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
