"use client"

import React, { useState, useRef } from "react"
import { scanReceiptAction } from "@/lib/actions/transactions"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles, Upload, FileText, Image as ImageIcon, CheckCircle, RefreshCw } from "lucide-react"

interface ReceiptScannerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScanComplete: (data: {
    merchant: string
    amount: number
    date: Date
    categoryName: string
    currency: string
    description: string
  }) => void
}

export function ReceiptScannerModal({
  open,
  onOpenChange,
  onScanComplete,
}: ReceiptScannerModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scannedData, setScannedData] = useState<any | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setPreviewUrl(URL.createObjectURL(selectedFile))
      setScannedData(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      setFile(droppedFile)
      setPreviewUrl(URL.createObjectURL(droppedFile))
      setScannedData(null)
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleScan = async () => {
    if (!file) return

    setIsScanning(true)
    const reader = new FileReader()
    
    reader.onload = async () => {
      try {
        const base64Image = reader.result as string
        const res = await scanReceiptAction(base64Image, file.name)
        if (res.success) {
          setScannedData(res.data)
          toast.success("Receipt scanned successfully!")
        } else {
          toast.error("Failed to parse receipt data")
        }
      } catch (err) {
        console.error(err)
        toast.error("An error occurred during scanning")
      } finally {
        setIsScanning(false)
      }
    }

    reader.onerror = () => {
      toast.error("Failed to read receipt file")
      setIsScanning(false)
    }

    reader.readAsDataURL(file)
  }

  const handleApply = () => {
    if (scannedData) {
      onScanComplete({
        merchant: scannedData.merchant,
        amount: scannedData.amount,
        date: new Date(scannedData.date),
        categoryName: scannedData.categoryName,
        currency: scannedData.currency,
        description: scannedData.description,
      })
      onOpenChange(false)
      // Reset state
      setFile(null)
      setPreviewUrl(null)
      setScannedData(null)
    }
  }

  const handleReset = () => {
    setFile(null)
    setPreviewUrl(null)
    setScannedData(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] rounded-3xl border border-border/50 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="size-5 text-primary animate-pulse" />
            AI Receipt Scanner
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 pt-2">
          {!file && (
            /* Upload State */
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
              className="flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-2xl p-8 hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer text-center gap-4"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground shadow-xs">
                <Upload className="size-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Upload receipt image</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Drag and drop your file here, or click to browse
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground bg-muted/60 px-3 py-1 rounded">
                Supports JPG, PNG, WEBP (Max 5MB)
              </p>
            </div>
          )}

          {file && !scannedData && (
            /* Selected File State & Scanning */
            <div className="relative rounded-2xl border bg-muted/20 p-6 flex flex-col items-center justify-center gap-4 overflow-hidden min-h-[220px]">
              {previewUrl ? (
                <div className="relative size-24 rounded-lg overflow-hidden border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Preview" className="object-cover size-full" />
                </div>
              ) : (
                <FileText className="size-16 text-muted-foreground animate-pulse" />
              )}
              
              <div className="text-center">
                <p className="text-sm font-bold text-foreground truncate max-w-[280px]">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
              </div>

              {isScanning && (
                /* Scanning Beam Animation overlay */
                <div className="absolute inset-0 bg-background/70 backdrop-blur-xs flex flex-col items-center justify-center gap-3">
                  <div className="relative w-full max-w-[280px] h-2 bg-muted rounded-full overflow-hidden">
                    <div className="absolute top-0 bottom-0 left-0 bg-primary w-24 rounded-full animate-[shimmer_1.5s_infinite_linear]" style={{
                      animation: "shimmer 1.5s infinite linear",
                      backgroundImage: "linear-gradient(90deg, transparent, var(--primary), transparent)",
                    }} />
                  </div>
                  <style jsx global>{`
                    @keyframes shimmer {
                      0% { transform: translateX(-100%); }
                      100% { transform: translateX(300%); }
                    }
                  `}</style>
                  <p className="text-xs font-bold text-primary animate-pulse flex items-center gap-1.5">
                    <RefreshCw className="size-3.5 animate-spin" /> Scanning with Gemini OCR...
                  </p>
                </div>
              )}
            </div>
          )}

          {scannedData && (
            /* Scanned Results Preview */
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 flex flex-col gap-4 text-left">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2.5 py-0.5 rounded-full bg-primary/15 flex items-center gap-1">
                  <CheckCircle className="size-3" /> Scan Complete
                </span>
                <button onClick={handleReset} className="text-xs font-medium text-muted-foreground hover:text-foreground underline flex items-center gap-1 cursor-pointer">
                  Try another
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-border/20 pt-3 text-sm">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Merchant</p>
                  <p className="font-bold text-foreground mt-0.5">{scannedData.merchant}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Amount</p>
                  <p className="font-extrabold text-foreground mt-0.5 text-base">
                    {(scannedData.amount / 100).toFixed(2)} {scannedData.currency}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Category</p>
                  <p className="font-semibold text-foreground mt-0.5">{scannedData.categoryName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Date</p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {new Date(scannedData.date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="border-t border-border/20 pt-3 text-sm">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Description</p>
                <p className="text-xs text-muted-foreground mt-0.5">{scannedData.description}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-3 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isScanning}
            className="rounded-xl font-semibold cursor-pointer"
          >
            Close
          </Button>

          {file && !scannedData && (
            <Button
              type="button"
              onClick={handleScan}
              disabled={isScanning}
              className="rounded-xl font-bold cursor-pointer"
            >
              Scan Receipt
            </Button>
          )}

          {scannedData && (
            <Button
              type="button"
              onClick={handleApply}
              className="rounded-xl font-bold cursor-pointer"
            >
              Autofill Form
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
