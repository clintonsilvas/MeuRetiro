import { Link, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { Trash2, Edit, Plus, LogOut, Sun, Moon } from "lucide-react";

function Home() {
  const [busca, setBusca] = useState("");
  const [grupos, setGrupos] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState({});
  const navigate = useNavigate();

  const filtrados = grupos.filter((g) =>
    g.nome?.toLowerCase().includes(busca.toLowerCase()),
  );

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "grupos"), (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGrupos(lista);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      setIsAdmin(!!user);
    });
  }, []);

  const handleLogout = () => {
    signOut(auth);
    navigate("/");
  };

  const excluirGrupo = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Excluir grupo?")) return;
    await deleteDoc(doc(db, "grupos", id));
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen transition-colors duration-300">
      {/* NAVBAR */}
      <nav className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center px-6 md:px-10 sticky top-0 z-50 transition-colors">
        <h2 className="font-bold text-blue-600 dark:text-blue-400 text-xl text-shadow-sm">
          Meu Retiro Católico
        </h2>

        <div className="flex gap-4 items-center">
          <Link
            to="/"
            className="hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400 font-medium"
          >
            Home
          </Link>

          {isAdmin ? (
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-1 rounded-lg hover:bg-red-600 transition"
            >
              Sair
            </button>
          ) : (
            <Link
              to="/login"
              className="bg-blue-500 text-white px-4 py-1 rounded-lg hover:bg-blue-600 transition"
            >
              Login
            </Link>
          )}
        </div>
      </nav>

      {/* BANNER */}
      <div className="relative h-80">
        <img src="/img/banner.jpg" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white text-center p-5 gap-2">
          <h1 className="text-4xl font-bold drop-shadow-lg">
            Meu Retiro Católico
          </h1>
          <p className="opacity-90">
            Encontre grupos, retiros e viva essa experiência
          </p>
          <input
            type="text"
            placeholder="Buscar grupo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="mt-2 p-2 rounded-lg w-64 text-black outline-none focus:ring-4 focus:ring-blue-500/50 transition-all"
          />
        </div>
      </div>

      <div className="p-6 md:p-10p-6 md:p-10 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Grupos Disponíveis
          </h2>
          {isAdmin && (
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-lg transition transform hover:scale-105 active:scale-95">
              <Plus size={20}></Plus>
            </button>
          )}
        </div>

        {loading && (
          <p className="text-center text-gray-500 animate-pulse">
            Carregando...
          </p>
        )}

        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-8">
          {filtrados.map((grupo) => (
            <Link
              key={grupo.id}
              to={`/grupo/${grupo.id}`}
              className="group block bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 relative"
            >
              <div className="relative h-52 w-full bg-gray-200 dark:bg-gray-700">
                {!loadedImages[grupo.id] && (
                  <div className="absolute inset-0 bg-linear-to-r from-gray-200 dark:from-gray-700 via-gray-300 dark:via-gray-600 to-gray-200 dark:to-gray-700 animate-pulse" />
                )}
                <img
                  src={grupo.imagem}
                  className={`w-full h-full object-cover transition-opacity duration-500 ${
                    loadedImages[grupo.id] ? "opacity-100" : "opacity-0"
                  }`}
                  onLoad={() =>
                    setLoadedImages((p) => ({ ...p, [grupo.id]: true }))
                  }
                />

                {isAdmin && (
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        alert("editar");
                      }}
                      className="p-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 shadow-xl backdrop-blur-md transition"
                    >
                      <Edit size={20} />
                    </button>
                    <button
                      onClick={(e) => excluirGrupo(e, grupo.id)}
                      className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-xl backdrop-blur-md transition"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                )}
              </div>

              <div className="p-5">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                  {grupo.nome}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 line-clamp-3">
                  {grupo.descricao}
                </p>
                <div className="mt-5 flex items-center text-blue-500 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
                  Ver detalhes do grupo
                  <span className="ml-2 transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;
