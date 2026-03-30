import { useParams } from "react-router-dom";
import "../index.css";

function Pessoas() {
  const { timeId } = useParams();

  const time = times.find((g) => g.id === timeId);

  if (!time) return <p>Time não encontrado</p>;

  return (
    <div className="container">
      <h2>Grupo {time.nome}</h2>
      <img src={time.foto} alt={time.nome} className="foto-grupo" />
      <h3>Integrantes</h3>

      <div className="grid-pessoas">
        {time.pessoas.map((p, i) => (
          <div key={i} className="card-pessoa">
            <img src={p.foto} alt={p.nome} />

            <div className="info">
              <h3>{p.nome}</h3>
              <p>📍 {p.local}</p>
              <a
                href={`https://instagram.com/${p.instagram.replace("@", "")}`}
                target="_blank"
              >
                {p.instagram}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Pessoas;
