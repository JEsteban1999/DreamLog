import type { jsPDF as JsPDF } from "jspdf";
import type { SleepEntry } from "@dreamlog/shared";

// Las libs pesadas (jspdf, jspdf-autotable, html-to-image) se cargan de forma
// diferida dentro de exportDashboardToPdf, así no entran al bundle inicial.
type ToCanvasFn = typeof import("html-to-image").toCanvas;
type AutoTableFn = typeof import("jspdf-autotable").default;

async function addChartsPages(
  pdf: JsPDF,
  chartsElement: HTMLElement,
  firstPageStartY: number,
  toCanvas: ToCanvasFn
) {
  const canvas = await toCanvas(chartsElement, {
    backgroundColor: document.documentElement.classList.contains("dark") ? "#0e1220" : "#ffffff",
    pixelRatio: 2,
  });

  const margin = 10;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const imgData = canvas.toDataURL("image/png");

  // Imagen "larga" repartida en varias páginas: cada página muestra una franja,
  // desplazando la imagen hacia arriba (position negativo) para revelar la siguiente.
  pdf.addImage(imgData, "PNG", margin, firstPageStartY, imgWidth, imgHeight);
  let consumed = pageHeight - firstPageStartY - margin;

  const usable = pageHeight - margin * 2;
  while (consumed < imgHeight) {
    pdf.addPage("a4", "p");
    pdf.addImage(imgData, "PNG", margin, margin - consumed, imgWidth, imgHeight);
    consumed += usable;
  }
}

function addEntriesTablePage(pdf: JsPDF, entries: SleepEntry[], autoTable: AutoTableFn) {
  pdf.addPage("a4", "l");
  pdf.setFontSize(14);
  pdf.text("Historial de sueño", 14, 15);
  pdf.setFontSize(9);
  pdf.text(`Generado: ${new Date().toLocaleString()}`, 14, 21);

  autoTable(pdf, {
    startY: 26,
    head: [["Fecha", "Duración (h)", "Calidad", "Ánimo", "Energía", "Café", "Ejercicio", "Estrés", "Despertares"]],
    body: entries.map((e) => [
      e.sleep_date.slice(0, 10),
      e.duration_hours != null ? e.duration_hours.toFixed(1) : "--",
      e.sleep_quality ?? "--",
      e.mood_on_wake ?? "--",
      e.energy_level ?? "--",
      e.caffeine_cups ?? 0,
      e.exercise ? "Sí" : "No",
      e.stress_level ?? "--",
      e.awakenings ?? "--",
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [110, 124, 232] },
  });
}

export async function exportDashboardToPdf(chartsElement: HTMLElement, entries: SleepEntry[]) {
  const [{ jsPDF }, { default: autoTable }, { toCanvas }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
    import("html-to-image"),
  ]);

  const pdf = new jsPDF("p", "mm", "a4");
  pdf.setFontSize(16);
  pdf.text("DreamLog — Reporte de sueño", 10, 15);
  pdf.setFontSize(10);
  pdf.text(`Generado: ${new Date().toLocaleString()}`, 10, 22);

  await addChartsPages(pdf, chartsElement, 28, toCanvas);

  if (entries.length > 0) {
    addEntriesTablePage(pdf, entries, autoTable);
  }

  pdf.save(`dreamlog-reporte-${new Date().toISOString().slice(0, 10)}.pdf`);
}
