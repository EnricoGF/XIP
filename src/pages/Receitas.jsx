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

function Receitas() {
  const { user } = useAuth();

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(getTodayFinanceDate());
  const [editingId, setEditingId] = useState(null);
  const [receitas, setReceitas] = useState([]);

  const carregarReceitas = async () => {
    const q = query(
      collection(db, "receitas"),
      where("userId", "==", user.uid)
    );

    const snapshot = await getDocs(q);

    const lista = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setReceitas(lista);
  };

  useEffect(() => {
    if (user) {
      carregarReceitas();
    }
  }, [user]);

  const limparFormulario = () => {
    setDescricao("");
    setValor("");
    setData(getTodayFinanceDate());
    setEditingId(null);
  };

  const salvarReceita = async (event) => {
    event.preventDefault();

    try {
      const receita = {
        descricao: descricao.trim(),
        valor: Number(valor),
        data,
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
      console.error(error);
    }
  };

  const editarReceita = (receita) => {
    setEditingId(receita.id);
    setDescricao(receita.descricao);
    setValor(String(receita.valor));
    setData(getFinanceDate(receita) || getTodayFinanceDate());
  };

  const totalReceitas = receitas.reduce(
    (total, receita) => total + receita.valor,
    0
  );
  const excluirReceita = async (id) => {
  try {
    await deleteDoc(doc(db, "receitas", id));

    carregarReceitas();
  } catch (error) {
    console.error(error);
  }
};

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
        </div>

        <div className="receitas-list">
          <div className="total-receitas">
            Total: R$ {totalReceitas.toFixed(2)}
          </div>

          <h3>Receitas cadastradas</h3>

          {receitas.length === 0 ? (
            <p>Nenhuma receita cadastrada.</p>
          ) : (
            receitas.map((receita) => (
              <div
  key={receita.id}
  className="receita-item"
>
  <div className="finance-item-info">
    <span>{receita.descricao}</span>
    <small>{formatFinanceDate(receita)}</small>
  </div>

  <div className="receita-actions">
    <strong>
      R$ {receita.valor.toFixed(2)}
    </strong>

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