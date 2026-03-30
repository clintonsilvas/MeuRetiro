import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { db, auth, storage } from "../firebase";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  ref as refStorage,
} from "firebase/storage";

import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";
import { Trash2, Plus } from "lucide-react";

function Equipes() {
  const { retiroId } = useParams();

  const [equipes, setEquipes] = useState([]);
  const [participacoes, setParticipacoes] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [file, setFile] = useState(null);

  // 🔐 ADMIN
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsAdmin(!!user);
    });
    return () => unsub();
  }, []);

  // 📦 EQUIPES
  useEffect(() => {
    const q = query(
      collection(db, "equipes"),
      where("retiroId", "==", retiroId),
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEquipes(lista);
      setLoading(false);
    });

    return () => unsub();
  }, [retiroId]);

  // 🔗 PARTICIPACOES
  useEffect(() => {
    const q = query(
      collection(db, "participacoes"),
      where("retiroId", "==", retiroId),
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setParticipacoes(lista);
    });

    return () => unsub();
  }, [retiroId]);

  // 👤 PESSOAS
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "pessoas"), (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPessoas(lista);
    });

    return () => unsub();
  }, []);

  // 🔎 pegar pessoas da equipe
  const getPessoasEquipe = (equipeId) => {
    return participacoes
      .filter((p) => p.equipeId === equipeId)
      .map((p) => pessoas.find((pes) => pes.id === p.pessoaId))
      .filter(Boolean);
  };

  // ➕ ADD EQUIPE
  const criarEquipe = async () => {
    if (!nome) return alert("Nome obrigatório");

    let url = "";

    if (file) {
      const storageRef = ref(storage, `equipes/${Date.now()}-${file.name}`);

      await uploadBytes(storageRef, file);
      url = await getDownloadURL(storageRef);
    }

    await addDoc(collection(db, "equipes"), {
      nome,
      descricao,
      foto: url,
      retiroId,
    });

    setOpenModal(false);
    setNome("");
    setDescricao("");
    setFile(null);
  };

  const removerEquipe = async (id) => {
    await fetch(`http://localhost:3000/equipes/${id}`, {
      method: "DELETE",
    });
  };

  // ➕ ADD PESSOA NA EQUIPE
  const addPessoaEquipe = async (equipeId) => {
    const pessoaId = prompt("ID da pessoa:");
    if (!pessoaId) return;

    await addDoc(collection(db, "participacoes"), {
      pessoaId,
      retiroId,
      equipeId,
    });
  };

  // 🗑️ REMOVE PESSOA
  const removePessoa = async (participacaoId) => {
    if (!confirm("Remover pessoa?")) return;
    await deleteDoc(doc(db, "participacoes", participacaoId));
  };

  if (loading) return <p className="text-center p-10">Buscando equipes...</p>;

  return (
    <div className="max-w-5xl mx-auto space-y-12 py-8">
      {/* ADMIN ADD EQUIPE */}
      {isAdmin && (
        <button
          onClick={() => setOpenModal(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg"
        >
          <Plus size={18} /> Nova Equipe
        </button>
      )}

      {equipes.map((eq) => (
        <div
          key={eq.id}
          className="flex flex-col md:flex-row bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-lg relative"
        >
          {/* FOTO */}
          <div className="md:w-1/3 h-64">
            <img src={eq.foto} className="w-full h-full object-cover" />
          </div>

          <div className="p-6 md:w-2/3">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">{eq.nome}</h2>

              {isAdmin && (
                <button
                  onClick={() => removeEquipe(eq.id)}
                  className="p-2 bg-red-500 text-white rounded-full"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            {/* ADD PESSOA */}
            {isAdmin && (
              <button
                onClick={() => addPessoaEquipe(eq.id)}
                className="mt-3 text-sm text-blue-500"
              >
                + adicionar pessoa
              </button>
            )}

            {/* PESSOAS */}
            <div className="mt-4 space-y-2">
              {getPessoasEquipe(eq.id).map((pessoa) => {
                const part = participacoes.find(
                  (x) => x.pessoaId === pessoa.id && x.equipeId === eq.id,
                );

                return (
                  <div
                    key={pessoa.id}
                    className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-700 rounded-lg"
                  >
                    <span>{pessoa.nome}</span>

                    {isAdmin && (
                      <button
                        onClick={() => removePessoa(part.id)}
                        className="text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
      {openModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4 dark:text-white">
              Nova Equipe
            </h2>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nome da equipe"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full p-2 rounded-lg border dark:bg-gray-700"
              />

              <textarea
                placeholder="Descrição"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full p-2 rounded-lg border dark:bg-gray-700"
              />

              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setOpenModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-300 dark:bg-gray-600"
              >
                Cancelar
              </button>

              <button
                onClick={criarEquipe}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Equipes;
