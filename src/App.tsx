import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react";
import { useEffect, useRef } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { api } from "../convex/_generated/api";
import { AppShell } from "./components/layout/AppShell";
import { NewPetTile } from "./components/pet/NewPetTile";
import { PartnerChat } from "./components/social/PartnerChat";
import { AchievementsPage } from "./pages/AchievementsPage";
import { BarberPage } from "./pages/BarberPage";
import { FriendsPage } from "./pages/FriendsPage";
import { GraveyardPage } from "./pages/GraveyardPage";
import { LoginPage } from "./pages/LoginPage";
import { PetCreatePage } from "./pages/PetCreatePage";
import { PetHomePage } from "./pages/PetHomePage";
import { PartnerPage } from "./pages/PartnerPage";
import { RoomPage } from "./pages/RoomPage";
import { ShopPage } from "./pages/ShopPage";
import { SignupPage } from "./pages/SignupPage";
import { VisitPage } from "./pages/VisitPage";

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
  const partnerStatus = useQuery(api.partners.getMyPartnerStatus);
  const navigate = useNavigate();
  const hadPetRef = useRef(false);

  useEffect(() => {
    if (pets && pets.length > 0) hadPetRef.current = true;
  }, [pets]);

  useEffect(() => {
    if (pets && pets.length === 0) {
      navigate(hadPetRef.current ? "/graveyard" : "/create", { replace: true });
    }
  }, [pets, navigate]);

  if (pets === undefined) {
    return <p className="py-10 text-center text-sm text-cocoa-soft">Loading your pets...</p>;
  }
  if (pets.length === 0) {
    return null;
  }

  const myPetsCount = pets.filter((pet) => pet.isMine).length;

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="flex gap-4 overflow-x-auto pb-2">
        {pets.map((pet) => (
          <div key={pet._id} className="relative w-72 shrink-0">
            {!pet.isMine && (
              <span
                className="absolute -right-1 -top-1 z-10 rounded-full bg-white px-1.5 py-0.5 text-xs shadow"
                title="Your partner's pet"
                aria-hidden
              >
                {"\u{1F91D}"}
              </span>
            )}
            <PetHomePage pet={pet} />
          </div>
        ))}
        <NewPetTile myPetsCount={myPetsCount} />
      </div>
      {partnerStatus?.paired && <PartnerChat />}
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
            <Route path="/room" element={<RoomPage />} />
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
