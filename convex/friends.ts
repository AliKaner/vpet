import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";

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

// Non-exclusive: unlike partner invites, you can add as many friends as you like.
// Reuses the same `invites` table as partner invites, distinguished by `kind`.
export const getMyFriendInvite = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const pendingInvite = await ctx.db
      .query("invites")
      .withIndex("by_creator", (q) => q.eq("createdBy", userId))
      .filter((q) => q.and(q.eq(q.field("usedBy"), undefined), q.eq(q.field("kind"), "friend")))
      .order("desc")
      .first();
    return pendingInvite?.code ?? null;
  },
});

export const createFriendInvite = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);

    const existing = await ctx.db
      .query("invites")
      .withIndex("by_creator", (q) => q.eq("createdBy", userId))
      .filter((q) => q.and(q.eq(q.field("usedBy"), undefined), q.eq(q.field("kind"), "friend")))
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

    await ctx.db.insert("invites", { code, createdBy: userId, createdAt: Date.now(), kind: "friend" });
    return code;
  },
});

export const acceptFriendInvite = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const userId = await requireUserId(ctx);

    const invite = await ctx.db
      .query("invites")
      .withIndex("by_code", (q) => q.eq("code", code.trim().toUpperCase()))
      .unique();
    if (invite === null || invite.usedBy !== undefined || invite.kind !== "friend") {
      throw new ConvexError("That invite code isn't valid.");
    }
    if (invite.createdBy === userId) {
      throw new ConvexError("You can't accept your own invite.");
    }

    const alreadyFriends = await ctx.db
      .query("friendships")
      .withIndex("by_owner_friend", (q) => q.eq("ownerId", userId).eq("friendId", invite.createdBy))
      .unique();
    if (alreadyFriends !== null) {
      throw new ConvexError("You're already friends.");
    }

    await ctx.db.patch(invite._id, { usedBy: userId, usedAt: Date.now() });
    const now = Date.now();
    await ctx.db.insert("friendships", { ownerId: userId, friendId: invite.createdBy, createdAt: now });
    await ctx.db.insert("friendships", { ownerId: invite.createdBy, friendId: userId, createdAt: now });
  },
});

export const getMyFriends = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const rows = await ctx.db
      .query("friendships")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();

    return Promise.all(
      rows.map(async (row) => {
        const friend = await ctx.db.get(row.friendId);
        return { friendId: row.friendId, name: friend?.name ?? friend?.email ?? "A friend" };
      }),
    );
  },
});

export const removeFriend = mutation({
  args: { friendId: v.id("users") },
  handler: async (ctx, { friendId }) => {
    const userId = await requireUserId(ctx);
    const mine = await ctx.db
      .query("friendships")
      .withIndex("by_owner_friend", (q) => q.eq("ownerId", userId).eq("friendId", friendId))
      .unique();
    if (mine !== null) {
      await ctx.db.delete(mine._id);
    }
    const theirs = await ctx.db
      .query("friendships")
      .withIndex("by_owner_friend", (q) => q.eq("ownerId", friendId).eq("friendId", userId))
      .unique();
    if (theirs !== null) {
      await ctx.db.delete(theirs._id);
    }
  },
});
