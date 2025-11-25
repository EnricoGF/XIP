import React, { useState } from "react";
import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function NovoLancamento() {
  const [tipo, setTipo] = useState("entrada");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [erro, setErro] = useState("");
  const navigate = useNavigate();

  const handleSalvar = async (e) => {
    e.preventDefault();

    if (!descricao || !valor) {
      setErro("Preencha todos os campos!");
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        setErro("Usuário não autenticado.");
        return;
      }

      await addDoc(collection(db, "lancamentos"), {
        usuarioId: user.uid,
        tipo,
        descricao,
        valor: parseFloat(valor),
        data: serverTimestamp(),
      });

      navigate("/dashboard"); // volta para a tela de lançamentos
    } catch (error) {
      console.error("Erro ao salvar lançamento:", error);
      setErro("Erro ao salvar lançamento: " + error.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", textAlign: "center" }}>
      <h2>Novo Lançamento</h2>
      <form onSubmit={handleSalvar}>
        <div style={{ marginBottom: 10 }}>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>
        </div>

        <input
          type="text"
          placeholder="Descrição"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
        <br />
        <input
          type="number"
          placeholder="Valor"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
        <br />
        <button type="submit">Salvar</button>
      </form>

      {erro && <p style={{ color: "red" }}>{erro}</p>}
    </div>
  );
}