import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

function Times() {
  const { grupoId, retiroId } = useParams();
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading)
    return (
      <p className="text-center p-10 dark:text-gray-400">
        Carregando grupos...
      </p>
    );

  if (lista.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center p-10">
        <h2 className="text-2xl font-bold dark:text-white mb-2">
          Grupo de Cursistas
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Nenhum grupo encontrado para este retiro.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8 border-b dark:border-gray-700 pb-4">
        <h2 className="text-3xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">
          Grupos de Partilha
        </h2>
        <span className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-bold">
          {lista.length} Grupos
        </span>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6">
        {lista.map((time) => (
          <div
            key={time.id}
            className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
          >
            {/* Foto do Time */}
            <div className="h-48 overflow-hidden relative">
              <img
                src={time.foto || "/img/placeholder-team.jpg"}
                alt={time.nome}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="p-5 text-center">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                {time.nome}
              </h3>

              <Link
                to={`/grupo/${grupoId}/retiro/${retiroId}/times/${time.id}/pessoas`}
                className="inline-block w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 transition-all shadow-sm"
              >
                Ver cursistas
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Times;
