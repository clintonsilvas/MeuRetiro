import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { db, storage, auth } from "../firebase";
import PessoaModal from "./PessoaModal";

import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";

import { ref, deleteObject } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import { Plus, Edit, Trash2 } from "lucide-react";

function Pessoas() {
  const { grupoId, timeId, retiroId } = useParams();

  const [pessoas, setPessoas] = useState([]);
  const [participacoes, setParticipacoes] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);

  // 🔐 ADMIN
  useEffect(() => {
    onAuthStateChanged(auth, (u) => setIsAdmin(!!u));
  }, []);

  // 🔗 PARTICIPAÇÕES (SÓ DO TIME)
  useEffect(() => {
    const q = query(
      collection(db, "participacoes"),
      where("timeId", "==", timeId),
    );

    return onSnapshot(q, (snap) => {
      setParticipacoes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [timeId]);

  //BUSCA PESSOAS VINCULADAS AO TIME
  useEffect(() => {
    let unsub;

    const ids = participacoes.map((p) => p.pessoaId);

    if (ids.length === 0) {
      setPessoas([]);
      return;
    }

    const q = query(
      collection(db, "pessoas"),
      where("__name__", "in", ids.slice(0, 10)),
    );

    unsub = onSnapshot(q, (snap) => {
      setPessoas(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub && unsub();
  }, [participacoes]);

  const lista = participacoes
    .map((p) => ({
      ...pessoas.find((x) => x.id === p.pessoaId),
      participacaoId: p.id,
    }))
    .filter(Boolean);

  // =====================
  // AÇÕES
  // =====================
  const abrirNovo = () => {
    setEditando(null);
    setModalOpen(true);
  };

  const abrirEditar = (p) => {
    setEditando(p);
    setModalOpen(true);
  };

  const excluir = async (p) => {
    if (!confirm("Excluir pessoa?")) return;

    try {
      if (p.fotoPath) {
        await deleteObject(ref(storage, p.fotoPath));
      }

      await deleteDoc(doc(db, "pessoas", p.id));
      await deleteDoc(doc(db, "participacoes", p.participacaoId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between mb-6">
        <h2 className="text-3xl font-bold">Pessoas</h2>

        {isAdmin && (
          <button
            onClick={abrirNovo}
            className="bg-green-600 text-white p-2 rounded-lg"
          >
            <Plus />
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {lista.map((p) => (
          <div
            key={p.id}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
          >
            <div className="h-64">
              <img src={p.foto} className="w-full h-full object-cover" />
            </div>

            <div className="p-4 space-y-1">
              <h3 className="text-lg font-bold">{p.nome}</h3>
              <p className="text-sm">📍 {p.local}</p>
              <p className="text-sm">📞 {p.telefone}</p>
              <p className="text-sm text-blue-500">{p.instagram}</p>
            </div>

            {isAdmin && (
              <div className="flex justify-end gap-2 p-3">
                <button onClick={() => abrirEditar(p)}>
                  <Edit size={16} />
                </button>
                <button onClick={() => excluir(p)}>
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      <PessoaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        pessoaEditando={editando}
        contexto={{
          grupoId,
          retiroId,
          timeId,
        }}
      />
    </div>
  );
}

export default Pessoas;
