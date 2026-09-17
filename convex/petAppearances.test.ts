/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";
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
test("species mismatch is rejected on both creation and update", async () => {
  const { owner } = await setup();
  await expect(owner.mutation(api.pets.createPet, { name: "Pip", species: "bird", appearance: "silver" })).rejects.toThrow();
  await owner.mutation(api.pets.createPet, { name: "Pip", species: "bird", appearance: "sunny" });
  const [pet] = await owner.query(api.pets.getMyPets);
  await expect(owner.mutation(api.pets.setAppearance, { petId: pet._id, appearance: "chocolate" })).rejects.toThrow();
  expect((await owner.query(api.pets.getMyPets))[0].appearance).toBe("sunny");
});
test("anonymous users and other owners cannot change a pet appearance", async () => {
  const { t, owner, other } = await setup();
  await owner.mutation(api.pets.createPet, { name: "Miso", species: "cat" });
  const [pet] = await owner.query(api.pets.getMyPets);
  await expect(t.mutation(api.pets.setAppearance, { petId: pet._id, appearance: "silver" })).rejects.toThrow();
  await expect(other.mutation(api.pets.setAppearance, { petId: pet._id, appearance: "silver" })).rejects.toThrow();
  expect((await owner.query(api.pets.getMyPets))[0].appearance).toBe("classic");
});
