"use client"

import React, { useState } from "react"
import { CoachHeader } from "./coach-header"
import { CoachMetricsRow } from "./coach-metrics-row"
import { CoachOverviewCard } from "./coach-overview-card"
import { CoachPlaybooksView } from "./coach-playbooks-view"
import { CoachSimulatorSheet } from "./coach-simulator-sheet"
import { CoachChatSheet } from "./coach-chat-sheet"
import type { CoachOverviewData } from "@/types"

interface CoachClientProps {
  data: CoachOverviewData
  userName?: string | null
}

export function CoachClient({ data, userName }: CoachClientProps) {
  const [simulatorOpen, setSimulatorOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* ── Page Header ── */}
      <CoachHeader
        currency={data.targetCurrency}
        onOpenSimulator={() => setSimulatorOpen(true)}
        onOpenChat={() => setChatOpen(true)}
      />

      {/* ── Metric Cards Row ── */}
      <CoachMetricsRow
        metrics={data.metrics}
        emergencyFund={data.emergencyFund}
        debtComparison={data.debtComparison}
        currency={data.targetCurrency}
        onOpenSimulator={() => setSimulatorOpen(true)}
      />

      {/* ── Executive Briefing Hero Card ── */}
      <CoachOverviewCard initialBrief={data.summaryBrief} />

      {/* ── Strategy Playbooks (Tabs & Grid) ── */}
      <CoachPlaybooksView
        strategies={data.strategies}
        debtComparison={data.debtComparison}
        currency={data.targetCurrency}
        onOpenSimulator={() => setSimulatorOpen(true)}
      />

      {/* ── Slide-over Simulator Sheet ── */}
      <CoachSimulatorSheet
        open={simulatorOpen}
        onOpenChange={setSimulatorOpen}
        emergencyFund={data.emergencyFund}
        debtComparison={data.debtComparison}
        currency={data.targetCurrency}
      />

      {/* ── Slide-over Chatbot Sheet ── */}
      <CoachChatSheet
        open={chatOpen}
        onOpenChange={setChatOpen}
        initialMessages={data.recentChatMessages || []}
        userName={userName}
      />
    </div>
  )
}
