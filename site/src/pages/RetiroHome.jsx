import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db, auth, storage } from "../firebase";
import imageCompression from "browser-image-compression";
import { deleteObject, ref as refStorage } from "firebase/storage";
import { Trash2 } from "lucide-react";

import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  addDoc,
  orderBy,
  deleteDoc,
} from "firebase/firestore";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { onAuthStateChanged } from "firebase/auth";
import { Download } from "lucide-react";

function RetiroHome() {
  const { retiroId } = useParams();

  const [retiro, setRetiro] = useState(null);
  const [fotos, setFotos] = useState([]);
  const [visible, setVisible] = useState(6);
  const [isAdmin, setIsAdmin] = useState(false);

  // 🔐 ADMIN
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsAdmin(!!user);
    });
    return () => unsub();
  }, []);

  // 🔥 RETIRO
  useEffect(() => {
    if (!retiroId) return;

    const unsub = onSnapshot(doc(db, "retiros", retiroId), (docSnap) => {
      if (docSnap.exists()) {
        setRetiro({ id: docSnap.id, ...docSnap.data() });
      }
    });

    return () => unsub();
  }, [retiroId]);

  // 🖼️ FOTOS (NOVO MODELO)
  useEffect(() => {
    if (!retiroId) return;

    const q = query(collection(db, "fotos"), where("retiroId", "==", retiroId));

    const unsub = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        url: doc.data().url,
      }));
      setFotos(lista);
    });

    return () => unsub();
  }, [retiroId]);

  const excluirFoto = async (e, foto) => {
    e.stopPropagation();

    if (!confirm("Excluir foto?")) return;

    const storageRef = refStorage(storage, foto.url);
    await deleteObject(storageRef);

    await deleteDoc(doc(db, "fotos", foto.id));
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);

    for (let file of files) {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: "image/jpeg",
      });

      const storageRef = ref(storage, `retiros/${retiroId}/${Date.now()}.jpg`);

      await uploadBytes(storageRef, compressedFile);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, "fotos"), {
        retiroId,
        url,
        createdAt: Date.now(),
      });
    }

    alert("Fotos enviadas!");
  };

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 200
      ) {
        setVisible((prev) => prev + 6);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!retiro) return <p className="text-center mt-10">Carregando...</p>;

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
      {/* HERO */}
      <div className="relative h-100 rounded-2xl overflow-hidden m-4 shadow-xl">
        <img src={retiro.imagem} className="w-full h-full object-cover" />
      </div>

      {/* CONTEUDO */}
      <div className="p-6 md:p-10 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Fotos do Retiro
          </h2>

          {/* ADMIN UPLOAD */}
          {isAdmin && (
            <label className="cursor-pointer bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition shadow">
              📤 Enviar fotos
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* GRID PINTEREST */}
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {fotos.slice(0, visible).map((foto, i) => (
            <div
              key={foto.id}
              className="relative break-inside-avoid rounded-xl overflow-hidden shadow-md hover:shadow-xl transition group"
            >
              <img
                src={foto.url}
                loading="lazy"
                className="w-full object-cover hover:scale-105 transition duration-300"
              />

              {/* 🗑️ ADMIN */}
              {isAdmin && (
                <button
                  onClick={(e) => excluirFoto(e, foto)}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* LOADING */}
        {visible < fotos.length && (
          <p className="text-center mt-6 text-gray-500 animate-pulse">
            Carregando mais fotos...
          </p>
        )}
      </div>
    </div>
  );
}

export default RetiroHome;
