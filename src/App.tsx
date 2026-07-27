import React, { useState } from "react";
import LandingPage from "./components/LandingPage";
import Hud from "./Hud";
import { Toaster } from "sonner";

export default function App() {
  const [currentView, setCurrentView] = useState<"landing" | "hud">("landing");

  return (
    <>
      {currentView === "landing" ? (
        <LandingPage onEnterHud={() => setCurrentView("hud")} />
      ) : (
        <Hud onNavigateHome={() => setCurrentView("landing")} />
      )}
      <Toaster position="top-right" theme="light" richColors closeButton />
    </>
  );
}
