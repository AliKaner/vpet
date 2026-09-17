import { useMutation, useQuery } from "convex/react";
import { useState, type FormEvent } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { VisitCard } from "../components/social/VisitCard";
import { useNow } from "../hooks/useNow";

export function FriendsPage() {
  const inviteCode = useQuery(api.friends.getMyFriendInvite);
  const friendsPets = useQuery(api.social.listFriendsPets);
  const createFriendInvite = useMutation(api.friends.createFriendInvite);
  const acceptFriendInvite = useMutation(api.friends.acceptFriendInvite);
  const removeFriend = useMutation(api.friends.removeFriend);
  const now = useNow();

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleCreateInvite() {
    setBusy(true);
    setError(null);
    try {
      await createFriendInvite({});
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
      await acceptFriendInvite({ code });
      setCode("");
    } catch {
      setError("That invite code isn't valid.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(friendId: Id<"users">) {
    try {
      await removeFriend({ friendId });
    } catch {
      setError("Couldn't remove that friend right now.");
    }
  }

  return (
    <div className="flex flex-col gap-5 py-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-cocoa">Friends</h1>
        <p className="mt-1 text-sm text-cocoa-soft">Add friends and keep tabs on their pets - wave anytime.</p>
      </div>

      <div className="flex flex-col gap-2 rounded-cozy bg-white/70 p-4 shadow-sm">
        <p className="font-bold text-cocoa">Invite a friend</p>
        {inviteCode ? (
          <>
            <p className="text-xs text-cocoa-soft">Share this code with them:</p>
            <p className="font-display text-3xl font-extrabold tracking-widest text-peach-dark">{inviteCode}</p>
            <button
              type="button"
              onClick={() => void handleCreateInvite()}
              disabled={busy}
              className="self-start text-xs font-bold text-cocoa-soft underline disabled:opacity-50"
            >
              Generate a new code
            </button>
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
            Add
          </button>
        </div>
      </form>

      {error && <p className="text-sm font-semibold text-blossom-dark">{error}</p>}

      {friendsPets === undefined ? (
        <p className="py-6 text-center text-sm text-cocoa-soft">Loading...</p>
      ) : friendsPets.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center">
          <span className="text-4xl" aria-hidden>
            🏘️
          </span>
          <p className="text-sm text-cocoa-soft">No friends yet - share your code above to add one.</p>
        </div>
      ) : (
        friendsPets.map((friend) => (
          <div key={friend.friendId} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-cocoa-soft">{friend.friendName}</h2>
              <button
                type="button"
                onClick={() => void handleRemove(friend.friendId)}
                className="text-xs font-bold text-blossom-dark underline"
              >
                Remove
              </button>
            </div>
            {friend.pets.length === 0 ? (
              <p className="text-xs text-cocoa-soft">No pets right now.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {friend.pets.map((pet) => (
                  <VisitCard key={pet.petId} now={now} {...pet} />
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
