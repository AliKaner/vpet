/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";
import { PET_APPEARANCES } from "./lib/petAppearances";
const modules = import.meta.glob("./**/*.ts");
async function setup() {
  const t = convexTest(schema, modules);
  const ownerId = await t.run((ctx) => ctx.db.insert("users", { name: "Owner", petSlots: 10 }));
  const otherId = await t.run((ctx) => ctx.db.insert("users", { name: "Other" }));
  const owner = t.withIdentity({ subject: ownerId });
  const other = t.withIdentity({ subject: otherId });
  return { t, owner, other };
}
test("appearance persists across creation, queries and authorized updates", async () => {
  const { owner } = await setup();
  await owner.mutation(api.pets.createPet, { name: "Miso", species: "cat", appearance: "silver" });
  const [pet] = await owner.query(api.pets.getMyPets);
  expect(pet.appearance).toBe("silver");
  await owner.mutation(api.pets.setAppearance, { petId: pet._id, appearance: "classic" });
  expect((await owner.query(api.pets.getMyPets))[0].appearance).toBe("classic");
});
test("omitted appearance remains compatible with older clients", async () => {
  const { owner } = await setup();
  await owner.mutation(api.pets.createPet, { name: "Pip", species: "bird" });
  expect((await owner.query(api.pets.getMyPets))[0].appearance).toBe("classic");
});
test("each species accepts its six curated appearances", async () => {
  for (const [species, appearances] of Object.entries(PET_APPEARANCES)) {
    expect(appearances).toHaveLength(6);
    expect(new Set(appearances.map((appearance) => appearance.id)).size).toBe(6);
    expect(appearances.every((appearance) => typeof appearance.color === "string")).toBe(true);
    expect(species).toBeTypeOf("string");
  }
  const { owner } = await setup();
  await owner.mutation(api.pets.createPet, { name: "Pip", species: "bird", appearance: "chocolate" });
  const [pet] = await owner.query(api.pets.getMyPets);
  await owner.mutation(api.pets.setAppearance, { petId: pet._id, appearance: "midnight" });
  expect((await owner.query(api.pets.getMyPets))[0].appearance).toBe("midnight");
});
test("anonymous users and other owners cannot change a pet appearance", async () => {
  const { t, owner, other } = await setup();
  await owner.mutation(api.pets.createPet, { name: "Miso", species: "cat" });
  const [pet] = await owner.query(api.pets.getMyPets);
  await expect(t.mutation(api.pets.setAppearance, { petId: pet._id, appearance: "silver" })).rejects.toThrow();
  await expect(other.mutation(api.pets.setAppearance, { petId: pet._id, appearance: "silver" })).rejects.toThrow();
  expect((await owner.query(api.pets.getMyPets))[0].appearance).toBe("classic");
});
