import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { db, auth, storage } from "../firebase";
import PessoaModal from "./PessoaModal";

import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

import { deleteObject, ref } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import { Trash2, Plus, Edit } from "lucide-react";

function Equipes() {
  const { grupoId, retiroId } = useParams();

  const [equipes, setEquipes] = useState([]);
  const [participacoes, setParticipacoes] = useState([]);
  const [pessoas, setPessoas] = useState([]);

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [modalPessoa, setModalPessoa] = useState(false);
  const [equipeAtual, setEquipeAtual] = useState(null);
  const [pessoaEditando, setPessoaEditando] = useState(null);

  const [openPessoa, setOpenPessoa] = useState(null);

  // 🔐 ADMIN
  useEffect(() => {
    onAuthStateChanged(auth, (user) => setIsAdmin(!!user));
  }, []);

  // 📦 EQUIPES
  useEffect(() => {
    const q = query(
      collection(db, "equipes"),
      where("retiroId", "==", retiroId),
    );

    return onSnapshot(q, (snap) => {
      setEquipes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, [retiroId]);

  // 🔗 PARTICIPAÇÕES (filtra por grupo)
  useEffect(() => {
    const q = query(
      collection(db, "participacoes"),
      where("grupoId", "==", grupoId),
    );

    return onSnapshot(q, (snap) => {
      setParticipacoes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [grupoId]);

  // 👤 PESSOAS (somente do grupo)
  useEffect(() => {
    let unsubPessoas;

    const q = query(
      collection(db, "participacoes"),
      where("grupoId", "==", grupoId),
    );

    const unsub = onSnapshot(q, (snap) => {
      const ids = snap.docs.map((d) => d.data().pessoaId);

      if (ids.length === 0) {
        setPessoas([]);
        return;
      }

      const qPessoas = query(
        collection(db, "pessoas"),
        where("__name__", "in", ids.slice(0, 10)),
      );

      unsubPessoas = onSnapshot(qPessoas, (snap2) => {
        setPessoas(
          snap2.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })),
        );
      });
    });

    return () => {
      unsub();
      if (unsubPessoas) unsubPessoas();
    };
  }, [grupoId]);

  const getPessoasEquipe = (equipeId) => {
    return participacoes
      .filter((p) => p.equipeId === equipeId)
      .map((p) => ({
        ...pessoas.find((x) => x.id === p.pessoaId),
        participacaoId: p.id,
      }))
      .filter(Boolean);
  };

  // =====================
  // MODAL
  // =====================
  const abrirPessoa = (eq, pessoa = null) => {
    setEquipeAtual(eq);
    setPessoaEditando(pessoa);
    setModalPessoa(true);
  };

  const salvarPessoa = async (pessoaId) => {
    // vincula pessoa à equipe
    await addDoc(collection(db, "participacoes"), {
      pessoaId,
      equipeId: equipeAtual.id,
      retiroId,
      grupoId,
    });

    setModalPessoa(false);
  };

  const excluirPessoa = async (p) => {
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

  const excluirEquipe = async (eq) => {
    if (!confirm("Excluir equipe?")) return;

    try {
      if (eq.fotoPath) {
        await deleteObject(ref(storage, eq.fotoPath));
      }
      await deleteDoc(doc(db, "equipes", eq.id));
    } catch (err) {
      console.error(err);
    }
  };

  // =====================

  if (loading) return <p className="p-10">Carregando...</p>;

  return (
    <div className="max-w-6xl mx-auto space-y-10 py-10">
      {equipes.map((eq) => (
        <div
          key={eq.id}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg overflow-hidden flex flex-col md:flex-row"
        >
          {/* IMAGEM */}
          <div className="md:w-1/3 h-64 md:h-auto">
            <img src={eq.foto} className="w-full h-full object-cover" />
          </div>

          {/* CONTEUDO */}
          <div className="p-6 flex-1">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">{eq.nome}</h2>

              {isAdmin && (
                <button
                  onClick={() => excluirEquipe(eq)}
                  className="p-2 bg-red-500 text-white rounded-full"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            {isAdmin && (
              <button
                onClick={() => abrirPessoa(eq)}
                className="mt-3 text-blue-500 flex items-center gap-1"
              >
                <Plus size={16} /> pessoa
              </button>
            )}

            {/* LISTA */}
            <div className="mt-4 space-y-2">
              {getPessoasEquipe(eq.id).map((p) => (
                <div
                  key={p.id}
                  className="bg-gray-100 dark:bg-gray-700 rounded-lg"
                >
                  <div
                    onClick={() =>
                      setOpenPessoa(openPessoa === p.id ? null : p.id)
                    }
                    className="flex justify-between items-center p-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={p.foto}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span>{p.nome}</span>
                    </div>

                    {isAdmin && (
                      <div
                        className="flex gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button onClick={() => abrirPessoa(eq, p)}>
                          <Edit size={16} />
                        </button>
                        <button onClick={() => excluirPessoa(p)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  {openPessoa === p.id && (
                    <div className="px-4 pb-3 text-sm space-y-1">
                      <p>📍 {p.local}</p>
                      <p>📞 {p.telefone}</p>
                      <p>📸 {p.instagram}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
      {modalPessoa && (
        <PessoaModal
          open={modalPessoa}
          onClose={() => setModalPessoa(false)}
          pessoa={pessoaEditando}
          onSave={salvarPessoa}
          pessoasExistentes={pessoas}
          modo="equipe"
        />
      )}
    </div>
  );
}

export default Equipes;
