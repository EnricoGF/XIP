import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { Typography, Card, CardContent, Grid } from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function DashboardGrafico() {
  const [lancamentos, setLancamentos] = useState([]);
  const [previsao, setPrevisao] = useState([]);

  // Função utilitária para converter Timestamp do Firestore em Date
  const timestampParaDate = (data) => {
    if (!data) return null;
    if (data.seconds !== undefined) {
      return new Date(data.seconds * 1000);
    }
    return new Date(data);
  };

  // Carregar lançamentos do Firebase
  const carregarLancamentos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "lancamentos"));
      const dados = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          data: timestampParaDate(data.data),
          valor: parseFloat(data.valor) || 0,
        };
      });
      setLancamentos(dados);
    } catch (error) {
      console.error("Erro ao carregar lançamentos:", error);
    }
  };

  useEffect(() => {
    carregarLancamentos();
  }, []);

  // Calcular previsão para próximos 6 meses
  useEffect(() => {
    if (!lancamentos.length) return;

    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    // Filtrar lançamentos do mês atual
    const lancamentosMesAtual = lancamentos.filter(
      (l) => l.data.getMonth() === mesAtual && l.data.getFullYear() === anoAtual
    );

    const entradas = lancamentosMesAtual
      .filter((l) => l.tipo === "entrada")
      .reduce((acc, l) => acc + l.valor, 0);

    const saidas = lancamentosMesAtual
      .filter((l) => l.tipo === "saida")
      .reduce((acc, l) => acc + l.valor, 0);

    const saldoAtual = entradas - saidas;

    // Previsão para os próximos 6 meses
    const meses = [
      "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
      "Jul", "Ago", "Set", "Out", "Nov", "Dez"
    ];

    const dadosPrevisao = [];

    for (let i = 1; i <= 6; i++) {
      const mes = (mesAtual + i) % 12;
      const ano = anoAtual + Math.floor((mesAtual + i) / 12);
      dadosPrevisao.push({
        mes: `${meses[mes]} ${ano}`,
        saldo: saldoAtual, // mantém o saldo atual constante
      });
    }

    setPrevisao(dadosPrevisao);
  }, [lancamentos]);

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Previsão Financeira - Próximos 6 Meses
      </Typography>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={previsao} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="saldo" stroke="#1f77b4" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {previsao.map((p, index) => (
          <Grid item xs={12} sm={4} key={index}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1">{p.mes}</Typography>
                <Typography variant="h6" color={p.saldo >= 0 ? "green" : "red"}>
                  R$ {p.saldo.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}