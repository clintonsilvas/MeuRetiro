import { Link, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "../firebase";

import { useEffect, useState } from "react";
import { Trash2, Edit, Plus } from "lucide-react";

function Home() {
  const [busca, setBusca] = useState("");
  const [grupos, setGrupos] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState({});

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [imagemFile, setImagemFile] = useState(null);

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

  const excluirGrupo = async (e, grupo) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Excluir grupo?")) return;

    try {
      if (grupo.imagemPath) {
        await deleteObject(ref(storage, grupo.imagemPath));
      }
      await deleteDoc(doc(db, "grupos", grupo.id));
    } catch (err) {
      console.error(err);
    }
  };

  const abrirModalNovo = () => {
    setEditando(null);
    setNome("");
    setDescricao("");
    setImagemFile(null);
    setModalOpen(true);
  };

  const abrirModalEditar = (grupo) => {
    setEditando(grupo);
    setNome(grupo.nome);
    setDescricao(grupo.descricao);
    setModalOpen(true);
  };

  const salvarGrupo = async () => {
    try {
      let url = editando?.imagem || "";
      let path = editando?.imagemPath || "";

      if (imagemFile) {
        // excluir antiga se existir
        if (editando?.imagemPath) {
          await deleteObject(ref(storage, editando.imagemPath));
        }

        const storageRef = ref(
          storage,
          `grupos/${Date.now()}_${imagemFile.name}`,
        );
        await uploadBytes(storageRef, imagemFile);
        url = await getDownloadURL(storageRef);
        path = storageRef.fullPath;
      }

      if (editando) {
        await updateDoc(doc(db, "grupos", editando.id), {
          nome,
          descricao,
          imagem: url,
          imagemPath: path,
        });
      } else {
        await addDoc(collection(db, "grupos"), {
          nome,
          descricao,
          imagem: url,
          imagemPath: path,
        });
      }

      setModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
      {/* NAV */}
      <nav className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between">
        <h2 className="font-bold text-blue-600 text-xl">Meu Retiro Católico</h2>

        <div className="flex gap-4">
          {isAdmin ? (
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-1 rounded"
            >
              Sair
            </button>
          ) : (
            <Link
              to="/login"
              className="bg-blue-500 text-white px-4 py-1 rounded"
            >
              Login
            </Link>
          )}
        </div>
      </nav>

      {/* BANNER */}
      <div className="relative h-72">
        <img src="/img/banner.jpg" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
          <h1 className="text-3xl font-bold">Meu Retiro Católico</h1>
          <input
            placeholder="Buscar..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="mt-3 p-2 rounded text-black"
          />
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between mb-6">
          <h2 className="text-xl font-bold text-blue-700">Grupos</h2>

          {isAdmin && (
            <button
              onClick={abrirModalNovo}
              className="bg-green-600 text-white p-2 rounded"
            >
              <Plus />
            </button>
          )}
        </div>

        {loading && <p>Carregando...</p>}

        <div className="grid md:grid-cols-3 gap-6">
          {filtrados.map((grupo) => (
            <Link
              key={grupo.id}
              to={`/grupo/${grupo.id}`}
              className="bg-white dark:bg-gray-800 rounded shadow"
            >
              <div className="h-40 bg-gray-200">
                <img
                  src={grupo.imagem}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-4">
                <h3 className="font-bold">{grupo.nome}</h3>
                <p className="text-sm">{grupo.descricao}</p>
              </div>

              {isAdmin && (
                <div className="flex gap-2 p-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      abrirModalEditar(grupo);
                    }}
                    className="bg-yellow-500 p-2 rounded text-white"
                  >
                    <Edit size={16} />
                  </button>

                  <button
                    onClick={(e) => excluirGrupo(e, grupo)}
                    className="bg-red-500 p-2 rounded text-white"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded w-96 flex flex-col gap-3">
            <h2 className="font-bold text-lg">
              {editando ? "Editar" : "Novo"} Grupo
            </h2>

            <input
              placeholder="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="border p-2 rounded"
            />

            <textarea
              placeholder="Descrição"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="border p-2 rounded"
            />

            <input
              type="file"
              onChange={(e) => setImagemFile(e.target.files[0])}
            />

            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setModalOpen(false)}
                className="px-3 py-1 bg-gray-400 rounded"
              >
                Cancelar
              </button>

              <button
                onClick={salvarGrupo}
                className="px-3 py-1 bg-green-600 text-white rounded"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
