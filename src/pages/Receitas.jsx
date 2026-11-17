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

function Receitas() {
  const { user } = useAuth();

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(getTodayFinanceDate());
  const [categoriaId, setCategoriaId] = useState("");
  const [nomeCategoria, setNomeCategoria] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [receitas, setReceitas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [erro, setErro] = useState("");

  const carregarReceitas = useCallback(async () => {
    const q = query(
      collection(db, "receitas"),
      where("userId", "==", user.uid)
    );

    const snapshot = await getDocs(q);
    setReceitas(snapshot.docs.map((receitaDoc) => ({
      id: receitaDoc.id,
      ...receitaDoc.data(),
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
    })).filter((categoria) => categoria.tipo === "receita")
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
  }, [user]);

  useEffect(() => {
    if (user) {
      Promise.resolve()
        .then(() => Promise.all([carregarReceitas(), carregarCategorias()]))
        .catch((error) => {
          console.error("Erro ao carregar receitas e categorias:", error);
          setErro("Não foi possível carregar receitas e categorias.");
        });
    }
  }, [user, carregarReceitas, carregarCategorias]);

  const limparFormulario = () => {
    setDescricao("");
    setValor("");
    setData(getTodayFinanceDate());
    setCategoriaId("");
    setEditingId(null);
    setErro("");
  };

  const salvarReceita = async (event) => {
    event.preventDefault();
    setErro("");

    try {
      const receita = {
        descricao: descricao.trim(),
        valor: Number(valor),
        data,
        categoriaId: categoriaId || null,
      };

      if (editingId) {
        await updateDoc(doc(db, "receitas", editingId), receita);
      } else {
        await addDoc(collection(db, "receitas"), {
          userId: user.uid,
          ...receita,
          criadoEm: new Date(),
        });
      }

      limparFormulario();
      await carregarReceitas();
    } catch (error) {
      console.error("Erro ao salvar receita:", error);
      setErro("Não foi possível salvar a receita. Tente novamente.");
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
        tipo: "receita",
        criadoEm: new Date(),
      });

      setCategorias((lista) => [...lista, { id: categoriaRef.id, nome, tipo: "receita" }].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
      setNomeCategoria("");
    } catch (error) {
      console.error("Erro ao criar categoria:", error);
      setErro("Não foi possível criar a categoria. Tente novamente.");
    }
  };

  const editarReceita = (receita) => {
    setEditingId(receita.id);
    setDescricao(receita.descricao);
    setValor(String(receita.valor));
    setData(getFinanceDate(receita) || getTodayFinanceDate());
    setCategoriaId(receita.categoriaId || "");
    setErro("");
  };

  const excluirReceita = async (id) => {
    setErro("");
    try {
      await deleteDoc(doc(db, "receitas", id));
      await carregarReceitas();
    } catch (error) {
      console.error("Erro ao excluir receita:", error);
      setErro("Não foi possível excluir a receita. Tente novamente.");
    }
  };

  const totalReceitas = receitas.reduce(
    (total, receita) => total + receita.valor,
    0
  );
  const categoriasPorId = new Map(categorias.map((categoria) => [categoria.id, categoria.nome]));

  return (
    <MainLayout title="Receitas">
      <div className="receitas-page">
        <div className="receitas-card">
          <h3>{editingId ? "Editar Receita" : "Nova Receita"}</h3>

          <form onSubmit={salvarReceita} className="finance-form">
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

            <label className="finance-date-label" htmlFor="receita-data">Data da receita</label>
            <input
              id="receita-data"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              required
            />

            <label className="finance-date-label" htmlFor="receita-categoria">Categoria</label>
            <select
              id="receita-categoria"
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
                {editingId ? "Salvar alterações" : "Salvar Receita"}
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
            Total: R$ {totalReceitas.toFixed(2)}
          </div>

          <h3>Receitas cadastradas</h3>

          {receitas.length === 0 ? (
            <p>Nenhuma receita cadastrada.</p>
          ) : (
            receitas.map((receita) => (
              <div key={receita.id} className="receita-item">
                <div className="finance-item-info">
                  <span>{receita.descricao}</span>
                  <small>{formatFinanceDate(receita)}</small>
                  {categoriasPorId.has(receita.categoriaId) && (
                    <span className="category-tag">{categoriasPorId.get(receita.categoriaId)}</span>
                  )}
                </div>

                <div className="receita-actions">
                  <strong>R$ {receita.valor.toFixed(2)}</strong>

                  <button
                    className="btn-edit"
                    type="button"
                    aria-label={`Editar ${receita.descricao}`}
                    title="Editar receita"
                    onClick={() => editarReceita(receita)}
                  >
                    <FaEdit />
                  </button>

                  <button
                    className="btn-delete"
                    type="button"
                    aria-label={`Excluir ${receita.descricao}`}
                    title="Excluir receita"
                    onClick={() => excluirReceita(receita.id)}
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

export default Receitas;
