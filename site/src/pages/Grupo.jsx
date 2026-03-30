import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Trash2, Edit, Plus } from "lucide-react";

function Grupo() {
  const { id } = useParams();
  const [grupo, setGrupo] = useState(null);
  const [retiros, setRetiros] = useState([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsAdmin(!!user);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubGrupo = onSnapshot(doc(db, "grupos", id), (docSnap) => {
      if (docSnap.exists()) {
        setGrupo({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    });
    return () => unsubGrupo();
  }, [id]);

  useEffect(() => {
    const q = query(collection(db, "retiros"), where("grupoid", "==", id));
    const unsubRetiros = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRetiros(lista);
    });
    return () => unsubRetiros();
  }, [id]);

  const filtrados = retiros.filter((r) =>
    r.nome?.toLowerCase().includes(busca.toLowerCase()),
  );

  if (loading)
    return (
      <p className="text-center mt-10 dark:text-gray-400">Carregando...</p>
    );
  if (!grupo)
    return (
      <p className="text-center mt-10 dark:text-gray-400">
        Grupo não encontrado
      </p>
    );

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen transition-colors duration-300">
      {/* HERO / BANNER DO GRUPO */}
      <div className="relative h-80">
        <img
          src={grupo.imagem}
          className="w-full h-full object-cover"
          alt={grupo.nome}
        />
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white text-center p-5 gap-2">
          <Link
            to="/"
            className="absolute top-4 left-6 text-sm hover:underline"
          >
            ← Voltar para Home
          </Link>

          <h1 className="text-4xl font-bold drop-shadow-lg">{grupo.nome}</h1>
          <p className="max-w-xl opacity-90">{grupo.descricao}</p>

          <input
            type="text"
            placeholder="Buscar retiro neste grupo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="mt-4 p-2 rounded-lg w-64 text-black outline-none focus:ring-4 focus:ring-blue-500/50 transition-all"
          />
        </div>
      </div>

      <div className="p-6 md:p-10 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Retiros
          </h2>
          {isAdmin && (
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-lg transition transform hover:scale-105 active:scale-95">
              <Plus size={20}></Plus>
            </button>
          )}
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-8">
          {filtrados.map((retiro) => (
            <Link
              key={retiro.id}
              to={`/grupo/${id}/retiro/${retiro.id}`}
              className="group block bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 relative"
            >
              <div className="h-48 overflow-hidden">
                <img
                  src={retiro.imagem}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                  alt={retiro.nome}
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

              <div className="p-5 space-y-2">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-blue-500 transition">
                  {retiro.nome}
                </h3>
                <p className="text-blue-600 dark:text-blue-400 font-medium text-sm">
                  ✨ {retiro.tema}
                </p>

                <div className="text-gray-600 dark:text-gray-400 text-sm space-y-1">
                  <p>
                    📅 <strong>Data:</strong> {retiro.data}
                  </p>
                  <p>
                    📍 <strong>Local:</strong> {retiro.local}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t dark:border-gray-700 text-blue-500 text-xs font-bold uppercase">
                  Ver informações completas →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Grupo;
