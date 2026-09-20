import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { gameAssetUrl } from "./lib/gameAssets";
for(const action of ["feed","clean"]) document.documentElement.style.setProperty(`--pet-cursor-${action}`,`url("${gameAssetUrl(`/assets/pets/cursor-${action}.svg`)}") 12 12, pointer`);

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexAuthProvider client={convex}>
      <App />
    </ConvexAuthProvider>
  </StrictMode>,
);
