import Home from "./pages/Home";
import Grupo from "./pages/Grupo";
import Retiro from "./pages/Retiro";
import Equipes from "./pages/Equipes";
import Times from "./pages/Times";
import Pessoas from "./pages/Pessoas";
import Login from "./pages/AdmLogin";
import RetiroHome from "./pages/RetiroHome";
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />
        <Route path="/grupo/:id" element={<Grupo />} />
        <Route path="/grupo/:grupoId/retiro/:retiroId" element={<Retiro />}>
          <Route path="equipes" element={<Equipes />} />
          <Route path="times" element={<Times />} />
          <Route path="principal" element={<RetiroHome />} />
          <Route path="times/:timeId/pessoas" element={<Pessoas />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
