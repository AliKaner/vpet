import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { api } from "../convex/_generated/api";
import { AppShell } from "./components/layout/AppShell";
import { PetSwitcher } from "./components/pet/PetSwitcher";
import { AchievementsPage } from "./pages/AchievementsPage";
import { BarberPage } from "./pages/BarberPage";
import { FriendsPage } from "./pages/FriendsPage";
import { GraveyardPage } from "./pages/GraveyardPage";
import { LoginPage } from "./pages/LoginPage";
import { PetCreatePage } from "./pages/PetCreatePage";
import { PetHomePage } from "./pages/PetHomePage";
import { PartnerPage } from "./pages/PartnerPage";
import { ShopPage } from "./pages/ShopPage";
import { SignupPage } from "./pages/SignupPage";
import { VisitPage } from "./pages/VisitPage";

const SELECTED_PET_KEY = "vpet:selectedPetId";

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
  const pets = useQuery(api.pets.getHouseholdPets);
  const navigate = useNavigate();
  const hadPetRef = useRef(false);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SELECTED_PET_KEY);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (pets && pets.length > 0) hadPetRef.current = true;
  }, [pets]);

  useEffect(() => {
    if (pets && pets.length === 0) {
      navigate(hadPetRef.current ? "/graveyard" : "/create", { replace: true });
    }
  }, [pets, navigate]);

  function selectPet(petId: string) {
    setSelectedPetId(petId);
    try {
      localStorage.setItem(SELECTED_PET_KEY, petId);
    } catch {
      // per-viewer convenience only; fine to skip if storage is unavailable
    }
  }

  if (pets === undefined) {
    return <p className="py-10 text-center text-sm text-cocoa-soft">Loading your pets...</p>;
  }
  if (pets.length === 0) {
    return null;
  }

  const selected = pets.find((pet) => pet._id === selectedPetId) ?? pets[0];

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PetSwitcher pets={pets} selectedPetId={selected._id} onSelect={selectPet} />
      <PetHomePage pet={selected} />
    </div>
  );
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
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/barber" element={<BarberPage />} />
            <Route path="/achievements" element={<AchievementsPage />} />
            <Route path="/visit" element={<VisitPage />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/partner" element={<PartnerPage />} />
            <Route path="/graveyard" element={<GraveyardPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </Authenticated>
    </BrowserRouter>
  );
}
