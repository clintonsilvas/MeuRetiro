import { Link, Outlet, useParams, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Trash2, Edit, Plus } from "lucide-react";

function Retiro() {
  const { grupoId, retiroId } = useParams();
  const location = useLocation();

  const [retiro, setRetiro] = useState(null);
  const [senha, setSenha] = useState("");
  const [liberado, setLiberado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const base = `/grupo/${grupoId}/retiro/${retiroId}`;
  const isHome = location.pathname === base;

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "retiros", retiroId), (docSnap) => {
      if (docSnap.exists()) {
        setRetiro({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    });
    return () => unsub();
  }, [retiroId]);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      setIsAdmin(!!user);
    });
  }, []);

  // 2. Verificar se já houve acesso prévio (LocalStorage)
  useEffect(() => {
    const salvo = localStorage.getItem(`acesso_${retiroId}`);
    if (salvo === "true") setLiberado(true);
  }, [retiroId]);

  if (loading)
    return (
      <p className="text-center mt-10 dark:text-gray-400">
        Carregando retiro...
      </p>
    );
  if (!retiro)
    return (
      <p className="text-center mt-10 dark:text-gray-400">
        Retiro não encontrado.
      </p>
    );

  const verificar = () => {
    if (senha === retiro.senha) {
      setLiberado(true);
      localStorage.setItem(`acesso_${retiroId}`, "true");
    } else {
      alert("Senha incorreta! Peça aos coordenadores.");
    }
  };

  // TELA DE PROTEÇÃO (SENHA)
  if (!liberado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl text-center border border-gray-200 dark:border-gray-700">
          <div className="mb-6">
            <span className="text-5xl">🔐</span>
            <h2 className="text-2xl font-bold mt-4 dark:text-white">
              Acesso Restrito
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Este conteúdo é exclusivo para participantes do {retiro.nome}.
            </p>
          </div>

          <input
            type="password"
            placeholder="Digite a senha do retiro"
            className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          <button
            onClick={verificar}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all"
          >
            Acessar Conteúdo
          </button>

          <Link
            to={`/grupo/${grupoId}`}
            className="block mt-4 text-sm text-gray-500 hover:underline"
          >
            ← Voltar ao grupo
          </Link>
        </div>
      </div>
    );
  }

  // TELA DO RETIRO LIBERADA
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      {/* HERO DYNAMICO */}
      <div
        className={`relative overflow-hidden transition-all duration-500 ${isHome ? "h-112.5" : "h-64"}`}
      >
        <Link
          to={`/grupo/${grupoId}`}
          className="absolute top-4 left-6 text-sm text-white hover:underline z-50"
        >
          ← Voltar para Grupo
        </Link>
        <img
          src={retiro.imagem}
          className="w-full h-full object-cover"
          alt={retiro.nome}
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent flex flex-col items-center justify-center text-white p-6 text-center">
          <h1
            className={`${isHome ? "text-5xl" : "text-3xl"} font-bold transition-all`}
          >
            {retiro.nome}
          </h1>
          {isHome && <p className="mt-2 text-xl opacity-90">{retiro.tema}</p>}
          <div className="mt-4 flex gap-3 text-sm font-medium bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm">
            <span>📅 {retiro.data}</span>
            <span>•</span>
            <span>📍 {retiro.local}</span>
          </div>
        </div>
      </div>

      {/* NAVEGAÇÃO INTERNA (SUB-ROTAS) */}
      <nav className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex justify-around">
          <NavLink
            to={`${base}/principal`}
            label="Home"
            current={location.pathname.includes("/principal")}
          />
          <NavLink
            to={`${base}/equipes`}
            label="Equipes"
            current={location.pathname.includes("/equipes")}
          />
          <NavLink
            to={`${base}/times`}
            label="Grupos"
            current={location.pathname.includes("/times")}
          />
        </div>
      </nav>

      {/* CONTEÚDO DAS SUB-ROTAS */}
      <main className="max-w-5xl mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}

function NavLink({ to, label, current }) {
  return (
    <Link
      to={to}
      className={`py-4 px-6 text-sm font-bold uppercase tracking-widest border-b-2 transition-all ${
        current
          ? "border-blue-600 text-blue-600 dark:text-blue-400"
          : "border-transparent text-gray-500 hover:text-blue-500 dark:hover:text-gray-300"
      }`}
    >
      {label}
    </Link>
  );
}

export default Retiro;
