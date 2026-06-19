import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "/Users/justinramos/Desktop/coding_projects/illuminears/outputs/collection-template";
const outputPath = path.join(outputDir, "Lorcana Collection Import Template.xlsx");

const sets = [
  { setNumber: 1, releaseDate: "2023-08-18", cards: 204, name: "The First Chapter", code: "TFC" },
  { setNumber: 2, releaseDate: "2023-11-17", cards: 204, name: "Rise of The Floodborn", code: "ROF" },
  { setNumber: 3, releaseDate: "2024-02-23", cards: 204, name: "Into the Inklands", code: "INK" },
  { setNumber: 4, releaseDate: "2024-05-17", cards: 35, name: "Illumineer's Quest: Deep Trouble", code: "QU1" },
  { setNumber: 4, releaseDate: "2024-05-17", cards: 204, name: "Ursula's Return", code: "URS" },
  { setNumber: 5, releaseDate: "2024-08-09", cards: 204, name: "Shimmering Skies", code: "SSK" },
  { setNumber: 6, releaseDate: "2024-11-15", cards: 204, name: "Azurite Sea", code: "AZS" },
  { setNumber: 7, releaseDate: "2025-03-07", cards: 204, name: "Archazia's Island", code: "ARI" },
  { setNumber: 8, releaseDate: "2025-05-30", cards: 204, name: "Reign of Jafar", code: "ROJ" },
  { setNumber: 9, releaseDate: "2025-08-29", cards: 204, name: "Fabled", code: "FAB" },
  { setNumber: 10, releaseDate: "2025-11-07", cards: 204, name: "Whispers in the Well", code: "WHI" },
  { setNumber: 11, releaseDate: "2026-02-13", cards: 204, name: "Winterspell", code: "WIN" },
];

const promoCards = [
  { number: "1/P1", name: "Mickey Mouse - Brave Little Tailor", rarity: "Special" },
  { number: "2/P1", name: "Stitch - Rock Star", rarity: "Special" },
  { number: "3/P1", name: "Elsa - Snow Queen", rarity: "Special" },
  { number: "4/P1", name: "Cruella De Vil - Miserable as Usual", rarity: "Special" },
  { number: "5/P1", name: "Maleficent - Monstrous Dragon", rarity: "Special" },
  { number: "6/P1", name: "Robin Hood - Unrivaled Archer", rarity: "Special" },
  { number: "7/P1", name: "Captain Hook - Forceful Duelist", rarity: "Special" },
  { number: "8/P1", name: "Mickey Mouse - Detective", rarity: "Special" },
  { number: "9/P1", name: "HeiHei - Boat Snack", rarity: "Special" },
  { number: "10/P1", name: "Yzma - Alchemist", rarity: "Special" },
  { number: "11/P1", name: "Mickey Mouse - Musketeer", rarity: "Special" },
  { number: "12/P1", name: "Goofy - Musketeer", rarity: "Special" },
  { number: "13/P1", name: "Donald Duck - Musketeer", rarity: "Special" },
  { number: "14/P1", name: "Cinderella - Knight in Training", rarity: "Special" },
  { number: "15/P1", name: "Bucky - Squirrel Squeak Tutor", rarity: "Special" },
  { number: "16/P1", name: "Minnie Mouse - Wide-Eyed Diver", rarity: "Special" },
  { number: "17/P1", name: "Robin Hood - Capable Fighter", rarity: "Special" },
  { number: "18/P1", name: "Mickey Mouse - Friendly Face", rarity: "Special" },
  { number: "19/P1", name: "Elsa - Gloves Off", rarity: "Special" },
  { number: "20/P1", name: "Genie - Powers Unleashed", rarity: "Special" },
  { number: "21/P1", name: "Stitch - Abomination", rarity: "Special" },
  { number: "22/P1", name: "Maleficent - Uninvited", rarity: "Special" },
  { number: "23/P1", name: "Maui - Demigod", rarity: "Special" },
  { number: "24/P1", name: "Gaston - Arrogant Hunter", rarity: "Special" },
  { number: "25/P1", name: "Reserved / not present in local promo archive", rarity: "" },
  { number: "26/P1", name: "Kit Cloudkicker - Tough Guy", rarity: "Special" },
  { number: "27/P1", name: "Jolly Roger - Hook's Ship", rarity: "Special" },
  { number: "28/P1", name: "How Far I'll Go", rarity: "Special" },
  { number: "29/P1", name: "John Silver - Greedy Treasure Seeker", rarity: "Special" },
  { number: "30/P1", name: "Stitch - Rock Star", rarity: "Enchanted" },
  { number: "31/P1", name: "Rapunzel - Gifted Artist", rarity: "Special" },
  { number: "32/P1", name: "Pinocchio - Talkative Puppet", rarity: "Special" },
  { number: "33/P1", name: "Four Dozen Eggs", rarity: "Special" },
];

