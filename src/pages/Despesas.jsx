import { useEffect, useState } from "react";
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
import { formatFinanceDate, getFinanceDate, getTodayFinanceDate } from "../utils/financeDate";
import { FaEdit, FaTrash } from "react-icons/fa";

function Despesas() {
  const { user } = useAuth();

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(getTodayFinanceDate());
  const [editingId, setEditingId] = useState(null);
  const [despesas, setDespesas] = useState([]);

  const carregarDespesas = async () => {
    const q = query(
      collection(db, "despesas"),
      where("userId", "==", user.uid)
    );

    const snapshot = await getDocs(q);

    const lista = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setDespesas(lista);
  };

  useEffect(() => {
    if (user) {
      carregarDespesas();
    }
  }, [user]);

  const limparFormulario = () => {
    setDescricao("");
    setValor("");
    setData(getTodayFinanceDate());
    setEditingId(null);
  };

  const salvarDespesa = async (event) => {
    event.preventDefault();

    try {
      const despesa = {
        descricao: descricao.trim(),
        valor: Number(valor),
        data,
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
      console.error(error);
    }
  };

  const editarDespesa = (despesa) => {
    setEditingId(despesa.id);
    setDescricao(despesa.descricao);
    setValor(String(despesa.valor));
    setData(getFinanceDate(despesa) || getTodayFinanceDate());
  };

  const totalDespesas = despesas.reduce(
    (total, despesa) => total + despesa.valor,
    0
  );
  const excluirDespesa = async (id) => {
  try {
    await deleteDoc(doc(db, "despesas", id));

    carregarDespesas();
  } catch (error) {
    console.error(error);
  }
};

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
        </div>

        <div className="receitas-list">
          <div className="total-despesas">
            Total: R$ {totalDespesas.toFixed(2)}
          </div>

          <h3>Despesas cadastradas</h3>

          {despesas.length === 0 ? (
            <p>Nenhuma despesa cadastrada.</p>
          ) : (
            despesas.map((despesa) => (
              <div
  key={despesa.id}
  className="receita-item"
>
  <div className="finance-item-info">
    <span>{despesa.descricao}</span>
    <small>{formatFinanceDate(despesa)}</small>
  </div>

  <div className="receita-actions">
    <strong>
      R$ {despesa.valor.toFixed(2)}
    </strong>

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