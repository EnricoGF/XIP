import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../services/firebase";
import MainLayout from "../layouts/MainLayout";
import FinanceChart from "../components/FinanceChart";
import { formatFinanceDate, getFinanceDate } from "../utils/financeDate";

function MovementSection({ title, records, emptyMessage }) {
  const [sortBy, setSortBy] = useState("date-desc");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const hasDateFilter = Boolean(dateFrom || dateTo);

  const visibleRecords = [...records]
    .filter((record) => {
      const date = getFinanceDate(record);
      return (!dateFrom || date >= dateFrom) && (!dateTo || date <= dateTo);
    })
    .sort((left, right) => {
      if (sortBy === "value-desc") return Number(right.valor) - Number(left.valor);
      if (sortBy === "value-asc") return Number(left.valor) - Number(right.valor);

      const leftDate = getFinanceDate(left);
      const rightDate = getFinanceDate(right);
      return sortBy === "date-asc"
        ? leftDate.localeCompare(rightDate)
        : rightDate.localeCompare(leftDate);
    });
  const displayedRecords = hasDateFilter ? visibleRecords : visibleRecords.slice(0, 5);

  return (
    <section className="dashboard-section">
      <div className="dashboard-section-heading">
        <h3>{title}</h3>
        <label className="movement-sort-control">
          <span>Ordenar</span>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="date-desc">Data: mais recente</option>
            <option value="date-asc">Data: mais antiga</option>
            <option value="value-desc">Valor: maior</option>
            <option value="value-asc">Valor: menor</option>
          </select>
        </label>
      </div>

      <div className="movement-date-filters">
        <label>
          <span>De</span>
          <input
            aria-label={`Data inicial de ${title.toLowerCase()}`}
            type="date"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(event) => setDateFrom(event.target.value)}
          />
        </label>
        <label>
          <span>Até</span>
          <input
            aria-label={`Data final de ${title.toLowerCase()}`}
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(event) => setDateTo(event.target.value)}
          />
        </label>
        {hasDateFilter && (
          <button
            className="movement-filter-clear"
            type="button"
            onClick={() => {
              setDateFrom("");
              setDateTo("");
            }}
          >
            Limpar
          </button>
        )}
      </div>

      {records.length === 0 ? (
        <p>{emptyMessage}</p>
      ) : displayedRecords.length === 0 ? (
        <p className="movement-no-results">Nenhuma movimentação nesse período.</p>
      ) : (
        <>
          {displayedRecords.map((record) => (
            <div key={record.id} className="movimentacao-item">
              <span>{record.descricao}</span>
              <div className="dashboard-movement-details">
                <small>{formatFinanceDate(record)}</small>
                <strong>R$ {Number(record.valor).toFixed(2)}</strong>
              </div>
            </div>
          ))}
          {!hasDateFilter && records.length > 5 && (
            <small className="movement-list-hint">Exibindo 5 de {records.length} movimentações</small>
          )}
        </>
      )}
    </section>
  );
}

function Dashboard() {
  const { user } = useAuth();

const [totalReceitas, setTotalReceitas] = useState(0);
const [totalDespesas, setTotalDespesas] = useState(0);
const [registrosReceitas, setRegistrosReceitas] = useState([]);
const [registrosDespesas, setRegistrosDespesas] = useState([]);
const carregarDados = async () => {
  try {
    const receitasQuery = query(
      collection(db, "receitas"),
      where("userId", "==", user.uid)
    );

    const despesasQuery = query(
      collection(db, "despesas"),
      where("userId", "==", user.uid)
    );

    const receitasSnapshot = await getDocs(receitasQuery);
    const despesasSnapshot = await getDocs(despesasQuery);
    const receitasLista = [];
const despesasLista = [];

    let receitas = 0;
    let despesas = 0;

    receitasSnapshot.forEach((doc) => {
  receitas += doc.data().valor;

  receitasLista.push({
    id: doc.id,
    ...doc.data(),
  });
});

    despesasSnapshot.forEach((doc) => {
  despesas += doc.data().valor;

  despesasLista.push({
    id: doc.id,
    ...doc.data(),
  });
});

    setTotalReceitas(receitas);
    setTotalDespesas(despesas);
    setRegistrosReceitas(receitasLista);
    setRegistrosDespesas(despesasLista);

  } catch (error) {
    console.error(error);
  }
};
useEffect(() => {
  if (user) {
    carregarDados();
  }
}, [user]);
const saldoAtual = totalReceitas - totalDespesas;
  return (
    <MainLayout title="Dashboard">
      <div className="cards">

        <div className="card">
          <h3>Saldo Atual</h3>
          <h2
  style={{
    color: saldoAtual >= 0 ? "#22c55e" : "#ef4444",
  }}
>
  R$ {saldoAtual.toFixed(2)}
</h2> 
        </div>

        <div className="card">
          <h3>Receitas</h3>
          <p>R$ {totalReceitas.toFixed(2)}</p>
        </div>

        <div className="card">
          <h3>Despesas</h3>
          <p>R$ {totalDespesas.toFixed(2)}</p>
        </div>

      </div>
      <FinanceChart
  receitas={totalReceitas}
  despesas={totalDespesas}
  registrosReceitas={registrosReceitas}
  registrosDespesas={registrosDespesas}
/>
      <div className="dashboard-lists">
        <MovementSection
          title="Últimas Receitas"
          records={registrosReceitas}
          emptyMessage="Nenhuma receita cadastrada."
        />
        <MovementSection
          title="Últimas Despesas"
          records={registrosDespesas}
          emptyMessage="Nenhuma despesa cadastrada."
        />
      </div>
    </MainLayout>
  );
}

export default Dashboard;