import { useMutation, useQuery } from "convex/react";
import { useState, type FormEvent } from "react";
import { api } from "../../convex/_generated/api";
import { PartnerChat } from "../components/social/PartnerChat";

export function PartnerPage() {
  const status = useQuery(api.partners.getMyPartnerStatus);
  const createInvite = useMutation(api.partners.createInvite);
  const acceptInvite = useMutation(api.partners.acceptInvite);
  const leavePartnership = useMutation(api.partners.leavePartnership);

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleCreateInvite() {
    setBusy(true);
    setError(null);
    try {
      await createInvite({});
    } catch {
      setError("Couldn't create an invite right now.");
    } finally {
      setBusy(false);
    }
  }

  async function handleAccept(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await acceptInvite({ code });
      setCode("");
    } catch {
      setError("That invite code isn't valid.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLeave() {
    setBusy(true);
    setError(null);
    try {
      await leavePartnership({});
    } catch {
      setError("Couldn't leave the partnership right now.");
    } finally {
      setBusy(false);
    }
  }

  if (status === undefined) {
    return <p className="py-10 text-center text-sm text-cocoa-soft">Loading...</p>;
  }

  return (
    <div className="flex flex-col gap-5 py-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-cocoa">Raise a pet together</h1>
        <p className="mt-1 text-sm text-cocoa-soft">
          Pair up with someone: your pets show up side by side and you can both feed, pet, and clean either one.
        </p>
      </div>

      {status.paired ? (
        <div className="flex flex-col gap-3 rounded-cozy bg-white/70 p-4 shadow-sm">
          <p className="font-bold text-cocoa">
            {"\u{1F91D}"} You're paired with {status.partnerName}.
          </p>
          <button
            type="button"
            onClick={() => void handleLeave()}
            disabled={busy}
            className="self-start rounded-xl border border-blossom px-3 py-1.5 text-sm font-bold text-blossom-dark transition hover:bg-blossom/10 disabled:opacity-50"
          >
            Leave partnership
          </button>
          <PartnerChat />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 rounded-cozy bg-white/70 p-4 shadow-sm">
            <p className="font-bold text-cocoa">Invite someone</p>
            {status.inviteCode ? (
              <>
                <p className="text-xs text-cocoa-soft">Share this code with them:</p>
                <p className="font-display text-3xl font-extrabold tracking-widest text-peach-dark">
                  {status.inviteCode}
                </p>
              </>
            ) : (
              <button
                type="button"
                onClick={() => void handleCreateInvite()}
                disabled={busy}
                className="self-start rounded-xl bg-peach px-3 py-1.5 text-sm font-bold text-white transition hover:bg-peach-dark disabled:opacity-50"
              >
                Create invite code
              </button>
            )}
          </div>

          <form onSubmit={handleAccept} className="flex flex-col gap-2 rounded-cozy bg-white/70 p-4 shadow-sm">
            <p className="font-bold text-cocoa">Have a code?</p>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="ABC123"
                className="flex-1 rounded-xl border border-cream-dark bg-white px-3 py-2 font-display text-lg tracking-widest text-cocoa outline-none focus:border-peach"
              />
              <button
                type="submit"
                disabled={busy || code.trim().length === 0}
                className="rounded-xl bg-peach px-4 py-2 text-sm font-bold text-white transition hover:bg-peach-dark disabled:opacity-50"
              >
                Join
              </button>
            </div>
          </form>
        </div>
      )}
      {error && <p className="text-sm font-semibold text-blossom-dark">{error}</p>}
    </div>
  );
}
