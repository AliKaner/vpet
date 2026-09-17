# Vpet

A Tamagotchi-style virtual pet game. Create a pet, feed it, pet it, clean it,
and watch it grow up in real time — neglect it and it won't last the week,
care for it well and it can live a long, happy life.

Built with [Convex](https://convex.dev) (backend, auth, real-time data, and a
cron job that ages pets and checks for death even while you're offline) and
React + Vite + Tailwind CSS on the frontend.

## Status

Phase 1 is done: auth, a single cat or dog, feed/pet/clean, real-time stat
decay, aging, death (by neglect or old age), and a memorial/graveyard screen.

Phase 2 is in progress: more species (bird, snake, mouse, horse) with their
own care mechanics, pixel-art animated pets, a shop for toys and clothes,
owning multiple pets, achievements, and visiting other players' pets.

## Development

```bash
npm install
npx convex dev   # first run: log in / create a Convex project
npm run dev
```

`npx convex dev` and `npm run dev` both need to be running for local
development.
