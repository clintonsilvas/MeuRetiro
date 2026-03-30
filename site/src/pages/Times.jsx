import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { db, storage, auth } from "../firebase";

import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

import { onAuthStateChanged } from "firebase/auth";
import { Plus, Edit, Trash2 } from "lucide-react";
import { createPortal } from "react-dom";

function Times() {
  const { grupoId, retiroId } = useParams();

  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);

  const [nome, setNome] = useState("");
  const [file, setFile] = useState(null);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => setIsAdmin(!!u));
  }, []);

  useEffect(() => {
    const q = query(collection(db, "times"), where("retiroId", "==", retiroId));

    const unsub = onSnapshot(q, (snapshot) => {
      const dados = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLista(dados);
      setLoading(false);
    });

    return () => unsub();
  }, [retiroId]);

  // ====================
  // MODAL
  // ====================
  const abrirNovo = () => {
    setEditando(null);
    setNome("");
    setFile(null);
    setModalOpen(true);
  };

  const abrirEditar = (t) => {
    setEditando(t);
    setNome(t.nome);
    setModalOpen(true);
  };

  const salvar = async () => {
    let url = editando?.foto || "";
    let path = editando?.fotoPath || "";

    try {
      if (file) {
        if (editando?.fotoPath) {
          await deleteObject(ref(storage, editando.fotoPath));
        }

        const storageRef = ref(storage, `times/${Date.now()}-${file.name}`);

        await uploadBytes(storageRef, file);
        url = await getDownloadURL(storageRef);
        path = storageRef.fullPath;
      }

      if (editando) {
        await updateDoc(doc(db, "times", editando.id), {
          nome,
          foto: url,
          fotoPath: path,
        });
      } else {
        await addDoc(collection(db, "times"), {
          nome,
          foto: url,
          fotoPath: path,
          retiroId,
        });
      }

      setModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const excluir = async (t) => {
    if (!confirm("Excluir grupo?")) return;

    try {
      if (t.fotoPath) {
        await deleteObject(ref(storage, t.fotoPath));
      }

      await deleteDoc(doc(db, "times", t.id));
    } catch (err) {
      console.error(err);
    }
  };

  // ====================

  if (loading) return <p className="text-center p-10">Carregando...</p>;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Grupos</h2>

        {isAdmin && (
          <button
            onClick={abrirNovo}
            className="bg-green-600 text-white p-2 rounded-lg"
          >
            <Plus />
          </button>
        )}
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6">
        {lista.map((time) => (
          <div
            key={time.id}
            className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow relative"
          >
            <div className="h-48">
              <img src={time.foto} className="w-full h-full object-cover" />
            </div>

            <div className="p-4 text-center">
              <h3 className="font-bold">{time.nome}</h3>

              <Link
                to={`/grupo/${grupoId}/retiro/${retiroId}/times/${time.id}/pessoas`}
                className="block mt-3 bg-gray-200 p-2 rounded"
              >
                Ver cursistas
              </Link>
            </div>

            {isAdmin && (
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  onClick={() => abrirEditar(time)}
                  className="bg-yellow-500 p-2 rounded text-white"
                >
                  <Edit size={14} />
                </button>

                <button
                  onClick={() => excluir(time)}
                  className="bg-red-500 p-2 rounded text-white"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* MODAL (PORTAL) */}
      {modalOpen &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-9999">
            <div className="bg-white p-6 rounded w-96 flex flex-col gap-2">
              <h2 className="font-bold">
                {editando ? "Editar" : "Novo"} Grupo
              </h2>

              <input
                placeholder="Nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="border p-2"
              />

              <input type="file" onChange={(e) => setFile(e.target.files[0])} />

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
          </div>,
          document.body,
        )}
    </div>
  );
}

export default Times;
