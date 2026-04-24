import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

// Branding colors for Fikir Design
const BRAND = {
  primary: '#16a34a', // green-600
  primaryLight: '#dcfce7', // green-100
  text: '#1f2937', // gray-800
  textLight: '#6b7280', // gray-500
  white: '#ffffff',
  border: '#e5e7eb', // gray-200
}

interface ExportColumn<T = any> {
  header: string
  key: string
  width?: number
  format?: (value: any, row: T) => string
}

interface ExportOptions<T = any> {
  title: string
  subtitle?: string
  filename: string
  columns: ExportColumn<T>[]
  data: T[]
  companyName?: string
  companyInfo?: string[]
  logoUrl?: string
}

// Helper to format dates
function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('en-ET', { year: 'numeric', month: 'short', day: 'numeric' })
}

// Helper to format currency
function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return '-'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '-'
  return num.toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ETB'
}

// Export to Excel with branding
export function exportToExcel<T = any>(options: ExportOptions<T>): void {
  const { title, subtitle, filename, columns, data, companyName = 'Fikir Design', companyInfo = [] } = options

  // Prepare worksheet data
  const wsData: any[][] = []

  // Add company header (merged cells will be applied)
  wsData.push([companyName])
  wsData.push([title])
  if (subtitle) wsData.push([subtitle])
  if (companyInfo.length > 0) {
    companyInfo.forEach(info => wsData.push([info]))
  }
  wsData.push([]) // Empty row

  // Add headers
  wsData.push(columns.map(c => c.header))

  // Add data rows
  data.forEach(row => {
    wsData.push(
      columns.map(col => {
        const value = (row as any)[col.key]
        if (col.format) {
          return col.format(value, row)
        }
        if (value === null || value === undefined) return '-'
        return String(value)
      })
    )
  })

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Set column widths
  const colWidths = columns.map((col, i) => ({ wch: col.width || 15 }))
  ws['!cols'] = [{ wch: 30 }, ...colWidths] // First column for header info

  // Apply styling (via cell properties where supported)
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')

  // Style company name row (row 0)
  const companyCell = XLSX.utils.encode_cell({ r: 0, c: 0 })
  if (!ws[companyCell]) ws[companyCell] = {}
  ws[companyCell].s = {
    font: { bold: true, sz: 16, color: { rgb: '16a34a' } },
    fill: { fgColor: { rgb: 'dcfce7' } },
    alignment: { horizontal: 'center' }
  }

  // Style title row (row 1)
  const titleCell = XLSX.utils.encode_cell({ r: 1, c: 0 })
  if (!ws[titleCell]) ws[titleCell] = {}
  ws[titleCell].s = {
    font: { bold: true, sz: 14 },
    alignment: { horizontal: 'center' }
  }

  // Style header row (find it - after company info)
  const headerRowIndex = wsData.findIndex(row => row[0] === columns[0].header)
  if (headerRowIndex >= 0) {
    for (let c = 0; c < columns.length; c++) {
      const cell = XLSX.utils.encode_cell({ r: headerRowIndex, c })
      if (!ws[cell]) ws[cell] = {}
      ws[cell].s = {
        font: { bold: true, color: { rgb: 'ffffff' } },
        fill: { fgColor: { rgb: '16a34a' } },
        alignment: { horizontal: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '16a34a' } },
          bottom: { style: 'thin', color: { rgb: '16a34a' } }
        }
      }
    }
  }

  // Create workbook
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31))

  // Save file
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

// Export to PDF with branding
export function exportToPDF<T = any>(options: ExportOptions<T>): void {
  const { title, subtitle, filename, columns, data, companyName = 'Fikir Design', companyInfo = [] } = options

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // Add company branding header
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15

  // Green header bar
  doc.setFillColor(22, 163, 74) // green-600
  doc.rect(0, 0, pageWidth, 25, 'F')

  // Company name in header
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(companyName, margin, 15)

  // Report title below header
  doc.setTextColor(31, 41, 55) // gray-800
  doc.setFontSize(14)
  doc.text(title, margin, 35)

  if (subtitle) {
    doc.setFontSize(10)
    doc.setTextColor(107, 114, 128) // gray-500
    doc.text(subtitle, margin, 42)
  }

  // Company info on the right
  if (companyInfo.length > 0) {
    doc.setFontSize(8)
    doc.setTextColor(107, 114, 128)
    let yPos = 35
    companyInfo.forEach(info => {
      doc.text(info, pageWidth - margin - doc.getTextWidth(info), yPos)
      yPos += 5
    })
  }

  // Date generated
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128)
  doc.text(`Generated: ${new Date().toLocaleString('en-ET')}`, margin, 50)

  // Prepare table data
  const tableHeaders = columns.map(c => c.header)
  const tableData = data.map(row =>
    columns.map(col => {
      const value = (row as any)[col.key]
      if (col.format) {
        return col.format(value, row)
      }
      if (value === null || value === undefined) return '-'
      return String(value)
    })
  )

  // Add table
  ;(doc as any).autoTable({
    head: [tableHeaders],
    body: tableData,
    startY: 55,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [22, 163, 74], // green-600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [31, 41, 55]
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    },
    columnStyles: columns.reduce((acc, col, i) => {
      acc[i] = { cellWidth: col.width ? col.width * 0.5 : 'auto' }
      return acc
    }, {} as any),
    styles: {
      cellPadding: 3,
      lineColor: [229, 231, 235], // gray-200
      lineWidth: 0.1
    },
    didDrawPage: (data: any) => {
      // Footer on each page
      const pageCount = doc.internal.pages.length
      doc.setFontSize(8)
      doc.setTextColor(107, 114, 128)
      doc.text(
        `Page ${data.pageNumber} of ${pageCount} | Fikir Design © ${new Date().getFullYear()}`,
        margin,
        doc.internal.pageSize.getHeight() - 10
      )
    }
  })

  // Save PDF
  doc.save(`${filename}.pdf`)
}

// Predefined column helpers for common data types
export const ColumnHelpers = {
  text: (header: string, key: string, width?: number): ExportColumn => ({
    header,
    key,
    width: width || 20,
    format: (v) => v || '-'
  }),

  number: (header: string, key: string, width?: number): ExportColumn => ({
    header,
    key,
    width: width || 12,
    format: (v) => {
      if (v === null || v === undefined || v === '') return '-'
      const num = typeof v === 'string' ? parseFloat(v) : v
      if (isNaN(num)) return '-'
      return num.toLocaleString('en-ET')
    }
  }),

  currency: (header: string, key: string, width?: number): ExportColumn => ({
    header,
    key,
    width: width || 15,
    format: (v) => formatCurrency(v)
  }),

  date: (header: string, key: string, width?: number): ExportColumn => ({
    header,
    key,
    width: width || 15,
    format: (v) => formatDate(v)
  }),

  status: (header: string, key: string, width?: number): ExportColumn => ({
    header,
    key,
    width: width || 12,
    format: (v) => v ? v.toString().replace(/_/g, ' ').toUpperCase() : '-'
  }),

  boolean: (header: string, key: string, width?: number): ExportColumn => ({
    header,
    key,
    width: width || 10,
    format: (v) => v ? 'Yes' : 'No'
  })
}

// Generic export function that can be used by any page
export function exportData<T = any>(
  format: 'excel' | 'pdf',
  options: ExportOptions<T>
): void {
  if (format === 'excel') {
    exportToExcel(options)
  } else {
    exportToPDF(options)
  }
}

// Hook-style helper for React components
export function useExport() {
  return {
    exportToExcel,
    exportToPDF,
    exportData,
    ColumnHelpers
  }
}