const safeSheetName = (set) => {
  const name = `${set.setNumber} ${set.code}`;
  return name.slice(0, 31).replace(/[:\\/?*[\]]/g, "-");
};

const styleHeader = (range) => {
  range.format = {
    fill: "#20163D",
    font: { bold: true, color: "#F3D888" },
    wrapText: true,
    horizontalAlignment: "center",
    verticalAlignment: "center",
    borders: { preset: "all", style: "thin", color: "#D8A943" },
  };
};

const styleBody = (range) => {
  range.format = {
    borders: { preset: "all", style: "thin", color: "#3B3159" },
    verticalAlignment: "center",
  };
};

const workbook = Workbook.create();

const instructions = workbook.worksheets.add("Instructions");
instructions.showGridLines = false;
instructions.getRange("A1:F1").merge();
instructions.getRange("A1").values = [["Lorcana Collection Import Template"]];
instructions.getRange("A1").format = {
  fill: "#0B0A18",
  font: { bold: true, color: "#F3D888", size: 18 },
};
instructions.getRange("A3:F8").values = [
  ["How to use this workbook", null, null, null, null, null],
  ["1. Open each set tab.", null, null, null, null, null],
  ["2. Enter how many standard copies you own in standard_count.", null, null, null, null, null],
  ["3. Enter how many foil copies you own in foil_count.", null, null, null, null, null],
  ["4. Leave rows as 0 if you do not own that card.", null, null, null, null, null],
  ["5. Save/export as .xlsx or .csv when the website importer is ready.", null, null, null, null, null],
];
instructions.getRange("A3:F3").merge();
instructions.getRange("A4:F4").merge();
instructions.getRange("A5:F5").merge();
instructions.getRange("A6:F6").merge();
instructions.getRange("A7:F7").merge();
instructions.getRange("A8:F8").merge();
instructions.getRange("A3").format = { font: { bold: true, color: "#F3D888", size: 13 } };
instructions.getRange("A4:A8").format = { font: { color: "#F6EDFF" } };
instructions.getRange("A10:F10").values = [["Source note", null, null, null, null, null]];
instructions.getRange("A10:F10").merge();
instructions.getRange("A11:F12").values = [
  ["Set names and card counts were captured from the Lorcana API available to the app. Card names are intentionally optional so the importer can match by set + card number.", null, null, null, null, null],
  ["The Promo / Other sheet is prefilled with known P1 promo card numbers from the local card archive, with extra blank rows below for future promos.", null, null, null, null, null],
];
instructions.getRange("A11:F11").merge();
instructions.getRange("A12:F12").merge();
instructions.getRange("A10").format = { font: { bold: true, color: "#F3D888" } };
instructions.getRange("A11:A12").format = { font: { color: "#C9C2DD" }, wrapText: true };
instructions.getRange("A:F").format.columnWidthPx = 135;
instructions.getRange("A1").format.rowHeightPx = 32;

const summary = workbook.worksheets.add("Summary");
summary.showGridLines = false;
summary.getRange("A1:F1").merge();
summary.getRange("A1").values = [["Collection Entry Progress"]];
summary.getRange("A1").format = {
  fill: "#0B0A18",
  font: { bold: true, color: "#F3D888", size: 16 },
};
summary.getRange("A3:F3").values = [["Set", "Code", "Cards Listed", "Standard Owned", "Foil Owned", "Total Owned"]];
styleHeader(summary.getRange("A3:F3"));

