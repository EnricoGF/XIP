import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../services/firebase";
import { getTodayFinanceDate } from "../utils/financeDate";

function parseLocalDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function countPlannedInvestments(frequency, endDate) {
  const start = parseLocalDate(getTodayFinanceDate());
  const end = parseLocalDate(endDate);
  if (end < start) return 0;

  if (frequency === "semanal") {
    let count = 0;
    const investmentDate = new Date(start);
    while (investmentDate <= end) {
      count += 1;
      investmentDate.setDate(investmentDate.getDate() + 7);
    }
    return count;
  }

  let count = 0;
  const originalDay = start.getDate();
  while (true) {
    const monthIndex = start.getMonth() + count;
    const year = start.getFullYear() + Math.floor(monthIndex / 12);
    const month = monthIndex % 12;
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const investmentDate = new Date(year, month, Math.min(originalDay, lastDayOfMonth));
    if (investmentDate > end) break;
    count += 1;
  }
  return count;
}

function formatCurrency(value) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(dateString) {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

function Metas() {
  const { user } = useAuth();
  const [descricao, setDescricao] = useState("");
  const [valorAlvo, setValorAlvo] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [frequencia, setFrequencia] = useState("semanal");
  const [metas, setMetas] = useState([]);
  const [metaSelecionadaId, setMetaSelecionadaId] = useState("");
  const [aportes, setAportes] = useState([]);
  const [valorAporte, setValorAporte] = useState("");
  const [dataAporte, setDataAporte] = useState(getTodayFinanceDate());
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const carregarMetas = useCallback(async () => {
    const metasQuery = query(
      collection(db, "metas"),
      where("userId", "==", user.uid)
    );
    const snapshot = await getDocs(metasQuery);
    const lista = snapshot.docs
      .map((metaDoc) => ({ id: metaDoc.id, ...metaDoc.data() }))
      .sort((a, b) => {
        const dateA = a.criadoEm?.toDate?.() ?? new Date(0);
        const dateB = b.criadoEm?.toDate?.() ?? new Date(0);
        return dateB - dateA;
      });

    setMetas(lista);
    setMetaSelecionadaId((selectedId) => (
      lista.some((meta) => meta.id === selectedId) ? selectedId : lista[0]?.id || ""
    ));
  }, [user]);

  useEffect(() => {
    if (user) {
      Promise.resolve()
        .then(carregarMetas)
        .catch((error) => {
          console.error("Erro ao carregar metas:", error);
          setErro("Não foi possível carregar suas metas.");
        });
    }
  }, [user, carregarMetas]);

  useEffect(() => {
    let ativo = true;
    Promise.resolve()
      .then(async () => {
        if (!metaSelecionadaId) return [];
        const aportesQuery = query(
          collection(db, "metas", metaSelecionadaId, "aportes")
        );
        const snapshot = await getDocs(aportesQuery);
        return snapshot.docs.map((aporteDoc) => ({
          id: aporteDoc.id,
          ...aporteDoc.data(),
        }));
      })
      .then((lista) => {
        if (ativo) setAportes(lista.sort((a, b) => a.data.localeCompare(b.data)));
      })
      .catch((error) => {
        console.error("Erro ao carregar aportes da meta:", error);
        if (ativo) setErro("Não foi possível carregar os aportes desta meta.");
      });

    return () => {
      ativo = false;
    };
  }, [metaSelecionadaId]);

  const dataCriacao = getTodayFinanceDate();
  const quantidadeAportes = dataFinal
    ? countPlannedInvestments(frequencia, dataFinal)
    : 0;
  const alvoEmCentavos = Math.round((Number(valorAlvo) || 0) * 100);
  const aporteBaseCentavos = quantidadeAportes
    ? Math.floor(alvoEmCentavos / quantidadeAportes)
    : 0;
  const aporteFinalCentavos = quantidadeAportes
    ? alvoEmCentavos - aporteBaseCentavos * (quantidadeAportes - 1)
    : 0;

  const metaSelecionada = metas.find((meta) => meta.id === metaSelecionadaId);
  const totalInvestido = aportes.reduce((total, aporte) => total + (Number(aporte.valor) || 0), 0);
  const dadosGrafico = useMemo(() => {
    if (!metaSelecionada) return [];

    const aportesPorData = new Map();
    aportes.forEach((aporte) => {
      aportesPorData.set(aporte.data, (aportesPorData.get(aporte.data) || 0) + Number(aporte.valor));
    });

    const inicio = metaSelecionada.criadoEm?.toDate
      ? toLocalDateString(metaSelecionada.criadoEm.toDate())
      : dataCriacao;
    const datas = new Set([inicio, metaSelecionada.dataFinal, ...aportesPorData.keys()]);
    let acumulado = 0;

    return [...datas]
      .sort()
      .map((data) => {
        acumulado += aportesPorData.get(data) || 0;
        return {
          data,
          investido: acumulado,
          alvo: Number(metaSelecionada.valorAlvo),
        };
      });
  }, [aportes, dataCriacao, metaSelecionada]);

  const criarMeta = async (event) => {
    event.preventDefault();
    setErro("");
    setMensagem("");

    if (!descricao.trim()) {
      setErro("Informe uma descrição para a meta.");
      return;
    }

    if (Number(valorAlvo) <= 0 || !Number.isFinite(Number(valorAlvo))) {
      setErro("Informe um valor-alvo maior que zero.");
      return;
    }

    if (!dataFinal || dataFinal < getTodayFinanceDate() || quantidadeAportes === 0) {
      setErro("Escolha uma data final futura ou igual a hoje.");
      return;
    }

    try {
      const metaRef = await addDoc(collection(db, "metas"), {
        userId: user.uid,
        descricao: descricao.trim(),
        valorAlvo: Number(valorAlvo),
        dataFinal,
        frequencia,
        quantidadeAportes,
        criadoEm: new Date(),
      });

      setMetas((lista) => [{
        id: metaRef.id,
        userId: user.uid,
        descricao: descricao.trim(),
        valorAlvo: Number(valorAlvo),
        dataFinal,
        frequencia,
        quantidadeAportes,
        criadoEm: new Date(),
      }, ...lista]);
      setMetaSelecionadaId(metaRef.id);
      setDescricao("");
      setValorAlvo("");
      setDataFinal("");
      setMensagem("Meta criada com sucesso.");
    } catch (error) {
      console.error("Erro ao criar meta:", error);
      setErro("Não foi possível criar a meta. Tente novamente.");
    }
  };

  const registrarAporte = async (event) => {
    event.preventDefault();
    setErro("");
    setMensagem("");

    if (!metaSelecionada) {
      setErro("Selecione uma meta antes de registrar um aporte.");
      return;
    }

    const valor = Number(valorAporte);
    if (!Number.isFinite(valor) || valor <= 0) {
      setErro("Informe um aporte maior que zero.");
      return;
    }

    if (!dataAporte || dataAporte > getTodayFinanceDate()) {
      setErro("A data do aporte não pode ser futura.");
      return;
    }

    try {
      const aporteRef = await addDoc(
        collection(db, "metas", metaSelecionada.id, "aportes"),
        {
          userId: user.uid,
          valor,
          data: dataAporte,
          criadoEm: new Date(),
        }
      );
      setAportes((lista) => [...lista, {
        id: aporteRef.id,
        valor,
        data: dataAporte,
      }].sort((a, b) => a.data.localeCompare(b.data)));
      setValorAporte("");
      setDataAporte(getTodayFinanceDate());
      setMensagem("Aporte registrado com sucesso.");
    } catch (error) {
      console.error("Erro ao registrar aporte:", error);
      setErro("Não foi possível registrar o aporte. Tente novamente.");
    }
  };

  return (
    <MainLayout title="Metas">
      <div className="goals-page">
        <section className="goals-card goals-create-card">
          <h3>Criar nova meta</h3>
          <form className="goals-form" onSubmit={criarMeta}>
            <label>
              <span>Descrição da meta</span>
              <input
                type="text"
                placeholder="Ex.: Viagem, reserva de emergência"
                value={descricao}
                onChange={(event) => setDescricao(event.target.value)}
                maxLength={100}
                required
              />
            </label>

            <label>
              <span>Valor total da meta (R$)</span>
              <input
                type="number"
                value={valorAlvo}
                onChange={(event) => setValorAlvo(event.target.value)}
                min="0.01"
                step="0.01"
                placeholder="0,00"
                required
              />
            </label>

            <label>
              <span>Data final</span>
              <input
                type="date"
                value={dataFinal}
                min={getTodayFinanceDate()}
                onChange={(event) => setDataFinal(event.target.value)}
                required
              />
            </label>

            <label>
              <span>Frequência dos aportes</span>
              <select value={frequencia} onChange={(event) => setFrequencia(event.target.value)}>
                <option value="semanal">Semanal</option>
                <option value="mensal">Mensal</option>
              </select>
            </label>

            <div className="goal-preview" aria-live="polite">
              <strong>Prévia do investimento</strong>
              {Number(valorAlvo) > 0 && dataFinal && quantidadeAportes > 0 ? (
                <p>
                  Serão <strong>{quantidadeAportes} aportes {frequencia === "semanal" ? "semanais" : "mensais"}</strong>
                  {" "}de aproximadamente{" "}
                  <strong>{formatCurrency(aporteBaseCentavos / 100)}</strong> por período.
                  {aporteFinalCentavos !== aporteBaseCentavos && (
                    <> O último aporte será de <strong>{formatCurrency(aporteFinalCentavos / 100)}</strong> para completar o valor-alvo.</>
                  )}
                </p>
              ) : (
                <p>Informe o valor-alvo e a data final para calcular os aportes.</p>
              )}
            </div>

            <button className="btn-primary" type="submit">Criar meta</button>
          </form>
        </section>

        <section className="goals-card goals-progress-card">
          <div className="goals-chart-heading">
            <div>
              <h3>Progresso da meta</h3>
              <p>Acompanhe seus aportes acumulados em relação ao valor desejado.</p>
            </div>
            <label>
              <span>Meta</span>
              <select
                value={metaSelecionadaId}
                onChange={(event) => {
                  setMetaSelecionadaId(event.target.value);
                  setErro("");
                  setMensagem("");
                }}
                disabled={metas.length === 0}
              >
                {metas.length === 0 ? (
                  <option value="">Nenhuma meta criada</option>
                ) : metas.map((meta) => (
                  <option key={meta.id} value={meta.id}>{meta.descricao}</option>
                ))}
              </select>
            </label>
          </div>

          {metaSelecionada ? (
            <>
              <div className="goal-summary">
                <div>
                  <span>Investido</span>
                  <strong>{formatCurrency(totalInvestido)}</strong>
                </div>
                <div>
                  <span>Valor-alvo</span>
                  <strong>{formatCurrency(metaSelecionada.valorAlvo)}</strong>
                </div>
                <div>
                  <span>Prazo</span>
                  <strong>{formatDate(metaSelecionada.dataFinal)}</strong>
                </div>
              </div>
              <div className="goals-chart">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dadosGrafico}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="data"
                      tickFormatter={(date) => `${date.slice(8, 10)}/${date.slice(5, 7)}`}
                      minTickGap={24}
                    />
                    <YAxis
                      width={85}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip
                      labelFormatter={formatDate}
                      formatter={(value, name) => [formatCurrency(value), name]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="investido"
                      name="Total investido"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="alvo"
                      name="Valor-alvo"
                      stroke="#16a34a"
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <form className="goal-contribution-form" onSubmit={registrarAporte}>
                <h4>Registrar aporte</h4>
                <label>
                  <span>Valor (R$)</span>
                  <input
                    type="number"
                    value={valorAporte}
                    onChange={(event) => setValorAporte(event.target.value)}
                    min="0.01"
                    step="0.01"
                    placeholder="0,00"
                    required
                  />
                </label>
                <label>
                  <span>Data do aporte (até hoje)</span>
                  <input
                    type="date"
                    value={dataAporte}
                    max={getTodayFinanceDate()}
                    onChange={(event) => setDataAporte(event.target.value)}
                    required
                  />
                </label>
                <button className="btn-primary" type="submit">Adicionar aporte</button>
              </form>
            </>
          ) : (
            <p className="goals-empty">Crie uma meta para visualizar seu gráfico de progresso e registrar aportes.</p>
          )}

          {erro && <p className="finance-error" role="alert">{erro}</p>}
          {mensagem && <p className="goals-success" role="status">{mensagem}</p>}
        </section>
      </div>
    </MainLayout>
  );
}

export default Metas;
