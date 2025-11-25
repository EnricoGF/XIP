// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import Home from "./pages/Home";
import NovoLancamento from "./pages/NovoLancamento";

// aqui eu uso uma rota pública /login fictícia — adapte à tua lógica de auth
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Home />} />
          <Route path="novo" element={<NovoLancamento />} />
        </Route>
        {/* rota de logout simplificada só como exemplo */}
        <Route path="/logout" element={<div>Logout (implemente a lógica)</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
