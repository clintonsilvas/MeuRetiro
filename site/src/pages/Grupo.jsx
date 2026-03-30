import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "../firebase";

import { Trash2, Edit, Plus } from "lucide-react";

function Grupo() {
  const { id } = useParams();

  const [grupo, setGrupo] = useState(null);
  const [retiros, setRetiros] = useState([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);

  const [nome, setNome] = useState("");
  const [tema, setTema] = useState("");
  const [data, setData] = useState("");
  const [local, setLocal] = useState("");
  const [senha, setSenha] = useState("");
  const [imagemFile, setImagemFile] = useState(null);

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
    const unsub = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRetiros(lista);
    });
    return () => unsub();
  }, [id]);

  const filtrados = retiros.filter((r) =>
    r.nome?.toLowerCase().includes(busca.toLowerCase()),
  );

  const abrirNovo = () => {
    setEditando(null);
    setNome("");
    setTema("");
    setData("");
    setLocal("");
    setSenha("");
    setImagemFile(null);
    setModalOpen(true);
  };

  const abrirEditar = (r) => {
    setEditando(r);
    setNome(r.nome);
    setTema(r.tema);
    setData(r.data);
    setLocal(r.local);
    setSenha(r.senha);
    setModalOpen(true);
  };

  const salvar = async () => {
    try {
      let url = editando?.imagem || "";
      let path = editando?.imagemPath || "";

      if (imagemFile) {
        if (editando?.imagemPath) {
          await deleteObject(ref(storage, editando.imagemPath));
        }

        const storageRef = ref(
          storage,
          `retiros/${Date.now()}_${imagemFile.name}`,
        );
        await uploadBytes(storageRef, imagemFile);
        url = await getDownloadURL(storageRef);
        path = storageRef.fullPath;
      }

      if (editando) {
        await updateDoc(doc(db, "retiros", editando.id), {
          nome,
          tema,
          data,
          local,
          senha,
          imagem: url,
          imagemPath: path,
        });
      } else {
        await addDoc(collection(db, "retiros"), {
          nome,
          tema,
          data,
          local,
          senha,
          grupoid: id,
          imagem: url,
          imagemPath: path,
        });
      }

      setModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const excluir = async (e, r) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Excluir retiro?")) return;

    try {
      if (r.imagemPath) {
        await deleteObject(ref(storage, r.imagemPath));
      }
      await deleteDoc(doc(db, "retiros", r.id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p className="text-center mt-10">Carregando...</p>;
  if (!grupo) return <p className="text-center mt-10">Grupo não encontrado</p>;

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
      {/* BANNER */}
      <div className="relative h-72">
        <img src={grupo.imagem} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
          <Link to="/" className="absolute top-4 left-4">
            ← Voltar
          </Link>

          <h1 className="text-3xl font-bold">{grupo.nome}</h1>
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
          <h2 className="text-xl font-bold text-white">Retiros</h2>

          {isAdmin && (
            <button
              onClick={abrirNovo}
              className="bg-green-600 text-white p-2 rounded"
            >
              <Plus />
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {filtrados.map((r) => (
            <Link
              key={r.id}
              to={`/grupo/${id}/retiro/${r.id}`}
              className="bg-white dark:bg-gray-800 rounded shadow"
            >
              <div className="h-40">
                <img src={r.imagem} className="w-full h-full object-cover" />
              </div>

              <div className="p-4">
                <h3 className="font-bold">{r.nome}</h3>
                <p className="text-sm">{r.tema}</p>
                <p className="text-sm">{r.data}</p>
                <p className="text-sm">{r.local}</p>
              </div>

              {isAdmin && (
                <div className="flex gap-2 p-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      abrirEditar(r);
                    }}
                    className="bg-yellow-500 p-2 rounded text-white"
                  >
                    <Edit size={16} />
                  </button>

                  <button
                    onClick={(e) => excluir(e, r)}
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-96 flex flex-col gap-2">
            <h2 className="font-bold">{editando ? "Editar" : "Novo"} Retiro</h2>

            <input
              placeholder="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="border p-2"
            />
            <input
              placeholder="Tema"
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              className="border p-2"
            />
            <input
              placeholder="Data"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="border p-2"
            />
            <input
              placeholder="Local"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              className="border p-2"
            />
            <input
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="border p-2"
            />

            <input
              type="file"
              onChange={(e) => setImagemFile(e.target.files[0])}
            />

            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => setModalOpen(false)}>Cancelar</button>
              <button
                onClick={salvar}
                className="bg-green-600 text-white px-3 py-1 rounded"
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

export default Grupo;
