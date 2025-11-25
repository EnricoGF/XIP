import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from "@mui/material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// 🔵 IMPORTS NECESSÁRIOS PARA O GRÁFICO
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function DashboardCompleto() {
  const [lancamentos, setLancamentos] = useState([]);
  const [mesSelecionado, setMesSelecionado] = useState("");
  const [anoSelecionado, setAnoSelecionado] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [previsao, setPrevisao] = useState([]); // 🔵 NECESSÁRIO PARA O GRÁFICO

  const auth = getAuth();
  const uid = auth.currentUser?.uid;

  const categoriasPredefinidas = [
    "Gasto Fixo",
    "Importante",
    "Superficial",
    "Mensalidade",
    "Lazer",
    "Saúde",
    "Educação",
    "Moradia",
    "Investimento",
    "Transporte",
    "Mercado",
    "Renda Fixa",
    "Renda Extra",
    "Salário",
    "Rendimentos"
  ];

  const timestampParaDate = (data) => {
    if (!data) return null;
    if (data.seconds !== undefined) return new Date(data.seconds * 1000);
    return new Date(data);
  };

  const carregarLancamentos = async () => {
    if (!uid) return;
    try {
      const q = query(collection(db, "lancamentos"), where("usuarioId", "==", uid));
      const querySnapshot = await getDocs(q);
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
  }, [uid]);

  const formatarData = (data) => {
    if (!data) return "";
    return data.toLocaleDateString("pt-BR");
  };

  const filtrarLancamentos = () => {
    return lancamentos.filter((l) => {
      const mes = l.data.getMonth() + 1;
      const ano = l.data.getFullYear();

      const mesOk = !mesSelecionado || mes === parseInt(mesSelecionado);
      const anoOk = !anoSelecionado || ano === parseInt(anoSelecionado);
      const tipoOk = tipoFiltro === "todos" || l.tipo === tipoFiltro;
      const categoriaOk = !categoriaFiltro || l.categoria === categoriaFiltro;

      return mesOk && anoOk && tipoOk && categoriaOk;
    });
  };

  const lancamentosFiltrados = filtrarLancamentos();

  const totalEntradas = lancamentosFiltrados
    .filter((l) => l.tipo === "entrada")
    .reduce((acc, l) => acc + l.valor, 0);

  const totalSaidas = lancamentosFiltrados
    .filter((l) => l.tipo === "saida")
    .reduce((acc, l) => acc + l.valor, 0);

  const saldo = totalEntradas - totalSaidas;

  const totaisPorCategoria = categoriasPredefinidas
    .map((cat) => {
      const total = lancamentosFiltrados
        .filter((l) => l.categoria === cat)
        .reduce((acc, l) => acc + l.valor, 0);

      return { categoria: cat, total };
    })
    .filter((item) => item.total !== 0);

  // 🔵 USEEFFECT DA PREVISÃO (necessário para o gráfico)
  useEffect(() => {
    if (!mesSelecionado || !anoSelecionado) {
      setPrevisao([]);
      return;
    }

    const mesAtual = parseInt(mesSelecionado);
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    const dados = [
      { mes: meses[mesAtual - 1], saldo: saldo },
      { mes: meses[(mesAtual) % 12], saldo: saldo },
      { mes: meses[(mesAtual + 1) % 12], saldo: saldo },
      { mes: meses[(mesAtual + 2) % 12], saldo: saldo },
    ];

    setPrevisao(dados);
  }, [mesSelecionado, anoSelecionado, saldo]);

  const gerarRelatorioPDF = () => {
    if (!lancamentosFiltrados.length) {
      alert("Não há lançamentos!");
      return;
    }

    const doc = new jsPDF();
    doc.text("Relatório Financeiro - XIP", 14, 15);

    const body = lancamentosFiltrados.map((l) => [
      l.descricao,
      l.tipo,
      l.categoria,
      `R$ ${l.valor.toFixed(2)}`,
      formatarData(l.data),
    ]);

    autoTable(doc, {
      head: [["Descrição", "Tipo", "Categoria", "Valor", "Data"]],
      body,
      startY: 25,
      styles: { fontSize: 10 },
    });

    doc.save("relatorio.pdf");
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Dashboard Financeiro
      </Typography>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <Button
          variant="contained"
          color="success"
          onClick={() => (window.location.href = "/dashboard/novo")}
        >
          Novo Lançamento
        </Button>

        {/* 🔵 BOTÃO PDF */}
        <Button
          variant="contained"
          color="primary"
          onClick={gerarRelatorioPDF}
          sx={{ ml: 2 }}
        >
          Gerar Relatório PDF
        </Button>
      </div>

      {/* Filtros */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <InputLabel>Mês</InputLabel>
            <Select value={mesSelecionado} onChange={(e) => setMesSelecionado(e.target.value)} size="small">
              <MenuItem value="">Todos</MenuItem>
              {[...Array(12)].map((_, i) => (
                <MenuItem key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString("pt-BR", { month: "long" })}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <InputLabel>Ano</InputLabel>
            <Select value={anoSelecionado} onChange={(e) => setAnoSelecionado(e.target.value)} size="small">
              <MenuItem value="">Todos</MenuItem>
              {[2023, 2024, 2025].map((ano) => (
                <MenuItem key={ano} value={ano}>
                  {ano}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <InputLabel>Tipo</InputLabel>
            <Select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)} size="small">
              <MenuItem value="todos">Todos</MenuItem>
              <MenuItem value="entrada">Entradas</MenuItem>
              <MenuItem value="saida">Saídas</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <InputLabel>Categoria</InputLabel>
            <Select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)} size="small">
              <MenuItem value="">Todas</MenuItem>
              {categoriasPredefinidas.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
	{/* ================================
      DASHBOARD RESUMIDO FINAL
================================ */}
<Typography variant="h4" sx={{ mt: 6, mb: 3 }}>
  Visão Geral do Mês
</Typography>

<Grid container spacing={3}>

  {/* Total de Entradas */}
  <Grid item xs={12} sm={4}>
    <Card sx={{ p: 2, textAlign: "center", background: "#e8f5e9" }}>
      <Typography variant="h6">Entradas</Typography>
      <Typography variant="h4" sx={{ fontWeight: "bold", color: "#2e7d32" }}>
        R$ {totalEntradas.toFixed(2)}
      </Typography>
    </Card>
  </Grid>

  {/* Total de Saídas */}
  <Grid item xs={12} sm={4}>
    <Card sx={{ p: 2, textAlign: "center", background: "#ffebee" }}>
      <Typography variant="h6">Saídas</Typography>
      <Typography variant="h4" sx={{ fontWeight: "bold", color: "#c62828" }}>
        R$ {totalSaidas.toFixed(2)}
      </Typography>
    </Card>
  </Grid>

  {/* Saldo Final */}
  <Grid item xs={12} sm={4}>
    <Card sx={{ p: 2, textAlign: "center", background: "#e3f2fd" }}>
      <Typography variant="h6">Saldo Final</Typography>
      <Typography
        variant="h4"
        sx={{
          fontWeight: "bold",
          color: saldo >= 0 ? "#1565c0" : "#c62828",
        }}
      >
        R$ {saldo.toFixed(2)}
      </Typography>
    </Card>
  </Grid>
</Grid>

<Typography variant="h4" sx={{ mt: 6, mb: 3 }}>
  Totais por Categoria
</Typography>

<Grid container spacing={2} sx={{ mb: 4 }}>
  {categoriasPredefinidas.map((cat) => {
    const totalEntradasCat = lancamentosFiltrados
      .filter((l) => l.categoria === cat && l.tipo === "entrada")
      .reduce((acc, l) => acc + l.valor, 0);

    const totalSaidasCat = lancamentosFiltrados
      .filter((l) => l.categoria === cat && l.tipo === "saida")
      .reduce((acc, l) => acc + l.valor, 0);

    if (totalEntradasCat === 0 && totalSaidasCat === 0) return null;

    return (
      <Grid item xs={12} sm={4} key={cat}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1">{cat}</Typography>
            {totalEntradasCat > 0 && (
              <Typography variant="body1" sx={{ color: "green" }}>
                Entradas: R$ {totalEntradasCat.toFixed(2)}
              </Typography>
            )}
            {totalSaidasCat > 0 && (
              <Typography variant="body1" sx={{ color: "red" }}>
                Saídas: R$ {totalSaidasCat.toFixed(2)}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    );
  })}
</Grid>

      <Typography variant="h4" sx={{ mt: 6, mb: 3 }}>
  	Lançamentos
	</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ color: "green", mb: 1 }}>
            Entradas
          </Typography>

          {lancamentosFiltrados
            .filter((l) => l.tipo === "entrada")
            .map((l) => (
              <Card key={l.id} sx={{ mb: 1 }}>
                <CardContent>
                  <Typography><strong>{l.descricao}</strong></Typography>
                  <Typography>Categoria: {l.categoria}</Typography>
                  <Typography sx={{ color: "green" }}>
                    Valor: R$ {l.valor.toFixed(2)}
                  </Typography>
                  <Typography variant="body2">{formatarData(l.data)}</Typography>
                </CardContent>
              </Card>
            ))}
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ color: "red", mb: 1 }}>
            Saídas
          </Typography>

          {lancamentosFiltrados
            .filter((l) => l.tipo === "saida")
            .map((l) => (
              <Card key={l.id} sx={{ mb: 1 }}>
                <CardContent>
                  <Typography><strong>{l.descricao}</strong></Typography>
                  <Typography>Categoria: {l.categoria}</Typography>
                  <Typography sx={{ color: "red" }}>
                    Valor: R$ {l.valor.toFixed(2)}
                  </Typography>
                  <Typography variant="body2">{formatarData(l.data)}</Typography>
                </CardContent>
              </Card>
            ))}
        </Grid>
      </Grid>
	{/* ============================  
      GRÁFICO DE PROJEÇÃO ACUMULADA  
============================= */}
<Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
  Projeção dos Próximos 3 Meses (Saldo Acumulado)
</Typography>

<Card sx={{ p: 2, mb: 4 }}>
  <ResponsiveContainer width="100%" height={250}>
    <LineChart
      data={[
        { mes: "Mês Atual", saldo: saldo },
        { mes: "Próximo Mês", saldo: saldo * 2 },
        { mes: "Daqui 2 Meses", saldo: saldo * 3 },
        { mes: "Daqui 3 Meses", saldo: saldo * 4 },
      ]}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="mes" />
      <YAxis />
      <Tooltip formatter={(v) => `R$ ${v.toFixed(2)}`} />
      <Line
        type="monotone"
        dataKey="saldo"
        stroke="#1565c0"
        strokeWidth={3}
        dot={{ r: 5 }}
      />
    </LineChart>
  </ResponsiveContainer>
</Card>
    </div>
  );
}
