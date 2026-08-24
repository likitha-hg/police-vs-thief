import { HashRouter, Routes, Route } from "react-router-dom";

import SplashScreen from "./pages/SplashScreen";
import MainMenu from "./pages/MainMenu";
import LevelSelect from "./pages/LevelSelect";
import Level1 from "./pages/Level1";
import Level2 from "./pages/Level2";
import Level3 from "./pages/Level3";
import Level4 from "./pages/Level4";
import Level5 from "./pages/Level5";
import Level6 from "./pages/Level6";
import Level7 from "./pages/Level7";
import Level8 from "./pages/Level8";
import Level9 from "./pages/Level9";
import Level10 from "./pages/Level10";

import { MusicProvider } from "./context/MusicContext";

function App() {
  return (
    <MusicProvider>
      <HashRouter>
        <Routes>

          <Route path="/" element={<SplashScreen />} />

          <Route path="/menu" element={<MainMenu />} />

          <Route path="/levels" element={<LevelSelect />} />

          <Route path="/level1" element={<Level1 />} />
          <Route path="/level2" element={<Level2 />} />
          <Route path="/level3" element={<Level3 />} />
          <Route path="/level4" element={<Level4 />} />
          <Route path="/level5" element={<Level5 />} />
          <Route path="/level6" element={<Level6 />} />
          <Route path="/level7" element={<Level7 />} />
          <Route path="/level8" element={<Level8 />} />
          <Route path="/level9" element={<Level9 />} />
          <Route path="/level10" element={<Level10 />} />

        </Routes>
      </HashRouter>
    </MusicProvider>
  );
}

export default App;