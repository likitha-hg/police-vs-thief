import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import ChaseAnimation from "../components/ChaseAnimation";
import "../styles/SplashScreen.css";

import { useMusic } from "../context/MusicContext";

function SplashScreen() {
  const navigate = useNavigate();

  const {
    playMusic,
    mainMusic,
  } = useMusic();

  useEffect(() => {
    // Start main music
    playMusic(mainMusic);

    // Navigate to Main Menu after 6 seconds
    const timer = setTimeout(() => {
      navigate("/menu");
    }, 6000);

    return () => {
      clearTimeout(timer);
    };
  }, [navigate, playMusic, mainMusic]);

  return (
    <div className="splash-screen">
      <ChaseAnimation />
    </div>
  );
}

export default SplashScreen;