import { useCallback, useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../contexts/AuthContext";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { ensureCategoryTypes } from "../utils/categoryMigration";
import { formatFinanceDate, getFinanceDate, getTodayFinanceDate } from "../utils/financeDate";
import { FaEdit, FaTrash } from "react-icons/fa";

function Despesas() {
  const { user } = useAuth();

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(getTodayFinanceDate());
  const [categoriaId, setCategoriaId] = useState("");
  const [nomeCategoria, setNomeCategoria] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [despesas, setDespesas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [erro, setErro] = useState("");

  const carregarDespesas = useCallback(async () => {
    const q = query(
      collection(db, "despesas"),
      where("userId", "==", user.uid)
    );

    const snapshot = await getDocs(q);
    setDespesas(snapshot.docs.map((despesaDoc) => ({
      id: despesaDoc.id,
      ...despesaDoc.data(),
    })));
  }, [user]);

  const carregarCategorias = useCallback(async () => {
    await ensureCategoryTypes(user.uid);
    const q = query(
      collection(db, "categorias"),
      where("userId", "==", user.uid)
    );

    const snapshot = await getDocs(q);
    setCategorias(snapshot.docs.map((categoriaDoc) => ({
      id: categoriaDoc.id,
      ...categoriaDoc.data(),
    })).filter((categoria) => categoria.tipo === "despesa")
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
  }, [user]);

  useEffect(() => {
    if (user) {
      Promise.resolve()
        .then(() => Promise.all([carregarDespesas(), carregarCategorias()]))
        .catch((error) => {
          console.error("Erro ao carregar despesas e categorias:", error);
          setErro("Não foi possível carregar despesas e categorias.");
        });
    }
  }, [user, carregarDespesas, carregarCategorias]);

  const limparFormulario = () => {
    setDescricao("");
    setValor("");
    setData(getTodayFinanceDate());
    setCategoriaId("");
    setEditingId(null);
    setErro("");
  };

  const salvarDespesa = async (event) => {
    event.preventDefault();
    setErro("");

    try {
      const despesa = {
        descricao: descricao.trim(),
        valor: Number(valor),
        data,
        categoriaId: categoriaId || null,
      };

      if (editingId) {
        await updateDoc(doc(db, "despesas", editingId), despesa);
      } else {
        await addDoc(collection(db, "despesas"), {
          userId: user.uid,
          ...despesa,
          criadoEm: new Date(),
        });
      }

      limparFormulario();
      await carregarDespesas();
    } catch (error) {
      console.error("Erro ao salvar despesa:", error);
      setErro("Não foi possível salvar a despesa. Tente novamente.");
    }
  };

  const salvarCategoria = async (event) => {
    event.preventDefault();
    const nome = nomeCategoria.trim();

    if (!nome) {
      setErro("Informe o nome da categoria.");
      return;
    }

    if (categorias.some((categoria) => categoria.nome.toLocaleLowerCase("pt-BR") === nome.toLocaleLowerCase("pt-BR"))) {
      setErro("Já existe uma categoria com esse nome.");
      return;
    }

    setErro("");
    try {
      const categoriaRef = await addDoc(collection(db, "categorias"), {
        userId: user.uid,
        nome,
        tipo: "despesa",
        criadoEm: new Date(),
      });

      setCategorias((lista) => [...lista, { id: categoriaRef.id, nome, tipo: "despesa" }].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
      setNomeCategoria("");
    } catch (error) {
      console.error("Erro ao criar categoria:", error);
      setErro("Não foi possível criar a categoria. Tente novamente.");
    }
  };

  const editarDespesa = (despesa) => {
    setEditingId(despesa.id);
    setDescricao(despesa.descricao);
    setValor(String(despesa.valor));
    setData(getFinanceDate(despesa) || getTodayFinanceDate());
    setCategoriaId(despesa.categoriaId || "");
    setErro("");
  };

  const excluirDespesa = async (id) => {
    setErro("");
    try {
      await deleteDoc(doc(db, "despesas", id));
      await carregarDespesas();
    } catch (error) {
      console.error("Erro ao excluir despesa:", error);
      setErro("Não foi possível excluir a despesa. Tente novamente.");
    }
  };

  const totalDespesas = despesas.reduce(
    (total, despesa) => total + despesa.valor,
    0
  );
  const categoriasPorId = new Map(categorias.map((categoria) => [categoria.id, categoria.nome]));

  return (
    <MainLayout title="Despesas">
      <div className="receitas-page">
        <div className="receitas-card">
          <h3>{editingId ? "Editar Despesa" : "Nova Despesa"}</h3>

          <form onSubmit={salvarDespesa} className="finance-form">
            <input
              type="text"
              placeholder="Descrição"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              required
            />

            <input
              type="number"
              placeholder="Valor"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              min="0.01"
              step="0.01"
              required
            />

            <label className="finance-date-label" htmlFor="despesa-data">Data da despesa</label>
            <input
              id="despesa-data"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              required
            />

            <label className="finance-date-label" htmlFor="despesa-categoria">Categoria</label>
            <select
              id="despesa-categoria"
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
            >
              <option value="">Sem categoria</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>
              ))}
            </select>

            <div className="finance-form-actions">
              <button className="btn-primary" type="submit">
                {editingId ? "Salvar alterações" : "Salvar Despesa"}
              </button>
              {editingId && (
                <button className="btn-secondary" type="button" onClick={limparFormulario}>
                  Cancelar
                </button>
              )}
            </div>
          </form>

          <div className="category-manager">
            <h4>Categorias</h4>
            <form onSubmit={salvarCategoria} className="category-form">
              <input
                type="text"
                placeholder="Nome da categoria"
                value={nomeCategoria}
                onChange={(e) => setNomeCategoria(e.target.value)}
                aria-label="Nome da categoria"
                maxLength={40}
                required
              />
              <button className="btn-secondary" type="submit">Criar categoria</button>
            </form>
            {categorias.length > 0 ? (
              <div className="category-list" aria-label="Categorias criadas">
                {categorias.map((categoria) => (
                  <span className="category-tag" key={categoria.id}>{categoria.nome}</span>
                ))}
              </div>
            ) : (
              <p className="category-empty">Nenhuma categoria criada.</p>
            )}
          </div>

          {erro && <p className="finance-error" role="alert">{erro}</p>}
        </div>

        <div className="receitas-list">
          <div className="finance-total">
            Total: R$ {totalDespesas.toFixed(2)}
          </div>

          <h3>Despesas cadastradas</h3>

          {despesas.length === 0 ? (
            <p>Nenhuma despesa cadastrada.</p>
          ) : (
            despesas.map((despesa) => (
              <div key={despesa.id} className="receita-item">
                <div className="finance-item-info">
                  <span>{despesa.descricao}</span>
                  <small>{formatFinanceDate(despesa)}</small>
                  {categoriasPorId.has(despesa.categoriaId) && (
                    <span className="category-tag">{categoriasPorId.get(despesa.categoriaId)}</span>
                  )}
                </div>

                <div className="receita-actions">
                  <strong>R$ {despesa.valor.toFixed(2)}</strong>

                  <button
                    className="btn-edit"
                    type="button"
                    aria-label={`Editar ${despesa.descricao}`}
                    title="Editar despesa"
                    onClick={() => editarDespesa(despesa)}
                  >
                    <FaEdit />
                  </button>

                  <button
                    className="btn-delete"
                    type="button"
                    aria-label={`Excluir ${despesa.descricao}`}
                    title="Excluir despesa"
                    onClick={() => excluirDespesa(despesa.id)}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
}

export default Despesas;
