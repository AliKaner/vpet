import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react";
import { useEffect, useRef } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { api } from "../convex/_generated/api";
import { AppShell } from "./components/layout/AppShell";
import { NewPetTile } from "./components/pet/NewPetTile";
import { PartnerChat } from "./components/social/PartnerChat";
import { AchievementsPage } from "./pages/AchievementsPage";
import { BarberPage } from "./pages/BarberPage";
import { CharacterPage } from "./pages/CharacterPage";
import { FriendsPage } from "./pages/FriendsPage";
import { GraveyardPage } from "./pages/GraveyardPage";
import { LoginPage } from "./pages/LoginPage";
import { PetCreatePage } from "./pages/PetCreatePage";
import { PetHomePage } from "./pages/PetHomePage";
import { PartnerPage } from "./pages/PartnerPage";
import { RoomScene } from "./components/room/RoomScene";
import { ShopPage } from "./pages/ShopPage";
import { ActivitiesPage } from "./pages/ActivitiesPage";
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
      <RoomScene>
        <div className="room-multi-pets">
          {pets.map((pet, index) => (
            <div key={pet._id} className="relative room-pet-card">
              {!pet.isMine && <span className="room-partner-badge" title="Your partner's pet" aria-label="Partner's pet">🤝</span>}
              <PetHomePage pet={pet} embedded roomIndex={index} roomPetCount={pets.length} />
            </div>
          ))}
        </div>
      </RoomScene>
      <div className="flex justify-center"><NewPetTile myPetsCount={myPetsCount} /></div>
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
            <Route path="/activities" element={<ActivitiesPage />} />
            <Route path="/room" element={<Navigate to="/" replace />} />
            <Route path="/barber" element={<BarberPage />} />
            <Route path="/character" element={<CharacterPage />} />
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
