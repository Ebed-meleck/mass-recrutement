import * as XLSX from "xlsx";
import { join } from "path";
// import fs from "fs";

// Charge le fichier
// const file = 
const workbook = XLSX.readFile(join(__dirname, "Liste_SI_refacto.xlsx"));
const wbOther = XLSX.readFile(join(__dirname, "Liste SI KWILU FINAL.xlsx"));

const sheetName = workbook.SheetNames[1];
const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

function createKey(row) {
  return [
    row["Noms"],
    row["Prenoms"],
  ].map(v => String(v).trim().toLowerCase()).join("||");
}

const bestEntriesMap = new Map();
const removedDuplicates = [];

// Traitement du premier fichier
for (const row of data) {
  const key = createKey(row);
  const cote = parseFloat(row["Côtes/20"]) || 0;

  if (!bestEntriesMap.has(key)) {
    bestEntriesMap.set(key, row);
  } else {
    const existing = bestEntriesMap.get(key);
    const existingCote = parseFloat(existing["Côtes/20"]);

    if (cote > existingCote) {
      removedDuplicates.push(existing);
      bestEntriesMap.set(key, row);
    } else {
      removedDuplicates.push(row);
    }
  }
}

// Fusion avec wbOther
const otherSheetName = wbOther.SheetNames[0];
const otherData = XLSX.utils.sheet_to_json(wbOther.Sheets[otherSheetName], { defval: "" });

for (const row of otherData) {
  const key = createKey(row);
  if (!bestEntriesMap.has(key)) {
    bestEntriesMap.set(key, row);
  }
}

const cleanedData = Array.from(bestEntriesMap.values());
const wsClean = XLSX.utils.json_to_sheet(cleanedData);
const wsDupes = XLSX.utils.json_to_sheet(removedDuplicates);

const newWorkbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(newWorkbook, wsClean, "CleanData");
XLSX.utils.book_append_sheet(newWorkbook, wsDupes, "DoublonsSupprimes");

XLSX.writeFile(newWorkbook, "liste_si_clean.xlsx");

console.log("✅ Fichier créé : liste_si_clean.xlsx");