// Exportação do dashboard (Excel e PDF) — executa no navegador.
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export type ExportStats = {
  totalReceitas: number
  totalDespesas: number
  saldo: number
  margem: number
}

export type ExportChartRow = {
  periodo: string
  receitas: number
  despesas: number
  lucro: number
}

export type ExportLancamento = {
  data: string
  descricao: string
  conta?: string
  clienteFornecedor?: string
  entrada: number
  saida: number
}

export type DashboardExportPayload = {
  periodoTexto: string
  empresa?: string
  stats: ExportStats
  chartData: ExportChartRow[]
  lancamentos: ExportLancamento[]
}

const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0)

const dataBR = (iso: string) => new Date(iso).toLocaleDateString("pt-BR")

function fileSlug(periodoTexto: string) {
  return periodoTexto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase()
    .replace(/^-|-$/g, "")
}

export function exportDashboardExcel(payload: DashboardExportPayload) {
  const workbook = XLSX.utils.book_new()

  const resumo = [
    ["Dashboard SeuGerente"],
    ["Período", payload.periodoTexto],
    ["Empresa", payload.empresa || "-"],
    ["Gerado em", new Date().toLocaleString("pt-BR")],
    [],
    ["Indicador", "Valor"],
    ["Receita total", payload.stats.totalReceitas],
    ["Despesas", payload.stats.totalDespesas],
    ["Lucro", payload.stats.saldo],
    ["Margem (%)", Number(payload.stats.margem.toFixed(2))],
  ]
  const wsResumo = XLSX.utils.aoa_to_sheet(resumo)
  wsResumo["!cols"] = [{ wch: 24 }, { wch: 22 }]
  XLSX.utils.book_append_sheet(workbook, wsResumo, "Resumo")

  const wsEvolucao = XLSX.utils.json_to_sheet(
    payload.chartData.map((row) => ({
      Período: row.periodo,
      Receitas: row.receitas,
      Despesas: row.despesas,
      Lucro: row.lucro,
    }))
  )
  wsEvolucao["!cols"] = [{ wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(workbook, wsEvolucao, "Evolução")

  const wsLanc = XLSX.utils.json_to_sheet(
    payload.lancamentos.map((item) => ({
      Data: dataBR(item.data),
      Descrição: item.descricao,
      Conta: item.conta || "",
      "Cliente/Fornecedor": item.clienteFornecedor || "",
      Entrada: item.entrada,
      Saída: item.saida,
    }))
  )
  wsLanc["!cols"] = [{ wch: 12 }, { wch: 38 }, { wch: 22 }, { wch: 24 }, { wch: 14 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(workbook, wsLanc, "Lançamentos")

  XLSX.writeFile(workbook, `dashboard-${fileSlug(payload.periodoTexto)}.xlsx`)
}

export function exportDashboardPdf(payload: DashboardExportPayload) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" })
  const marginX = 40

  doc.setFontSize(18)
  doc.text("Dashboard — SeuGerente", marginX, 48)

  doc.setFontSize(10)
  doc.setTextColor(110)
  doc.text(`Período: ${payload.periodoTexto}`, marginX, 66)
  if (payload.empresa) doc.text(`Empresa: ${payload.empresa}`, marginX, 80)
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, marginX, payload.empresa ? 94 : 80)

  autoTable(doc, {
    startY: payload.empresa ? 112 : 98,
    head: [["Indicador", "Valor"]],
    body: [
      ["Receita total", brl(payload.stats.totalReceitas)],
      ["Despesas", brl(payload.stats.totalDespesas)],
      ["Lucro", brl(payload.stats.saldo)],
      ["Margem", `${payload.stats.margem.toFixed(1)}%`],
    ],
    theme: "grid",
    headStyles: { fillColor: [79, 70, 229], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 6 },
  })

  const afterResumo = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY

  autoTable(doc, {
    startY: afterResumo + 24,
    head: [["Período", "Receitas", "Despesas", "Lucro"]],
    body: payload.chartData.map((row) => [
      row.periodo,
      brl(row.receitas),
      brl(row.despesas),
      brl(row.lucro),
    ]),
    theme: "striped",
    headStyles: { fillColor: [30, 41, 59], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 5 },
  })

  const afterEvolucao = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY

  if (payload.lancamentos.length > 0) {
    autoTable(doc, {
      startY: afterEvolucao + 24,
      head: [["Data", "Descrição", "Conta", "Entrada", "Saída"]],
      body: payload.lancamentos.map((item) => [
        dataBR(item.data),
        item.descricao,
        item.conta || "-",
        item.entrada ? brl(item.entrada) : "-",
        item.saida ? brl(item.saida) : "-",
      ]),
      theme: "striped",
      headStyles: { fillColor: [30, 41, 59], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 4 },
      columnStyles: { 1: { cellWidth: 170 } },
    })
  }

  doc.save(`dashboard-${fileSlug(payload.periodoTexto)}.pdf`)
}
