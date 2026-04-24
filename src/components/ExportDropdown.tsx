'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react'

interface ExportDropdownProps {
  onExportExcel: () => void
  onExportPDF: () => void
  label?: string
}

export function ExportDropdown({ onExportExcel, onExportPDF, label = 'Export' }: ExportDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <Button
        variant="outline"
        className="border-green-600 text-green-600 hover:bg-green-50 flex items-center gap-2"
        onClick={() => setOpen(!open)}
      >
        <Download size={18} />
        {label}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
          <button
            onClick={() => { onExportExcel(); setOpen(false) }}
            className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-green-50 transition-colors border-b border-gray-100"
          >
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <FileSpreadsheet size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Excel (.xlsx)</p>
              <p className="text-xs text-gray-500">Spreadsheet format</p>
            </div>
          </button>
          <button
            onClick={() => { onExportPDF(); setOpen(false) }}
            className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-green-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <FileText size={18} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">PDF Document</p>
              <p className="text-xs text-gray-500">Print-ready format</p>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
