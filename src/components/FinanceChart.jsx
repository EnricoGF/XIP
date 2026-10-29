import {
  BarChart,
  Bar,
  CartesianGrid,
  Line,
  LineChart,
  Legend,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useState } from "react";
import { FaChartBar, FaChartLine } from "react-icons/fa";
import { getFinanceDate } from "../utils/financeDate";

function FinanceChart({ receitas, despesas, registrosReceitas, registrosDespesas }) {
  const [tipoGrafico, setTipoGrafico] = useState("comparativo");
  const dadosComparativo = [
    { name: "Receitas", valor: receitas, fill: "#16a34a" },
    { name: "Despesas", valor: despesas, fill: "#e11d48" },
  ];
  const dadosTempo = new Map();

  [...registrosReceitas, ...registrosDespesas].forEach((registro) => {
    const data = getFinanceDate(registro);
    if (!data) return;

    if (!dadosTempo.has(data)) {
      dadosTempo.set(data, { data, receitas: 0, despesas: 0 });
    }
  });

  registrosReceitas.forEach((receita) => {
    const data = getFinanceDate(receita);
    if (data) dadosTempo.get(data).receitas += Number(receita.valor) || 0;
  });

  registrosDespesas.forEach((despesa) => {
    const data = getFinanceDate(despesa);
    if (data) dadosTempo.get(data).despesas += Number(despesa.valor) || 0;
  });

  const dadosCronologicos = [...dadosTempo.values()].sort((a, b) =>
    a.data.localeCompare(b.data)
  );
  const formatarValor = (value) =>
    `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <h3>{tipoGrafico === "comparativo" ? "Receitas x Despesas" : "Valor x Tempo"}</h3>
          <p>{tipoGrafico === "comparativo" ? "Totais acumulados" : "Movimentações por dia"}</p>
        </div>
        <div className="chart-switch" role="group" aria-label="Tipo de gráfico">
          <button
            type="button"
            className={tipoGrafico === "comparativo" ? "active" : ""}
            aria-pressed={tipoGrafico === "comparativo"}
            onClick={() => setTipoGrafico("comparativo")}
          >
            <FaChartBar aria-hidden="true" />
            <span>Comparativo</span>
          </button>
          <button
            type="button"
            className={tipoGrafico === "tempo" ? "active" : ""}
            aria-pressed={tipoGrafico === "tempo"}
            onClick={() => setTipoGrafico("tempo")}
          >
            <FaChartLine aria-hidden="true" />
            <span>Valor x Tempo</span>
          </button>
        </div>
      </div>

      {tipoGrafico === "comparativo" ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dadosComparativo}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value) => `R$ ${value}`} />
            <Tooltip formatter={(value) => [formatarValor(value), "Valor"]} />
            <Bar dataKey="valor" name="Total">
              {dadosComparativo.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : dadosCronologicos.length ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dadosCronologicos}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="data"
              tickFormatter={(data) => `${data.slice(8, 10)}/${data.slice(5, 7)}`}
              minTickGap={24}
            />
            <YAxis tickFormatter={(value) => `R$ ${value}`} />
            <Tooltip
              labelFormatter={(data) => `${data.slice(8, 10)}/${data.slice(5, 7)}/${data.slice(0, 4)}`}
              formatter={(value, name) => [formatarValor(value), name]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="receitas"
              name="Receitas"
              stroke="#16a34a"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="despesas"
              name="Despesas"
              stroke="#e11d48"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="chart-empty-state">
          <FaChartLine aria-hidden="true" />
          <span>Cadastre receitas ou despesas para visualizar a evolução por data.</span>
        </div>
      )}
    </div>
  );
}

export default FinanceChart;