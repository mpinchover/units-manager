/**
 * Renders a filled lease (Block[]) to a PDF in the browser with jsPDF.
 * Mirrors server/app/lease_document.py: Times body text, substituted values in bold,
 * short label lines kept with the next block, footer with reference/version and page number.
 */
import type { Block } from "../data-source/types";

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN_X = 64.8;
const MARGIN_TOP = 61.2;
const MARGIN_BOTTOM = 61.2;
const WIDTH = PAGE_W - MARGIN_X * 2;
const BODY = { size: 10.5, leading: 14, after: 7 };
const TITLE = { size: 15, leading: 19, after: 14 };

// Standard PDF fonts cover Windows-1252; replace anything else so generation never fails.
const CP1252_EXTRA = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";
const safe = (text: string) => [...text].map((ch) => (ch.charCodeAt(0) < 256 || CP1252_EXTRA.includes(ch) ? ch : "?")).join("");

type Doc = InstanceType<typeof import("jspdf").jsPDF>;
type Piece = { text: string; bold: boolean; width: number };
/** A word may mix styles, e.g. "$" + bold "1,850.00". */
type Word = { pieces: Piece[]; width: number };

function measure(doc: Doc, text: string, bold: boolean, size: number) {
  doc.setFont("times", bold ? "bold" : "normal");
  doc.setFontSize(size);
  return doc.getTextWidth(text);
}

function layout(doc: Doc, block: Block, size: number, allBold: boolean): Word[][] {
  const space = measure(doc, " ", false, size);
  const out: Word[][] = [];
  for (const sourceLine of block.lines) {
    const words: Word[] = [];
    let current: Word | null = null;
    for (const run of sourceLine) {
      const bold = allBold || (!!run.field && !run.empty);
      for (const part of safe(run.text).split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) {
          current = null;
          continue;
        }
        if (!current) {
          current = { pieces: [], width: 0 };
          words.push(current);
        }
        const width = measure(doc, part, bold, size);
        current.pieces.push({ text: part, bold, width });
        current.width += width;
      }
    }
    let line: Word[] = [];
    let x = 0;
    for (const w of words) {
      const add = (line.length ? space : 0) + w.width;
      if (line.length && x + add > WIDTH) {
        out.push(line);
        line = [];
        x = 0;
      }
      x += (line.length ? space : 0) + w.width;
      line.push(w);
    }
    out.push(line);
  }
  return out;
}

const isLabel = (block: Block) => {
  if (block.lines.length !== 1) return false;
  const text = block.lines[0].map((r) => r.text).join("").trim();
  return text.length > 0 && text.length <= 40 && !/[.:;,]$/.test(text);
};

export async function renderLeasePdf(blocks: Block[], opts: { title: string; footer: string; filename: string }) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  doc.setProperties({ title: opts.title, author: "UnitManager", creator: "UnitManager" });
  doc.setTextColor(25, 25, 25);

  const paragraphs = blocks.map((block) => {
    const style = block.kind === "title" ? TITLE : BODY;
    const lines = layout(doc, block, style.size, block.kind === "title");
    return { block, style, lines, height: lines.length * style.leading + style.after };
  });

  const bottom = PAGE_H - MARGIN_BOTTOM;
  let y = MARGIN_TOP;
  paragraphs.forEach((p, i) => {
    const keepWith = p.block.kind !== "title" && isLabel(p.block) && paragraphs[i + 1] ? paragraphs[i + 1].height : 0;
    if (y > MARGIN_TOP && y + p.height + keepWith > bottom) {
      doc.addPage();
      y = MARGIN_TOP;
    }
    const space = measure(doc, " ", false, p.style.size);
    for (const line of p.lines) {
      if (y + p.style.leading > bottom) {
        doc.addPage();
        y = MARGIN_TOP;
      }
      const lineWidth = line.reduce((sum, w, idx) => sum + w.width + (idx ? space : 0), 0);
      let x = p.block.kind === "title" ? (PAGE_W - lineWidth) / 2 : MARGIN_X;
      line.forEach((word, idx) => {
        if (idx) x += space;
        for (const piece of word.pieces) {
          doc.setFont("times", piece.bold ? "bold" : "normal");
          doc.setFontSize(p.style.size);
          doc.text(piece.text, x, y + p.style.size);
          x += piece.width;
        }
      });
      y += p.style.leading;
    }
    y += p.style.after;
  });

  const pages = doc.getNumberOfPages();
  for (let n = 1; n <= pages; n++) {
    doc.setPage(n);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(115, 115, 115);
    doc.text(safe(opts.footer), MARGIN_X, PAGE_H - 36);
    doc.text(`Page ${n}`, PAGE_W - MARGIN_X, PAGE_H - 36, { align: "right" });
  }
  doc.save(opts.filename);
}
