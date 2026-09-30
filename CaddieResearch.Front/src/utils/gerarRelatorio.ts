import jsPDF from 'jspdf'
import autoTable, { CellHookData } from 'jspdf-autotable'

export interface PosicaoPDF {
  id: number; ticker: string; nomeAtivo: string; classeAtivo: string
  quantidade: number; precoMedio: number; dataEntrada: string; valorTotal: number
}

export interface RelatorioDados {
  nomeCliente: string
  nomePortfolio: string
  dataInicial: string
  dataFinal: string
  patrimonio: number
  resultado: number
  totalAportes: number
  posicoes: PosicaoPDF[]
  precosAtuais: Record<string, number>
  alocacaoPorClasse: Record<string, number>
  dadosRentabilidade: { mes: string; portfolio: number; ibovespa: number }[]
}

// ── Constantes de layout (A4 landscape) ─────────────────────────────────────
const W = 297, H = 210, ML = 14, MR = 14, MT = 12
const CW = W - ML - MR

// ── Paleta ───────────────────────────────────────────────────────────────────
const COR_AZUL: [number, number, number] = [21, 101, 192]
const COR_AZUL_CLARO: [number, number, number] = [30, 136, 229]
const COR_PRETO: [number, number, number] = [30, 30, 30]
const COR_CINZA: [number, number, number] = [110, 110, 110]
const COR_BORDA: [number, number, number] = [220, 220, 220]
const COR_VERDE: [number, number, number] = [22, 163, 74]
const COR_VERMELHO: [number, number, number] = [220, 50, 50]
const COR_FUNDO_HEADER: [number, number, number] = [245, 247, 250]
const COR_FUNDO_ALT: [number, number, number] = [251, 252, 255]

const CORES_CLASSE: Record<string, [number, number, number]> = {
  'Renda Variável': [0, 180, 216],
  'Renda Fixa': [123, 97, 255],
  'Internacional': [245, 158, 11],
  'Commodities': [249, 115, 22],
  'Futuros': [236, 72, 153],
  'Caixa Livre': [34, 197, 94],
  'Outros': [107, 114, 128],
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function brl(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}
function pct(v: number): string {
  return `${v.toFixed(2)}%`
}
function isoParaBR(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function addHeader(doc: jsPDF, nomeCliente: string, periodo: string) {
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COR_CINZA)
  doc.text(nomeCliente, W - MR - 55, 8, { align: 'right' })
  doc.text('|', W - MR - 52, 8)
  doc.text(periodo, W - MR, 8, { align: 'right' })
  doc.setFontSize(7)
  doc.text('Portfólio - Relatório por período', W / 2, H - 4, { align: 'center' })
}

function cardBox(doc: jsPDF, x: number, y: number, w: number, h: number) {
  doc.setDrawColor(...COR_BORDA)
  doc.setLineWidth(0.25)
  doc.rect(x, y, w, h, 'S')
}

function secTitle(doc: jsPDF, x: number, y: number, title: string, subtitle: string) {
  doc.setFontSize(9.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COR_PRETO)
  doc.text(title, x, y)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COR_AZUL_CLARO)
  doc.text(subtitle, x, y + 4)
}

