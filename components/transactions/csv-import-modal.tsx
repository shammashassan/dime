"use client"

import React, { useState, useRef } from "react"
import { Wallet, Category } from "@/types"
import { importTransactionsAction } from "@/lib/actions/transactions"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { 
  FieldGroup, 
  Field, 
  FieldLabel 
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileSpreadsheet, Upload, ArrowRight, ArrowLeft, Check, Sparkles, AlertCircle } from "lucide-react"

interface CSVImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  wallets: Wallet[]
  categories: Category[]
}

export function CSVImportModal({
  open,
  onOpenChange,
  wallets,
  categories,
}: CSVImportModalProps) {
  const [step, setStep] = useState(1)
  const [file, setFile] = useState<File | null>(null)
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvRows, setCsvRows] = useState<string[][]>([])
  
  // Mappings state
  const [targetWalletId, setTargetWalletId] = useState("")
  const [dateCol, setDateCol] = useState("")
  const [amountCol, setAmountCol] = useState("")
  const [descCol, setDescCol] = useState("")
  const [categoryCol, setCategoryCol] = useState("")
  const [defaultType, setDefaultType] = useState<"expense" | "income">("expense")

  // Preview transactions
  const [parsedTransactions, setParsedTransactions] = useState<any[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeWallets = wallets.filter(w => !w.isArchived)

  const resetState = () => {
    setStep(1)
    setFile(null)
    setCsvHeaders([])
    setCsvRows([])
    setTargetWalletId("")
    setDateCol("")
    setAmountCol("")
    setDescCol("")
    setCategoryCol("")
    setDefaultType("expense")
    setParsedTransactions([])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result as string
        parseCSV(text)
      }
      reader.readAsText(selectedFile)
    }
  }

  const parseCSV = (text: string) => {
    // Basic CSV Line parser (handles quoted commas)
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== "")
    if (lines.length === 0) {
      toast.error("CSV file is empty")
      return
    }

    const parseLine = (line: string) => {
      const result: string[] = []
      let current = ""
      let inQuotes = false
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim())
          current = ""
        } else {
          current += char
        }
      }
      result.push(current.trim())
      return result
    }

    const headers = parseLine(lines[0])
    const rows = lines.slice(1).map(parseLine)

    setCsvHeaders(headers)
    setCsvRows(rows)

    // Pre-populate mappings based on names
    headers.forEach(h => {
      const lower = h.toLowerCase()
      if (lower.includes("date")) setDateCol(h)
      if (lower.includes("amount") || lower.includes("value") || lower.includes("price")) setAmountCol(h)
      if (lower.includes("desc") || lower.includes("payee") || lower.includes("info") || lower.includes("narrative")) setDescCol(h)
      if (lower.includes("cat") || lower.includes("group") || lower.includes("tag")) setCategoryCol(h)
    })

    setStep(2)
  }

  const handleNextToPreview = () => {
    if (!targetWalletId || !dateCol || !amountCol || !descCol) {
      toast.error("Please fill in all required mappings and select a wallet")
      return
    }

    const dateIdx = csvHeaders.indexOf(dateCol)
    const amountIdx = csvHeaders.indexOf(amountCol)
    const descIdx = csvHeaders.indexOf(descCol)
    const catIdx = categoryCol ? csvHeaders.indexOf(categoryCol) : -1

    const transactions: any[] = []

    csvRows.forEach((row, i) => {
      if (row.length <= Math.max(dateIdx, amountIdx, descIdx)) return

      const rawDate = row[dateIdx]
      const rawAmount = row[amountIdx]
      const rawDesc = row[descIdx]
      const rawCat = catIdx !== -1 ? row[catIdx] : ""

      // Clean date
      let parsedDate = new Date(rawDate)
      if (isNaN(parsedDate.getTime())) {
        parsedDate = new Date()
      }

      // Clean amount (supports negative sign representing expenses, positive representing income)
      let cleanedAmountStr = rawAmount.replace(/[^\d.-]/g, "")
      let amountVal = parseFloat(cleanedAmountStr)
      if (isNaN(amountVal)) amountVal = 0

      // If the CSV has negative numbers, detect type dynamically, otherwise default to defaultType
      const isNegative = amountVal < 0
      const type = isNegative ? "expense" : defaultType
      const positiveAmountInCents = Math.round(Math.abs(amountVal) * 100)

      transactions.push({
        index: i,
        selected: true,
        date: parsedDate,
        amount: positiveAmountInCents,
        description: rawDesc || "CSV Imported Row",
        categoryName: rawCat || "Other",
        type: type,
      })
    })

    setParsedTransactions(transactions)
    setStep(3)
  }

  const handleToggleSelectRow = (index: number) => {
    setParsedTransactions(prev => 
      prev.map(t => t.index === index ? { ...t, selected: !t.selected } : t)
    )
  }

  const handleImport = async () => {
    const importItems = parsedTransactions.filter(t => t.selected)
    if (importItems.length === 0) {
      toast.error("No transactions selected for import")
      return
    }

    setIsImporting(true)
    try {
      const res = await importTransactionsAction(targetWalletId, importItems)
      if (res.success) {
        toast.success(`Imported ${res.count} transactions successfully!`)
        onOpenChange(false)
        resetState()
      } else {
        toast.error("Failed to import transactions")
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "An error occurred during import")
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val)
      if (!val) resetState()
    }}>
      <DialogContent className={`rounded-3xl border border-border/50 shadow-2xl transition-all duration-300 ${
        step === 3 ? "sm:max-w-[720px]" : "sm:max-w-[460px]"
      }`}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-primary" />
            CSV Statement Importer
          </DialogTitle>
        </DialogHeader>

        {/* STEP 1: Upload File */}
        {step === 1 && (
          <div className="flex flex-col gap-4 py-4 text-center">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-2xl p-10 hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer gap-4"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                className="hidden"
              />
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground shadow-xs">
                <Upload className="size-6 text-primary animate-bounce" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Select bank statement CSV</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click to browse or drop your CSV file here
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Configure Mappings */}
        {step === 2 && (
          <form onSubmit={(e) => { e.preventDefault(); handleNextToPreview(); }} className="space-y-6 pt-2">
            <FieldGroup>
              {/* Target Wallet */}
              <Field>
                <FieldLabel>Import Into Wallet</FieldLabel>
                <Select value={targetWalletId} onValueChange={setTargetWalletId}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select target wallet" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {activeWallets.map(w => (
                      <SelectItem key={w._id.toString()} value={w._id.toString()} className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span className="size-2.5 rounded-full" style={{ backgroundColor: w.color }} />
                          <span>{w.name} ({w.currency})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <div className="h-px bg-border/40 w-full" />
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-left">Column Mappings</div>

              {/* Date Mapping */}
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Date Column</FieldLabel>
                  <Select value={dateCol} onValueChange={setDateCol}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Choose column" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {csvHeaders.map(h => <SelectItem key={h} value={h} className="cursor-pointer">{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>

                {/* Amount Mapping */}
                <Field>
                  <FieldLabel>Amount Column</FieldLabel>
                  <Select value={amountCol} onValueChange={setAmountCol}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Choose column" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {csvHeaders.map(h => <SelectItem key={h} value={h} className="cursor-pointer">{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              {/* Description Mapping */}
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Description Column</FieldLabel>
                  <Select value={descCol} onValueChange={setDescCol}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Choose column" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {csvHeaders.map(h => <SelectItem key={h} value={h} className="cursor-pointer">{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>

                {/* Category Mapping */}
                <Field>
                  <FieldLabel>Category (Optional)</FieldLabel>
                  <Select value={categoryCol} onValueChange={setCategoryCol}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="None / Default Other" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="" className="cursor-pointer">None / Default Other</SelectItem>
                      {csvHeaders.map(h => <SelectItem key={h} value={h} className="cursor-pointer">{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              {/* Default Transaction Type */}
              <Field>
                <FieldLabel>Default Transaction Type</FieldLabel>
                <Select value={defaultType} onValueChange={(val) => setDefaultType(val as any)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="expense" className="cursor-pointer">Expense (Debit)</SelectItem>
                    <SelectItem value="income" className="cursor-pointer">Income (Credit)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>

            <DialogFooter className="gap-3 mt-4">
              <Button type="button" variant="outline" onClick={resetState} className="rounded-xl font-semibold cursor-pointer">
                Cancel
              </Button>
              <Button type="submit" disabled={!targetWalletId || !dateCol || !amountCol || !descCol} className="rounded-xl font-bold cursor-pointer">
                Preview Rows <ArrowRight className="ml-2 size-4" />
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* STEP 3: Preview Transactions Table */}
        {step === 3 && (
          <div className="flex flex-col gap-4 py-2">
            <div className="bg-primary/5 text-primary text-xs rounded-xl p-4 border border-primary/10 text-left flex items-start gap-2 leading-relaxed">
              <Sparkles className="size-4.5 text-primary shrink-0 mt-0.5 animate-pulse" />
              <div>
                <strong>Preview parsed rows below.</strong> We have pre-checked all rows. Uncheck any row you wish to exclude. If positive/negative figures exist, they will automatically override the default direction.
              </div>
            </div>

            <div className="max-h-[300px] overflow-y-auto border border-border/60 rounded-xl">
              <Table>
                <TableHeader className="bg-muted/40 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-12 text-center">Import</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedTransactions.map((tx) => (
                    <TableRow key={tx.index} className="hover:bg-muted/20">
                      <TableCell className="text-center">
                        <input
                          type="checkbox"
                          checked={tx.selected}
                          onChange={() => handleToggleSelectRow(tx.index)}
                          className="size-4 rounded border-border/40 accent-primary cursor-pointer"
                        />
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {tx.date.toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-xs max-w-[150px] truncate font-medium">
                        {tx.description}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {tx.categoryName}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          tx.type === "income" 
                            ? "bg-emerald-500/10 text-emerald-500" 
                            : "bg-destructive/10 text-destructive"
                        }`}>
                          {tx.type}
                        </span>
                      </TableCell>
                      <TableCell className={`text-xs text-right font-bold tabular-nums whitespace-nowrap ${
                        tx.type === "income" ? "text-emerald-500" : "text-foreground"
                      }`}>
                        {tx.type === "income" ? "+" : "-"}{(tx.amount / 100).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between items-center text-xs text-muted-foreground bg-muted/40 p-3 rounded-xl">
              <span>Total rows parsed: <strong>{parsedTransactions.length}</strong></span>
              <span>Selected for import: <strong className="text-foreground">{parsedTransactions.filter(t => t.selected).length}</strong></span>
            </div>

            <DialogFooter className="gap-3 mt-4">
              <Button type="button" variant="outline" onClick={() => setStep(2)} disabled={isImporting} className="rounded-xl font-semibold cursor-pointer">
                <ArrowLeft className="mr-2 size-4" /> Back to Map
              </Button>
              <Button type="button" onClick={handleImport} disabled={isImporting} className="rounded-xl font-bold cursor-pointer">
                {isImporting ? "Importing..." : "Confirm & Import"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
