export function getFinanceDate(record) {
  if (typeof record.data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(record.data)) {
    return record.data;
  }

  const createdAt = record.criadoEm?.toDate
    ? record.criadoEm.toDate()
    : record.criadoEm instanceof Date
      ? record.criadoEm
      : null;

  if (!createdAt || Number.isNaN(createdAt.getTime())) {
    return "";
  }

  const year = createdAt.getFullYear();
  const month = String(createdAt.getMonth() + 1).padStart(2, "0");
  const day = String(createdAt.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatFinanceDate(record) {
  const date = getFinanceDate(record);

  if (!date) {
    return "Data não informada";
  }

  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

export function getTodayFinanceDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}