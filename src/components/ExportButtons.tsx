"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { createXlsx } from "@/lib/xlsx";

export default function ExportButtons({ head, rows, title }: { head: string[]; rows: (string | number)[][]; title: string }) {
  const [error, setError] = useState("");

  function exportPdf() {
    try {
      const pdf = new jsPDF();
      pdf.text(title, 14, 16);
      autoTable(pdf, { head: [head], body: rows, startY: 22 });
      pdf.save("laporan-ruangkampus.pdf");
      setError("");
    } catch (reason) {
      console.error("PDF export failed", reason);
      setError("Laporan PDF gagal dibuat. Silakan coba kembali.");
    }
  }

  function exportExcel() {
    try {
      const bytes = createXlsx(title, head, rows);
      const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "laporan-ruangkampus.xlsx";
      anchor.click();
      URL.revokeObjectURL(url);
      setError("");
    } catch (reason) {
      console.error("Excel export failed", reason);
      setError("Laporan Excel gagal dibuat. Silakan coba kembali.");
    }
  }

  return <div><div className="flex gap-2"><button type="button" onClick={exportPdf} className="btn-o">Ekspor PDF</button><button type="button" onClick={exportExcel} className="btn-o">Ekspor Excel</button></div>{error && <p role="alert" className="mt-2 text-right text-xs text-red-700">{error}</p>}</div>;
}
