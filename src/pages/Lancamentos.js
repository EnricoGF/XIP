import React, { useEffect, useState } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function Lancamentos() {
  const [lancamentos, setLancamentos] = useState([]);
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    // Ouve o usuário logado
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUsuario(user);
      } else {
        setUsuario(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const carregarLancamentos = async () => {
      if (!usuario) return;

      try {
        const q = query(
          collection(db, "lancamentos"),
          where("usuarioId", "==", usuario.uid),
          orderBy("data", "desc")
        );

        const snapshot = await getDocs(q);
        const dados = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setLancamentos(dados);
      } catch (error) {
        console.error("Erro ao carregar lançamentos:", error);
      }
    };

    carregarLancamentos();
  }, [usuario]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Meus Lançamentos</h2>

      {lancamentos.length === 0 ? (
        <p>Nenhum lançamento encontrado.</p>
      ) : (
        <ul>
          {lancamentos.map((lanc) => (
            <li key={lanc.id}>
              <strong>{lanc.descricao}</strong> — R${lanc.valor} — {lanc.tipo}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}