function lineChart(
  doc: jsPDF,
  x: number, y: number, w: number, h: number,
  series: { label: string; color: [number, number, number]; data: number[]; dashed?: boolean }[],
  labels: string[]
) {
  doc.setFillColor(252, 253, 255)
  doc.rect(x, y, w, h, 'F')
  doc.setDrawColor(...COR_BORDA)
  doc.setLineWidth(0.2)
  doc.rect(x, y, w, h, 'S')

  if (labels.length < 2 || series.every(s => s.data.length < 2)) return

  const all = series.flatMap(s => s.data)
  const minV = Math.min(...all, 0)
  const maxV = Math.max(...all, 0.01)
  const range = maxV - minV || 1

  const pL = 14, pR = 4, pT = 6, pB = 16
  const cw = w - pL - pR
  const ch = h - pT - pB
  const n = labels.length

  // Grid
  doc.setLineWidth(0.12)
  for (let i = 0; i <= 4; i++) {
    const v = minV + (range / 4) * (4 - i)
    const gy = y + pT + (ch / 4) * i
    doc.setDrawColor(230, 230, 230)
    doc.line(x + pL, gy, x + w - pR, gy)
    doc.setFontSize(5.5)
    doc.setTextColor(...COR_CINZA)
    doc.text(`${v.toFixed(1)}%`, x + pL - 1, gy + 0.8, { align: 'right' })
  }

  // Zero line
  if (minV < 0) {
    const zy = y + pT + (maxV / range) * ch
    doc.setDrawColor(180, 180, 180)
    doc.setLineWidth(0.25)
    doc.line(x + pL, zy, x + w - pR, zy)
  }

  // Series
  series.forEach(s => {
    if (s.data.length < 2) return
    doc.setDrawColor(...s.color)
    doc.setLineWidth(0.6)
    if (s.dashed) doc.setLineDashPattern([2, 1.5], 0)
    else doc.setLineDashPattern([], 0)
    for (let i = 1; i < s.data.length; i++) {
      const x1 = x + pL + ((i - 1) / (n - 1)) * cw
      const y1 = y + pT + ((maxV - s.data[i - 1]) / range) * ch
      const x2 = x + pL + (i / (n - 1)) * cw
      const y2 = y + pT + ((maxV - s.data[i]) / range) * ch
      doc.line(x1, y1, x2, y2)
    }
  })
  doc.setLineDashPattern([], 0)

  // X labels (subsample)
  const step = Math.max(1, Math.ceil(n / 12))
  doc.setFontSize(5.5)
  doc.setTextColor(...COR_CINZA)
  labels.forEach((lbl, i) => {
    if (i % step === 0 || i === n - 1) {
      const lx = x + pL + (i / (n - 1)) * cw
      doc.text(lbl, lx, y + h - pB + 8, { align: 'center' })
    }
  })

  // Legend
  series.forEach((s, idx) => {
    const lx = x + pL + idx * 50
    const ly = y + h - 3
    doc.setFillColor(...s.color)
    if (s.dashed) {
      doc.setDrawColor(...s.color)
      doc.setLineWidth(0.7)
      doc.setLineDashPattern([2, 1.5], 0)
      doc.line(lx, ly - 1, lx + 10, ly - 1)
      doc.setLineDashPattern([], 0)
    } else {
      doc.rect(lx, ly - 2, 10, 1.5, 'F')
    }
    doc.setFontSize(6.5)
    doc.setTextColor(...COR_CINZA)
    doc.text(s.label, lx + 12, ly)
  })
}

