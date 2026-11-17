import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../services/firebase";

const migrationsByUser = new Map();

async function migrateLegacyCategories(userId) {
  const categoriesQuery = query(
    collection(db, "categorias"),
    where("userId", "==", userId)
  );
  const despesasQuery = query(
    collection(db, "despesas"),
    where("userId", "==", userId)
  );
  const receitasQuery = query(
    collection(db, "receitas"),
    where("userId", "==", userId)
  );
  const [categoriesSnapshot, despesasSnapshot, receitasSnapshot] = await Promise.all([
    getDocs(categoriesQuery),
    getDocs(despesasQuery),
    getDocs(receitasQuery),
  ]);

  const legacyCategories = categoriesSnapshot.docs.filter((categoryDoc) => !categoryDoc.data().tipo);
  if (legacyCategories.length === 0) return;

  const incomeCategoriesBySource = new Map(
    categoriesSnapshot.docs
      .filter((categoryDoc) => categoryDoc.data().migradoDe && categoryDoc.data().tipo === "receita")
      .map((categoryDoc) => [categoryDoc.data().migradoDe, categoryDoc.id])
  );
  const incomeReferences = new Map();

  legacyCategories.forEach((categoryDoc) => {
    const categoryId = categoryDoc.id;
    const referencedByExpenses = despesasSnapshot.docs.some(
      (expenseDoc) => expenseDoc.data().categoriaId === categoryId
    );
    const referencedByIncomes = receitasSnapshot.docs.filter(
      (incomeDoc) => incomeDoc.data().categoriaId === categoryId
    );

    if (referencedByExpenses && referencedByIncomes.length > 0) {
      incomeReferences.set(categoryId, referencedByIncomes);
    }
  });

  for (const sourceId of incomeReferences.keys()) {
    if (!incomeCategoriesBySource.has(sourceId)) {
      const sourceCategory = categoriesSnapshot.docs.find((categoryDoc) => categoryDoc.id === sourceId);
      const sourceData = sourceCategory.data();
      const incomeCategory = await addDoc(collection(db, "categorias"), {
        userId,
        nome: sourceData.nome,
        tipo: "receita",
        criadoEm: sourceData.criadoEm || new Date(),
        migradoDe: sourceId,
      });
      incomeCategoriesBySource.set(sourceId, incomeCategory.id);
    }
  }

  const operations = [];
  legacyCategories.forEach((categoryDoc) => {
    const categoryId = categoryDoc.id;
    const referencedByExpenses = despesasSnapshot.docs.some(
      (expenseDoc) => expenseDoc.data().categoriaId === categoryId
    );
    const incomeDocs = receitasSnapshot.docs.filter(
      (incomeDoc) => incomeDoc.data().categoriaId === categoryId
    );

    if (referencedByExpenses && incomeDocs.length > 0) {
      const incomeCategoryId = incomeCategoriesBySource.get(categoryId);
      incomeDocs.forEach((incomeDoc) => {
        operations.push((batch) => batch.update(doc(db, "receitas", incomeDoc.id), {
          categoriaId: incomeCategoryId,
        }));
      });
      operations.push((batch) => batch.update(doc(db, "categorias", categoryId), {
        tipo: "despesa",
      }));
      return;
    }

    operations.push((batch) => batch.update(doc(db, "categorias", categoryId), {
      tipo: incomeDocs.length > 0 ? "receita" : "despesa",
    }));
  });

  for (let index = 0; index < operations.length; index += 450) {
    const batch = writeBatch(db);
    operations.slice(index, index + 450).forEach((operation) => operation(batch));
    await batch.commit();
  }
}

export function ensureCategoryTypes(userId) {
  if (!migrationsByUser.has(userId)) {
    const migration = migrateLegacyCategories(userId).catch((error) => {
      migrationsByUser.delete(userId);
      throw error;
    });
    migrationsByUser.set(userId, migration);
  }

  return migrationsByUser.get(userId);
}
