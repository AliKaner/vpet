import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react";
import { useEffect, useRef } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { api } from "../convex/_generated/api";
import { AppShell } from "./components/layout/AppShell";
import { GraveyardPage } from "./pages/GraveyardPage";
import { LoginPage } from "./pages/LoginPage";
import { PetCreatePage } from "./pages/PetCreatePage";
import { PetHomePage } from "./pages/PetHomePage";
import { SignupPage } from "./pages/SignupPage";

function SplashScreen() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-cream">
      <span className="text-4xl" aria-hidden>
        🐾
      </span>
    </div>
  );
}

function HomeRoute() {
  const pet = useQuery(api.pets.getMyActivePet);
  const navigate = useNavigate();
  const hadPetRef = useRef(false);

  useEffect(() => {
    if (pet) hadPetRef.current = true;
  }, [pet]);

  useEffect(() => {
    if (pet === null) {
      navigate(hadPetRef.current ? "/graveyard" : "/create", { replace: true });
    }
  }, [pet, navigate]);

  if (pet === undefined) {
    return <p className="py-10 text-center text-sm text-cocoa-soft">Loading your pet...</p>;
  }
  if (pet === null) {
    return null;
  }
  return <PetHomePage pet={pet} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthLoading>
        <SplashScreen />
      </AuthLoading>
      <Unauthenticated>
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </Unauthenticated>
      <Authenticated>
        <AppShell>
          <Routes>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/create" element={<PetCreatePage />} />
            <Route path="/graveyard" element={<GraveyardPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </Authenticated>
    </BrowserRouter>
  );
}