// ── Exportação principal ─────────────────────────────────────────────────────
export function gerarRelatorio(d: RelatorioDados): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const periodo = `${isoParaBR(d.dataInicial)} - ${isoParaBR(d.dataFinal)}`
  const totalInv = d.posicoes.reduce((a, p) => a + p.precoMedio * p.quantidade, 0)
  const pctResult = totalInv > 0 ? (d.resultado / totalInv) * 100 : 0
  const totalAlocacao = Object.values(d.alocacaoPorClasse).reduce((a, b) => a + b, 0)
  const labels = d.dadosRentabilidade.map(r => r.mes)
  const portfolioCum = d.dadosRentabilidade.map(r => r.portfolio)
  const ibovCum = d.dadosRentabilidade.map(r => r.ibovespa)

  // ── PÁGINA 1: Resumo + Eventos + Alocação + Evolução ─────────────────────
  addHeader(doc, d.nomeCliente, periodo)

  const topY = MT + 2
  const topH = 62
  const colW = (CW - 8) / 3
  const col1 = ML, col2 = ML + colW + 4, col3 = ML + (colW + 4) * 2

  // Card Resumo
  cardBox(doc, col1, topY, colW, topH)
  secTitle(doc, col1 + 4, topY + 8, 'Resumo', 'Dados gerais da carteira')
  const resumoItens = [
    { label: 'Patrimônio', valor: brl(d.patrimonio), destaque: true, grande: true },
    { label: 'Ganho/Perda no período', valor: brl(d.resultado) },
    { label: 'Rentabilidade no período', valor: pct(pctResult), destaque: true },
    { label: '', valor: '' },
    { label: 'CDI', valor: '—' },
    { label: 'IPCA', valor: '—' },
  ]
  let ry = topY + 16
  resumoItens.forEach(item => {
    if (!item.label) { ry += 1; return }
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COR_CINZA)
    doc.text(item.label, col1 + 4, ry)
    ry += 2.5
    doc.setFont('helvetica', item.destaque ? 'bold' : 'normal')
    doc.setFontSize(item.grande ? 11 : 8.5)
    doc.setTextColor(...COR_PRETO)
    doc.text(item.valor, col1 + 4, ry)
    ry += item.grande ? 5 : 4
  })

  // Card Eventos
  cardBox(doc, col2, topY, colW, topH)
  secTitle(doc, col2 + 4, topY + 8, 'Eventos do portfólio', 'Com retorno financeiro.')
  autoTable(doc, {
    startY: topY + 13,
    margin: { left: col2 + 3, right: W - col2 - colW + 3 },
    head: [['Evento', 'Rendimento']],
    body: [
      ['Dividendos', '—'],
      ['JSCP', '—'],
      ['Rendimentos', '—'],
      ['Total', '—'],
    ],
    styles: { fontSize: 7, cellPadding: 1.5, lineColor: COR_BORDA, lineWidth: 0.1 },
    headStyles: { fillColor: COR_FUNDO_HEADER, textColor: COR_PRETO, fontStyle: 'normal', fontSize: 7 },
    columnStyles: { 1: { halign: 'right' as const } },
    alternateRowStyles: { fillColor: COR_FUNDO_ALT },
  })

  // Card Alocação
  cardBox(doc, col3, topY, colW, topH)
  secTitle(doc, col3 + 4, topY + 8, 'Alocação Patrimonial', 'Distribuição do patrimônio por classe de ativos.')
  let ay = topY + 16
  Object.entries(d.alocacaoPorClasse).forEach(([classe, valor]) => {
    const p = totalAlocacao > 0 ? (valor / totalAlocacao) * 100 : 0
    const cor = CORES_CLASSE[classe] || [107, 114, 128]
    doc.setFillColor(...cor)
    doc.rect(col3 + 4, ay - 2.2, 3, 3, 'F')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COR_PRETO)
    doc.text(classe, col3 + 9, ay)
    doc.text(`${p.toFixed(2)}%`, col3 + colW - 4, ay, { align: 'right' })
    ay += 5.5
  })

  // Evolução patrimonial
  const evoY = topY + topH + 4
  const evoH = H - evoY - 10
  cardBox(doc, ML, evoY, CW, evoH)
  secTitle(doc, ML + 4, evoY + 7, 'Evolução patrimonial', 'Variação do patrimônio ao longo do período.')

  const patrimonioSerie = portfolioCum.map(p => totalInv * (1 + p / 100))
  const investidoSerie = labels.map(() => totalInv)
  lineChart(doc, ML + 2, evoY + 10, CW - 4, evoH - 12, [
    { label: 'Patrimônio', color: COR_AZUL, data: patrimonioSerie },
    { label: 'Valor investido', color: COR_AZUL_CLARO, data: investidoSerie, dashed: true },
  ], labels)

  // ── PÁGINA 2: Rentabilidade + Resultado Financeiro ────────────────────────
  doc.addPage()
  addHeader(doc, d.nomeCliente, periodo)

  const p2top = MT + 2
  const rentH = 78
  cardBox(doc, ML, p2top, CW, rentH)
  secTitle(doc, ML + 4, p2top + 7, 'Rentabilidade', 'Gráfico de rentabilidade no período.')
  lineChart(doc, ML + 2, p2top + 10, CW - 4, rentH - 12, [
    { label: 'Carteira', color: COR_AZUL, data: portfolioCum },
    { label: 'IBOVESPA', color: [30, 180, 180], data: ibovCum, dashed: true },
  ], labels)

  const resultY = p2top + rentH + 4
  cardBox(doc, ML, resultY, CW, H - resultY - 10)
  secTitle(doc, ML + 4, resultY + 7, 'Resultado financeiro e rentabilidade', 'Resultado financeiro da carteira e indexadores.')

  const ibovFinal = ibovCum.at(-1) ?? 0
  autoTable(doc, {
    startY: resultY + 12,
    margin: { left: ML + 3, right: MR + 3 },
    head: [['', 'Período', 'Ano']],
    body: [
      ['Resultado Financeiro', brl(d.resultado), brl(d.resultado)],
      ['Rentabilidade', pct(pctResult), pct(pctResult)],
      ['% do CDI', '—', '—'],
      ['CDI', '—', '—'],
      ['IPCA', '—', '—'],
      ['Ibovespa', pct(ibovFinal), pct(ibovFinal)],
    ],
    styles: { fontSize: 7.5, cellPadding: 2, lineColor: COR_BORDA, lineWidth: 0.1 },
    headStyles: { fillColor: COR_FUNDO_HEADER, textColor: COR_PRETO, fontStyle: 'normal' },
    columnStyles: {
      0: { fontStyle: 'bold' as const, cellWidth: 55 },
      1: { halign: 'right' as const, fillColor: [235, 240, 255] as [number, number, number] },
      2: { halign: 'right' as const },
    },
    alternateRowStyles: { fillColor: COR_FUNDO_ALT },
  })

  // ── PÁGINA 3: Rentabilidade mensal e acumulada ────────────────────────────
  doc.addPage()
  addHeader(doc, d.nomeCliente, periodo)

  // Calcular retornos mensais a partir do acumulado
  const mAbr = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const mHead = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ']
  const porAno: Record<number, Record<number, number>> = {}
  let prevCum = 0
  d.dadosRentabilidade.forEach(r => {
    const [mesAbr, anoS] = r.mes.split('/')
    const ano = 2000 + parseInt(anoS)
    const mi = mAbr.indexOf(mesAbr)
    if (mi === -1) return
    if (!porAno[ano]) porAno[ano] = {}
    const monthly = ((1 + r.portfolio / 100) / (1 + prevCum / 100) - 1) * 100
    porAno[ano][mi] = monthly
    prevCum = r.portfolio
  })

  const anos = Object.keys(porAno).map(Number).sort((a, b) => b - a)
  const bodyMensal: string[][] = []
  anos.forEach(ano => {
    const row: string[] = [String(ano)]
    let acum = 1
    mHead.forEach((_, i) => {
      const v = porAno[ano][i]
      if (v !== undefined) { row.push(`${v.toFixed(2)}%`); acum *= 1 + v / 100 }
      else row.push('-')
    })
    row.push(`${((acum - 1) * 100).toFixed(2)}%`)
    bodyMensal.push(row)
    bodyMensal.push(['CDI', ...mHead.map(() => '—'), '—'])
  })

  const mY = MT + 2
  cardBox(doc, ML, mY, CW, H - mY - 10)
  secTitle(doc, ML + 4, mY + 7, 'Rentabilidade mensal e acumulada', 'Comparação mensal da rentabilidade da carteira e CDI.')

  autoTable(doc, {
    startY: mY + 12,
    margin: { left: ML + 3, right: MR + 3 },
    head: [['', ...mHead, 'ANO']],
    body: bodyMensal,
    styles: { fontSize: 6.5, cellPadding: 1.5, halign: 'center' as const, lineColor: COR_BORDA, lineWidth: 0.1 },
    headStyles: { fillColor: COR_FUNDO_HEADER, textColor: COR_PRETO, fontStyle: 'normal' },
    columnStyles: { 0: { halign: 'left' as const, fontStyle: 'bold' as const, cellWidth: 16 } },
    didParseCell: (data: CellHookData) => {
      if (data.section !== 'body' || data.column.index === 0) return
      const raw = data.cell.raw as string
      if (!raw || raw === '-' || raw === '—') return
      const v = parseFloat(raw)
      const rowArr = data.row.raw as string[]
      if (rowArr[0] === 'CDI') { data.cell.styles.textColor = COR_CINZA; return }
      if (!isNaN(v)) data.cell.styles.textColor = v < 0 ? COR_VERMELHO : v > 0 ? COR_VERDE : COR_PRETO
    },
  })

  // ── PÁGINA 4: Atribuição de resultado ────────────────────────────────────
  doc.addPage()
  addHeader(doc, d.nomeCliente, periodo)

  const plPorClasse: Record<string, { inv: number; atual: number }> = {}
  d.posicoes.forEach(p => {
    const cl = p.classeAtivo || 'Outros'
    if (!plPorClasse[cl]) plPorClasse[cl] = { inv: 0, atual: 0 }
    plPorClasse[cl].inv += p.precoMedio * p.quantidade
    plPorClasse[cl].atual += (d.precosAtuais[p.ticker] ?? p.precoMedio) * p.quantidade
  })

  const atribRows: string[][] = Object.entries(plPorClasse).map(([cl, v]) => {
    const r = v.inv > 0 ? ((v.atual - v.inv) / v.inv) * 100 : 0
    const contrib = totalInv > 0 ? ((v.atual - v.inv) / totalInv) * 100 : 0
    return [cl, pct(r), pct(contrib)]
  })
  atribRows.push(['Total', pct(pctResult), pct(pctResult)])

  const p4Y = MT + 2
  const halfW = (CW - 4) / 2

  // Gráfico de barras (lado esquerdo)
  cardBox(doc, ML, p4Y, halfW, H - p4Y - 10)
  secTitle(doc, ML + 4, p4Y + 7, 'Atribuição de resultado', 'Contribuição de cada classe de ativo para o resultado do período.')

  const classes = Object.keys(plPorClasse)
  const allRents = classes.map(cl => plPorClasse[cl].inv > 0 ? ((plPorClasse[cl].atual - plPorClasse[cl].inv) / plPorClasse[cl].inv) * 100 : 0)
  const maxR = Math.max(...allRents, pctResult, 0.01)
  const barAreaX = ML + 10, barAreaY = p4Y + 14
  const barAreaW = halfW - 16, barAreaH = H - p4Y - 30
  const nBars = classes.length + 1
  const slotW = barAreaW / nBars

  for (let i = 0; i <= 4; i++) {
    const v = (maxR * i / 4)
    const gy = barAreaY + barAreaH - (v / maxR) * barAreaH
    doc.setDrawColor(230, 230, 230)
    doc.setLineWidth(0.12)
    doc.line(barAreaX, gy, barAreaX + barAreaW, gy)
    doc.setFontSize(5.5)
    doc.setTextColor(...COR_CINZA)
    doc.text(`${v.toFixed(1)}%`, barAreaX - 1, gy + 0.5, { align: 'right' })
  }

  classes.forEach((cl, i) => {
    const r = allRents[i]
    const bH = Math.max(Math.abs(r / maxR) * barAreaH, 0.5)
    const bX = barAreaX + i * slotW + slotW * 0.15
    const bW = slotW * 0.7
    const bY = r >= 0 ? barAreaY + barAreaH - bH : barAreaY + barAreaH
    doc.setFillColor(...(r >= 0 ? COR_VERDE : COR_VERMELHO))
    doc.rect(bX, bY, bW, bH, 'F')
    doc.setFontSize(5)
    doc.setTextColor(...COR_CINZA)
    const label = cl.replace('Variável', 'Var.').replace('Investimento No Exterior', 'Int.')
    doc.text(label, bX + bW / 2, barAreaY + barAreaH + 5, { align: 'center', maxWidth: slotW - 1 })
  })

  // Barra Total
  const tH = Math.max(Math.abs(pctResult / maxR) * barAreaH, 0.5)
  const tX = barAreaX + classes.length * slotW + slotW * 0.15
  const tW = slotW * 0.7
  const tY = pctResult >= 0 ? barAreaY + barAreaH - tH : barAreaY + barAreaH
  doc.setFillColor(200, 220, 255)
  doc.rect(tX, tY, tW, tH, 'F')
  doc.setFontSize(5)
  doc.setTextColor(...COR_CINZA)
  doc.text('Total', tX + tW / 2, barAreaY + barAreaH + 5, { align: 'center' })

  // Tabela (lado direito)
  const p4col2 = ML + halfW + 4
  cardBox(doc, p4col2, p4Y, halfW, H - p4Y - 10)
  secTitle(doc, p4col2 + 4, p4Y + 7, 'Atribuição de resultado', 'Contribuição de cada classe de ativo para o resultado do período.')

  autoTable(doc, {
    startY: p4Y + 12,
    margin: { left: p4col2 + 3, right: MR + 3 },
    head: [['Classe de ativo', 'Rentabilidade', 'Contribuição sob. rent.']],
    body: atribRows,
    styles: { fontSize: 7.5, cellPadding: 2, lineColor: COR_BORDA, lineWidth: 0.1 },
    headStyles: { fillColor: COR_FUNDO_HEADER, textColor: COR_PRETO, fontStyle: 'normal' },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { halign: 'right' as const },
      2: { halign: 'right' as const },
    },
    didParseCell: (data: CellHookData) => {
      if (data.section !== 'body') return
      if (data.row.index === atribRows.length - 1) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = [240, 244, 255]
      }
      if (data.column.index > 0) {
        const v = parseFloat(data.cell.raw as string)
        if (!isNaN(v)) data.cell.styles.textColor = v < 0 ? COR_VERMELHO : COR_VERDE
      }
    },
  })

  // ── PÁGINA 5+: Rentabilidade acumulada por produto ─────────────────────
  doc.addPage()
  addHeader(doc, d.nomeCliente, periodo)

  const totalPort = d.posicoes.reduce((a, p) => {
    return a + (d.precosAtuais[p.ticker] ?? p.precoMedio) * p.quantidade
  }, 0)

  const grupos: Record<string, PosicaoPDF[]> = {}
  d.posicoes.forEach(p => {
    const cl = p.classeAtivo || 'Outros'
    if (!grupos[cl]) grupos[cl] = []
    grupos[cl].push(p)
  })

  // Controle de classe para didParseCell
  const isClasseRow: boolean[] = []
  const isTotalRow: boolean[] = []
  const prodBody: string[][] = []

  Object.entries(grupos).forEach(([classe, posicoes]) => {
    const invCl = posicoes.reduce((a, p) => a + p.precoMedio * p.quantidade, 0)
    const atualCl = posicoes.reduce((a, p) => a + (d.precosAtuais[p.ticker] ?? p.precoMedio) * p.quantidade, 0)
    const plCl = atualCl - invCl
    const rentCl = invCl > 0 ? (plCl / invCl) * 100 : 0
    const pctCl = totalPort > 0 ? (atualCl / totalPort) * 100 : 0
    prodBody.push([classe, brl(invCl), '—', brl(plCl), brl(atualCl), pct(rentCl), '—', `${pctCl.toFixed(2)}%`])
    isClasseRow.push(true)
    isTotalRow.push(false)

    posicoes.forEach(p => {
      const inv = p.precoMedio * p.quantidade
      const pa = (d.precosAtuais[p.ticker] ?? p.precoMedio)
      const pl = pa * p.quantidade - inv
      const r = inv > 0 ? (pl / inv) * 100 : 0
      const pp = totalPort > 0 ? (pa * p.quantidade / totalPort) * 100 : 0
      let nome = p.ticker
      if (p.classeAtivo === 'Renda Fixa') {
        const m = p.nomeAtivo.match(/\(([^)]+)\)/)
        if (m) { const pts = m[1].split('|'); nome = `${p.ticker} ${pts[0]} ${pts[1]} ${pts[2]}` }
      }
      prodBody.push([nome, brl(inv), '—', brl(pl), brl(pa * p.quantidade), pct(r), brl(p.precoMedio), `${pp.toFixed(2)}%`])
      isClasseRow.push(false)
      isTotalRow.push(false)
    })
  })

  const totalPL = d.resultado
  const totalRent = totalInv > 0 ? (totalPL / totalInv) * 100 : 0
  prodBody.push(['Total', brl(totalInv), '—', brl(totalPL), brl(totalPort), pct(totalRent), '—', '100,00%'])
  isClasseRow.push(false)
  isTotalRow.push(true)

  const p5Y = MT + 2
  cardBox(doc, ML, p5Y, CW, H - p5Y - 10)
  secTitle(doc, ML + 4, p5Y + 7, 'Rentabilidade acumulada por produto', 'Informações detalhadas por produto e classe de ativo.')

  autoTable(doc, {
    startY: p5Y + 12,
    margin: { left: ML + 3, right: MR + 3 },
    head: [['Ativo', 'Valor Investido', 'Proventos', 'P&L', 'Valor Atualizado', 'Rentabilidade', 'Preço Médio', '% da carteira']],
    body: prodBody,
    styles: { fontSize: 6.5, cellPadding: 1.5, lineColor: COR_BORDA, lineWidth: 0.1 },
    headStyles: { fillColor: COR_FUNDO_HEADER, textColor: COR_PRETO, fontStyle: 'normal', fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { halign: 'right' as const },
      2: { halign: 'right' as const },
      3: { halign: 'right' as const },
      4: { halign: 'right' as const },
      5: { halign: 'right' as const },
      6: { halign: 'right' as const },
      7: { halign: 'right' as const },
    },
    alternateRowStyles: { fillColor: COR_FUNDO_ALT },
    didParseCell: (data: CellHookData) => {
      if (data.section !== 'body') return
      const ri = data.row.index
      if (isClasseRow[ri]) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = [244, 246, 252]
      }
      if (isTotalRow[ri]) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = [237, 242, 255]
      }
      if (data.column.index === 3 || data.column.index === 5) {
        const raw = data.cell.raw as string
        if (raw && raw !== '—') {
          const neg = raw.trim().startsWith('-')
          data.cell.styles.textColor = neg ? COR_VERMELHO : COR_VERDE
        }
      }
    },
    didDrawPage: () => {
      addHeader(doc, d.nomeCliente, periodo)
    },
  })

  // Numeração de páginas
  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(...COR_CINZA)
    doc.text(`Página ${i} / ${total}`, ML, H - 4)
  }

  const nomeSafe = d.nomeCliente.replace(/\s+/g, '-')
  doc.save(`relatorio_${nomeSafe}_${d.dataInicial}_${d.dataFinal}.pdf`)
}
