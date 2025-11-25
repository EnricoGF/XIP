import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
} from "@mui/material";

export default function NovoLancamento() {
  const [tipo, setTipo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: "", severity: "success" });

  const navigate = useNavigate();

  // Lista de categorias pré-definidas
  const categorias = [
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

  const handleSalvar = async () => {
    if (!tipo || !descricao || !valor || !categoria) {
      setAlert({ open: true, message: "Preencha todos os campos!", severity: "warning" });
      return;
    }

    // 🚫 Bloqueia valores negativos mesmo se alguém tentar forçar via inspeção
    if (parseFloat(valor) < 0) {
      setAlert({ open: true, message: "O valor não pode ser negativo!", severity: "warning" });
      return;
    }

    try {
      setLoading(true);
      const usuario = auth.currentUser;
      if (!usuario) throw new Error("Usuário não autenticado.");

      await addDoc(collection(db, "lancamentos"), {
        usuarioId: usuario.uid,
        tipo,
        descricao,
        valor: parseFloat(valor),
        categoria,
        data: new Date().toISOString(),
      });

      setAlert({ open: true, message: "Lançamento adicionado com sucesso!", severity: "success" });
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      setAlert({ open: true, message: "Erro ao salvar lançamento.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        minHeight: "80vh",
        p: 3,
        backgroundColor: "#f8f9fa",
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 500, boxShadow: 4, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom textAlign="center">
            🧾 Novo Lançamento
          </Typography>

          {/* Tipo */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="tipo-label">Tipo</InputLabel>
            <Select
              labelId="tipo-label"
              value={tipo}
              label="Tipo"
              onChange={(e) => setTipo(e.target.value)}
            >
              <MenuItem value="entrada">Entrada</MenuItem>
              <MenuItem value="saida">Saída</MenuItem>
            </Select>
          </FormControl>

          {/* Categoria */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="categoria-label">Categoria</InputLabel>
            <Select
              labelId="categoria-label"
              value={categoria}
              label="Categoria"
              onChange={(e) => setCategoria(e.target.value)}
            >
              {categorias.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Descrição */}
          <TextField
            label="Descrição"
            fullWidth
            sx={{ mb: 2 }}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />

          {/* Valor */}
          <TextField
            label="Valor"
            type="number"
            fullWidth
            sx={{ mb: 3 }}
            value={valor}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (v < 0) return; // 🚫 impede digitar valores negativos
              setValor(e.target.value);
            }}
          />

          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleSalvar}
            disabled={loading}
            sx={{
              py: 1.3,
              fontWeight: "bold",
              textTransform: "none",
              background: tipo === "saida" ? "#f44336" : "#4caf50",
              "&:hover": {
                background: tipo === "saida" ? "#d32f2f" : "#388e3c",
              },
            }}
          >
            {loading ? "Salvando..." : "Salvar Lançamento"}
          </Button>
        </CardContent>
      </Card>

      {/* Alerta */}
      <Snackbar
        open={alert.open}
        autoHideDuration={2500}
        onClose={() => setAlert({ ...alert, open: false })}
      >
        <Alert severity={alert.severity}>{alert.message}</Alert>
      </Snackbar>
    </Box>
  );
}