sets.forEach((set, index) => {
  const row = 4 + index;
  const sheetName = safeSheetName(set);
  summary.getRange(`A${row}:C${row}`).values = [[set.name, set.code, set.cards]];
  summary.getRange(`D${row}:F${row}`).formulas = [[
    `=SUM('${sheetName}'!D2:D${set.cards + 1})`,
    `=SUM('${sheetName}'!E2:E${set.cards + 1})`,
    `=D${row}+E${row}`,
  ]];
});
const summaryEnd = 3 + sets.length;
const promoSummaryRow = summaryEnd + 1;
summary.getRange(`A${promoSummaryRow}:C${promoSummaryRow}`).values = [["Disney Lorcana Promos", "P1", promoCards.length]];
summary.getRange(`D${promoSummaryRow}:F${promoSummaryRow}`).formulas = [[
  `=SUM('Promo - Other'!D2:D${promoCards.length + 1})`,
  `=SUM('Promo - Other'!E2:E${promoCards.length + 1})`,
  `=D${promoSummaryRow}+E${promoSummaryRow}`,
]];
styleBody(summary.getRange(`A4:F${promoSummaryRow}`));
summary.getRange(`C4:F${promoSummaryRow}`).format.numberFormat = "0";
summary.getRange("A:F").format.columnWidthPx = 135;
summary.freezePanes.freezeRows(3);

sets.forEach((set) => {
  const sheet = workbook.worksheets.add(safeSheetName(set));
  sheet.showGridLines = false;
  const rows = [["set_name", "set_code", "card_number", "standard_count", "foil_count", "notes"]];
  for (let cardNumber = 1; cardNumber <= set.cards; cardNumber += 1) {
    rows.push([set.name, set.code, cardNumber, 0, 0, ""]);
  }
  const range = sheet.getRangeByIndexes(0, 0, rows.length, 6);
  range.values = rows;
  styleHeader(sheet.getRange("A1:F1"));
  styleBody(sheet.getRangeByIndexes(1, 0, rows.length - 1, 6));
  sheet.getRange(`C2:E${rows.length}`).format.numberFormat = "0";
  sheet.getRange(`D2:E${rows.length}`).dataValidation = {
    rule: { type: "whole", operator: "between", formula1: 0, formula2: 99 },
  };
  sheet.getRange("A:A").format.columnWidthPx = 210;
  sheet.getRange("B:B").format.columnWidthPx = 72;
  sheet.getRange("C:C").format.columnWidthPx = 110;
  sheet.getRange("D:E").format.columnWidthPx = 126;
  sheet.getRange("F:F").format.columnWidthPx = 220;
  sheet.freezePanes.freezeRows(1);
  sheet.tables.add(`A1:F${rows.length}`, true, `Table_${set.code.replace(/[^A-Za-z0-9]/g, "")}`);
});

const promo = workbook.worksheets.add("Promo - Other");
promo.showGridLines = false;
promo.getRange("A1:F1").values = [["set_name", "set_code", "card_number", "standard_count", "foil_count", "notes"]];
styleHeader(promo.getRange("A1:F1"));
const promoRows = [
  ...promoCards.map((card) => [
    "Disney Lorcana Promos",
    "P1",
    card.number,
    0,
    0,
    card.rarity ? `${card.name} (${card.rarity})` : card.name,
  ]),
  ...Array.from({ length: 167 }, () => ["", "", "", 0, 0, ""]),
];
promo.getRangeByIndexes(1, 0, promoRows.length, 6).values = promoRows;
styleBody(promo.getRangeByIndexes(1, 0, promoRows.length, 6));
promo.getRange("C2:E201").format.numberFormat = "0";
promo.getRange("D2:E201").dataValidation = {
  rule: { type: "whole", operator: "between", formula1: 0, formula2: 99 },
};
promo.getRange("A:A").format.columnWidthPx = 210;
promo.getRange("B:B").format.columnWidthPx = 72;
promo.getRange("C:C").format.columnWidthPx = 110;
promo.getRange("D:E").format.columnWidthPx = 126;
promo.getRange("F:F").format.columnWidthPx = 320;
promo.freezePanes.freezeRows(1);
promo.tables.add("A1:F201", true, "Table_PromoOther");

await fs.mkdir(outputDir, { recursive: true });

const errorScan = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 200 },
  summary: "formula error scan",
});
console.log(errorScan.ndjson);

const preview = await workbook.render({ sheetName: "Summary", range: `A1:F${promoSummaryRow}`, scale: 1, format: "png" });
await fs.writeFile(path.join(outputDir, "summary-preview.png"), new Uint8Array(await preview.arrayBuffer()));

const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(outputPath);
console.log(outputPath);
