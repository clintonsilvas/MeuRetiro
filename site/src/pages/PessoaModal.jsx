import { useState, useEffect } from "react";
import { db, storage } from "../firebase";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

import { createPortal } from "react-dom";

function PessoaModal({
  open,
  onClose,
  pessoaEditando,
  contexto, // { grupoId, retiroId, timeId?, equipeId? }
}) {
  const [nome, setNome] = useState("");
  const [local, setLocal] = useState("");
  const [telefone, setTelefone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (pessoaEditando) {
      setNome(pessoaEditando.nome);
      setLocal(pessoaEditando.local);
      setTelefone(pessoaEditando.telefone);
      setInstagram(pessoaEditando.instagram);
    } else {
      setNome("");
      setLocal("");
      setTelefone("");
      setInstagram("");
    }
  }, [pessoaEditando]);

  if (!open) return null;

  const salvar = async () => {
    let url = pessoaEditando?.foto || "";
    let path = pessoaEditando?.fotoPath || "";
    let pessoaId = pessoaEditando?.id;

    try {
      if (file) {
        if (pessoaEditando?.fotoPath) {
          await deleteObject(ref(storage, pessoaEditando.fotoPath));
        }

        const storageRef = ref(storage, `pessoas/${Date.now()}-${file.name}`);
        await uploadBytes(storageRef, file);

        url = await getDownloadURL(storageRef);
        path = storageRef.fullPath;
      }

      if (pessoaEditando) {
        await updateDoc(doc(db, "pessoas", pessoaId), {
          nome,
          local,
          telefone,
          instagram,
          foto: url,
          fotoPath: path,
        });
      } else {
        const docRef = await addDoc(collection(db, "pessoas"), {
          nome,
          local,
          telefone,
          instagram,
          foto: url,
          fotoPath: path,
        });

        pessoaId = docRef.id;

        // 🔥 RELACIONAMENTO DINÂMICO
        await addDoc(collection(db, "participacoes"), {
          pessoaId,
          ...contexto,
        });
      }

      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-9999">
      <div className="bg-white p-6 rounded w-96 flex flex-col gap-2">
        <h2 className="font-bold">
          {pessoaEditando ? "Editar" : "Nova"} Pessoa
        </h2>

        <input
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="border p-2"
        />
        <input
          placeholder="Local"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          className="border p-2"
        />
        <input
          placeholder="Telefone"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          className="border p-2"
        />
        <input
          placeholder="Instagram"
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
          className="border p-2"
        />

        <input type="file" onChange={(e) => setFile(e.target.files[0])} />

        <div className="flex justify-end gap-2 mt-2">
          <button onClick={onClose}>Cancelar</button>
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
  );
}

export default PessoaModal;
