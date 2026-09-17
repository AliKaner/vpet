import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

async function requireUserId(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new ConvexError("Not signed in");
  }
  return userId;
}

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I, easy to read aloud
function randomCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export const getMyPartnerStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const user = await ctx.db.get(userId);
    if (user?.partnerId === undefined) {
      const pendingInvite = await ctx.db
        .query("invites")
        .withIndex("by_creator", (q) => q.eq("createdBy", userId))
        .filter((q) => q.and(q.eq(q.field("usedBy"), undefined), q.neq(q.field("kind"), "friend")))
        .order("desc")
        .first();
      return { paired: false as const, inviteCode: pendingInvite?.code ?? null };
    }
    const partner = await ctx.db.get(user.partnerId);
    return { paired: true as const, partnerName: partner?.name ?? partner?.email ?? "your partner" };
  },
});

export const createInvite = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const user = await ctx.db.get(userId);
    if (user?.partnerId !== undefined) {
      throw new ConvexError("You already have a partner.");
    }

    const existing = await ctx.db
      .query("invites")
      .withIndex("by_creator", (q) => q.eq("createdBy", userId))
      .filter((q) => q.and(q.eq(q.field("usedBy"), undefined), q.neq(q.field("kind"), "friend")))
      .order("desc")
      .first();
    if (existing !== null) {
      return existing.code;
    }

    let code = randomCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const collision = await ctx.db
        .query("invites")
        .withIndex("by_code", (q) => q.eq("code", code))
        .unique();
      if (collision === null) break;
      code = randomCode();
    }

    await ctx.db.insert("invites", { code, createdBy: userId, createdAt: Date.now(), kind: "partner" });
    return code;
  },
});

export const acceptInvite = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const userId = await requireUserId(ctx);
    const user = await ctx.db.get(userId);
    if (user?.partnerId !== undefined) {
      throw new ConvexError("You already have a partner.");
    }

    const invite = await ctx.db
      .query("invites")
      .withIndex("by_code", (q) => q.eq("code", code.trim().toUpperCase()))
      .unique();
    if (invite === null || invite.usedBy !== undefined || invite.kind === "friend") {
      throw new ConvexError("That invite code isn't valid.");
    }
    if (invite.createdBy === userId) {
      throw new ConvexError("You can't accept your own invite.");
    }

    const inviter = await ctx.db.get(invite.createdBy);
    if (inviter?.partnerId !== undefined) {
      throw new ConvexError("That player already has a partner.");
    }

    await ctx.db.patch(invite._id, { usedBy: userId, usedAt: Date.now() });
    await ctx.db.patch(userId, { partnerId: invite.createdBy });
    await ctx.db.patch(invite.createdBy, { partnerId: userId });
  },
});

export const leavePartnership = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const user = await ctx.db.get(userId);
    if (user?.partnerId === undefined) {
      return;
    }
    await ctx.db.patch(userId, { partnerId: undefined });
    await ctx.db.patch(user.partnerId, { partnerId: undefined });
  },
});

function pairKeyFor(a: Id<"users">, b: Id<"users">): string {
  return [a, b].sort().join("_");
}

const MAX_MESSAGE_LENGTH = 500;

export const getMyMessages = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const user = await ctx.db.get(userId);
    if (user?.partnerId === undefined) {
      return [];
    }
    const pairKey = pairKeyFor(userId, user.partnerId);
    const messages = await ctx.db
      .query("partnerMessages")
      .withIndex("by_pair", (q) => q.eq("pairKey", pairKey))
      .order("asc")
      .take(200);
    return messages.map((message) => ({ ...message, isMine: message.senderId === userId }));
  },
});

export const sendMessage = mutation({
  args: { text: v.string() },
  handler: async (ctx, { text }) => {
    const userId = await requireUserId(ctx);
    const user = await ctx.db.get(userId);
    if (user?.partnerId === undefined) {
      throw new ConvexError("You don't have a partner to message yet.");
    }
    const trimmed = text.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (trimmed.length === 0) {
      return;
    }
    const pairKey = pairKeyFor(userId, user.partnerId);
    await ctx.db.insert("partnerMessages", { pairKey, senderId: userId, text: trimmed, createdAt: Date.now() });
  },
});
