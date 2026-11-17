import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../services/firebase";
import { ensureCategoryTypes } from "../utils/categoryMigration";
import MainLayout from "../layouts/MainLayout";
import FinanceChart from "../components/FinanceChart";
import { formatFinanceDate, getFinanceDate } from "../utils/financeDate";

function MovementSection({
  title,
  records,
  categories,
  selectedCategory,
  onCategoryChange,
  emptyMessage,
}) {
  const [sortBy, setSortBy] = useState("date-desc");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const hasFilters = Boolean(dateFrom || dateTo || selectedCategory);

  const visibleRecords = [...records]
    .filter((record) => {
      const date = getFinanceDate(record);
      const matchesCategory = !selectedCategory
        || (selectedCategory === "__uncategorized" && !record.categoriaId)
        || record.categoriaId === selectedCategory;
      return (!dateFrom || date >= dateFrom)
        && (!dateTo || date <= dateTo)
        && matchesCategory;
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
  const displayedRecords = hasFilters ? visibleRecords : visibleRecords.slice(0, 5);

  return (
    <section className="dashboard-section">
      <div className="dashboard-section-heading">
        <h3>{title}</h3>
        <div className="movement-section-controls">
          <label className="movement-sort-control">
            <span>Categoria</span>
            <select
              value={selectedCategory}
              onChange={(event) => onCategoryChange(event.target.value)}
            >
              <option value="">Todas</option>
              <option value="__uncategorized">Sem categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.nome}</option>
              ))}
            </select>
          </label>
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
        {hasFilters && (
          <button
            className="movement-filter-clear"
            type="button"
            onClick={() => {
              setDateFrom("");
              setDateTo("");
              onCategoryChange("");
            }}
          >
            Limpar
          </button>
        )}
      </div>

      {records.length === 0 ? (
        <p>{emptyMessage}</p>
      ) : displayedRecords.length === 0 ? (
        <p className="movement-no-results">Nenhuma movimentação encontrada com esses filtros.</p>
      ) : (
        <>
          {displayedRecords.map((record) => (
            <div key={record.id} className="movimentacao-item">
              <div className="dashboard-movement-info">
                <span>{record.descricao}</span>
                {record.categoriaId && categories.some((category) => category.id === record.categoriaId) && (
                  <span className="category-tag">
                    {categories.find((category) => category.id === record.categoriaId).nome}
                  </span>
                )}
              </div>
              <div className="dashboard-movement-details">
                <small>{formatFinanceDate(record)}</small>
                <strong>R$ {Number(record.valor).toFixed(2)}</strong>
              </div>
            </div>
          ))}
          {!hasFilters && visibleRecords.length > 5 && (
            <small className="movement-list-hint">Exibindo 5 de {visibleRecords.length} movimentações</small>
          )}
        </>
      )}
    </section>
  );
}

function Dashboard() {
  const { user } = useAuth();

const [registrosReceitas, setRegistrosReceitas] = useState([]);
const [registrosDespesas, setRegistrosDespesas] = useState([]);
const [categoriasReceitas, setCategoriasReceitas] = useState([]);
const [categoriasDespesas, setCategoriasDespesas] = useState([]);
const [categoriaReceitas, setCategoriaReceitas] = useState("");
const [categoriaDespesas, setCategoriaDespesas] = useState("");
const carregarDados = useCallback(async () => {
  await ensureCategoryTypes(user.uid);
  const receitasQuery = query(
    collection(db, "receitas"),
    where("userId", "==", user.uid)
  );
  const despesasQuery = query(
    collection(db, "despesas"),
    where("userId", "==", user.uid)
  );
  const categoriasQuery = query(
    collection(db, "categorias"),
    where("userId", "==", user.uid)
  );

  const [receitasSnapshot, despesasSnapshot, categoriasSnapshot] = await Promise.all([
    getDocs(receitasQuery),
    getDocs(despesasQuery),
    getDocs(categoriasQuery),
  ]);
  setRegistrosReceitas(receitasSnapshot.docs.map((financeDoc) => ({
    id: financeDoc.id,
    ...financeDoc.data(),
  })));
  setRegistrosDespesas(despesasSnapshot.docs.map((financeDoc) => ({
    id: financeDoc.id,
    ...financeDoc.data(),
  })));
  const categories = categoriasSnapshot.docs.map((categoryDoc) => ({
    id: categoryDoc.id,
    ...categoryDoc.data(),
  }));
  setCategoriasReceitas(categories
    .filter((category) => category.tipo === "receita")
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
  setCategoriasDespesas(categories
    .filter((category) => category.tipo === "despesa")
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
}, [user]);

useEffect(() => {
  if (user) {
    Promise.resolve()
      .then(carregarDados)
      .catch((error) => console.error("Erro ao carregar dados do dashboard:", error));
  }
}, [user, carregarDados]);

const filtrarPorCategoria = (records, categoryId) => records.filter((record) => {
  if (!categoryId) return true;
  if (categoryId === "__uncategorized") return !record.categoriaId;
  return record.categoriaId === categoryId;
});
const receitasFiltradas = filtrarPorCategoria(registrosReceitas, categoriaReceitas);
const despesasFiltradas = filtrarPorCategoria(registrosDespesas, categoriaDespesas);
const totalReceitas = receitasFiltradas.reduce((total, receita) => total + (Number(receita.valor) || 0), 0);
const totalDespesas = despesasFiltradas.reduce((total, despesa) => total + (Number(despesa.valor) || 0), 0);
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
  registrosReceitas={receitasFiltradas}
  registrosDespesas={despesasFiltradas}
/>
      <div className="dashboard-lists">
        <MovementSection
          title="Últimas Receitas"
          records={registrosReceitas}
          categories={categoriasReceitas}
          selectedCategory={categoriaReceitas}
          onCategoryChange={setCategoriaReceitas}
          emptyMessage="Nenhuma receita cadastrada."
        />
        <MovementSection
          title="Últimas Despesas"
          records={registrosDespesas}
          categories={categoriasDespesas}
          selectedCategory={categoriaDespesas}
          onCategoryChange={setCategoriaDespesas}
          emptyMessage="Nenhuma despesa cadastrada."
        />
      </div>
    </MainLayout>
  );
}

export default Dashboard;