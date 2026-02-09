// Stock Update Page - Claude Code Terminal Theme
'use client'

import { useState, useCallback, useRef } from 'react'
import { RecoveryPrompt } from '@/features/admin/components/stock/RecoveryPrompt'
import { VerificationReport } from '@/features/admin/components/stock/VerificationReport'
import { StockUpdateModal } from '@/features/admin/components/stock/StockUpdateModal'
import { StockTerminal, TerminalCommand, terminalColors } from '@/features/admin/components/stock/StockTerminal'
import { TerminalSourceSelector } from '@/features/admin/components/stock/TerminalSourceSelector'
import { TerminalResultsPanel } from '@/features/admin/components/stock/TerminalResultsPanel'
import { useStockUpdatePersistence } from '@/features/admin/hooks/useStockUpdatePersistence'
import { useVerification } from '@/features/admin/hooks/useVerification'
import type { StockUpdateSession, ExcelRowCache, UpdateResult, SourceType } from '@/features/admin/types/stock-update'

export default function StockUpdatePage() {
  // Source and file state
  const [source, setSource] = useState<SourceType>('pirelli')
  const [file, setFile] = useState<File | null>(null)
  const [showModal, setShowModal] = useState(false)

  // Results state
  const [updateResult, setUpdateResult] = useState<UpdateResult | null>(null)
  const [excelDataCache, setExcelDataCache] = useState<ExcelRowCache[]>([])

  // Recovery and verification state
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false)
  const [recoveredSession, setRecoveredSession] = useState<StockUpdateSession | null>(null)
  const [showVerificationReport, setShowVerificationReport] = useState(false)

  // Refs for file inputs
  const pirelliFileRef = useRef<HTMLInputElement>(null)
  const corvenFileRef = useRef<HTMLInputElement>(null)

  // Persistence hook
  const persistence = useStockUpdatePersistence({
    onSessionRecover: (session) => {
      setRecoveredSession(session)
      setShowRecoveryPrompt(true)
    },
    onError: (error) => {
      console.error('Persistence error:', error)
    },
  })

  // Verification hook
  const verification = useVerification()

  // Handle source button click - opens file dialog
  const handleSourceClick = useCallback((selectedSource: SourceType) => {
    setSource(selectedSource)
    setUpdateResult(null)
    setExcelDataCache([])

    // Trigger file dialog
    if (selectedSource === 'pirelli') {
      pirelliFileRef.current?.click()
    } else {
      corvenFileRef.current?.click()
    }
  }, [])

  // Check if file is Excel
  const isExcelFile = (file: File): boolean => {
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]
    const validExtensions = ['.xlsx', '.xls']
    return validTypes.includes(file.type) || validExtensions.some(ext => file.name.endsWith(ext))
  }

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, selectedSource: SourceType) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && isExcelFile(selectedFile)) {
      setSource(selectedSource)
      setFile(selectedFile)
      setShowModal(true)
      setUpdateResult(null)
      setExcelDataCache([])
    }
    // Reset file input
    e.target.value = ''
  }

  // Handle modal complete
  const handleModalComplete = useCallback((result: UpdateResult, excelData: ExcelRowCache[]) => {
    setUpdateResult(result)
    setExcelDataCache(excelData)
    persistence.completeSession(result)
  }, [persistence])

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setShowModal(false)
    setFile(null)
  }, [])

  // Handle recovery
  const handleRecover = useCallback(() => {
    if (!recoveredSession) return

    const recovered = persistence.getRecoverableSession()
    if (recovered) {
      setSource(recovered.session.source)
      if (recovered.session.updateResult) {
        setUpdateResult(recovered.session.updateResult)
      }
      if (recovered.session.excelData) {
        setExcelDataCache(recovered.session.excelData)
      }
    }

    setShowRecoveryPrompt(false)
    setRecoveredSession(null)
  }, [recoveredSession, persistence])

  const handleDiscardRecovery = useCallback(() => {
    persistence.clearSession()
    setShowRecoveryPrompt(false)
    setRecoveredSession(null)
  }, [persistence])

  // Handle reset
  const handleReset = useCallback(() => {
    setFile(null)
    setUpdateResult(null)
    setExcelDataCache([])
    setShowVerificationReport(false)
    verification.clear()
    persistence.clearSession()
  }, [verification, persistence])

  // Handle verify
  const handleVerify = useCallback(() => {
    if (updateResult) {
      verification.verify(updateResult.source, excelDataCache)
      setShowVerificationReport(true)
    }
  }, [updateResult, excelDataCache, verification])

  return (
    <main
      className="min-h-screen p-6"
      style={{ background: terminalColors.background }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Hidden file inputs */}
        <input
          ref={pirelliFileRef}
          type="file"
          className="hidden"
          accept=".xlsx,.xls"
          onChange={(e) => handleFileSelect(e, 'pirelli')}
        />
        <input
          ref={corvenFileRef}
          type="file"
          className="hidden"
          accept=".xlsx,.xls"
          onChange={(e) => handleFileSelect(e, 'corven')}
        />

        {/* Main Terminal Window */}
        <StockTerminal
          title="STOCK UPDATE"
          subtitle={updateResult ? `${source.toUpperCase()} - ${updateResult.totalRows} productos procesados` : undefined}
          isRunning={showModal}
        >
          <div className="p-6 space-y-6">
            {/* Help command line */}
            <TerminalCommand
              command="stock-update --help"
              output="Actualiza precios y stock desde Excel. Soporta Pirelli y Corven."
            />

            {/* Recovery Prompt */}
            {showRecoveryPrompt && recoveredSession && (
              <RecoveryPrompt
                session={recoveredSession}
                onRecover={handleRecover}
                onDiscard={handleDiscardRecovery}
              />
            )}

            {/* Verification Report */}
            {showVerificationReport && verification.result && (
              <VerificationReport
                result={verification.result}
                onClose={() => setShowVerificationReport(false)}
              />
            )}

            {/* Source Selector - Only when no results */}
            {!updateResult && (
              <TerminalSourceSelector
                onSelect={handleSourceClick}
                disabled={showModal}
              />
            )}

            {/* Results Panel */}
            {updateResult && (
              <TerminalResultsPanel
                result={updateResult}
                excelDataCache={excelDataCache}
                onReset={handleReset}
                onVerify={handleVerify}
                isVerifying={verification.isLoading}
                verificationError={verification.error}
              />
            )}
          </div>
        </StockTerminal>

        {/* Update Modal */}
        <StockUpdateModal
          isOpen={showModal}
          source={source}
          file={file}
          onClose={handleModalClose}
          onComplete={handleModalComplete}
        />
      </div>
    </main>
  )
}
