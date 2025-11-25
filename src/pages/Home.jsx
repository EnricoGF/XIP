// src/pages/Home.jsx
import React from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

export default function Home() {
  // Exemplo estático — substitua pelos dados do Firestore
  const transacoes = [
    { id: 1, descricao: "Salário", tipo: "entrada", valor: 3500 },
    { id: 2, descricao: "Supermercado", tipo: "saida", valor: 240 },
  ];

  return (
    <div>
      <Typography variant="h5" gutterBottom>Resumo</Typography>

      <Grid container spacing={2}>
        {transacoes.map((t) => (
          <Grid item xs={12} md={6} key={t.id}>
            <Card sx={{ bgcolor: t.tipo === "entrada" ? "#E6F4EA" : "#FDECEA" }}>
              <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <Typography variant="subtitle1">{t.descricao}</Typography>
                  <Typography variant="caption" color="text.secondary">Categoria • data</Typography>
                </div>
                <Typography variant="h6" sx={{ color: t.tipo === "entrada" ? "green" : "red" }}>
                  {t.tipo === "entrada" ? "+" : "-"} R$ {t.valor}
                </Typography>
              </CardContent>