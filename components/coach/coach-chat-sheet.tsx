"use client"

import React, { useState, useTransition } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
} from "@/components/ui/message-scroller"
import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/ui/message"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Marker, MarkerContent } from "@/components/ui/marker"
import {
  Compass,
  Send,
  Bot,
  User,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { askCoachAction, clearCoachChatAction } from "@/lib/actions/coach"
import type { SerializedCoachMessage } from "@/types"

interface CoachChatSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialMessages: SerializedCoachMessage[]
  userName?: string | null
}

const PROMPT_CHIPS = [
  "How can I pay off my loans faster?",
  "How is my emergency fund performing?",
  "What subscriptions should I consider trimming?",
  "Can I afford to boost savings by 10%?",
]

export function CoachChatSheet({
  open,
  onOpenChange,
  initialMessages,
  userName,
}: CoachChatSheetProps) {
  const [messages, setMessages] = useState<SerializedCoachMessage[]>(initialMessages)
  const [inputQuery, setInputQuery] = useState("")
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim()
    if (!query || isPending) return

    const userMessage: SerializedCoachMessage = {
      _id: `temp_user_${Date.now()}`,
      userId: "me",
      role: "user",
      content: query,
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputQuery("")

    startTransition(async () => {
      const res = await askCoachAction({ question: query })
      if (res.success && res.reply) {
        const coachReply: SerializedCoachMessage = {
          _id: `temp_coach_${Date.now()}`,
          userId: "me",
          role: "coach",
          content: res.reply,
          createdAt: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, coachReply])
      } else {
        toast.error(res.error || "Failed to receive response from Coach")
      }
    })
  }

  const confirmClear = () => {
    startTransition(async () => {
      const res = await clearCoachChatAction()
      if (res.success) {
        setMessages([])
        setIsClearDialogOpen(false)
        toast.success("Chat history cleared")
      } else {
        toast.error(res.error || "Failed to clear chat")
      }
    })
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg flex flex-col p-0 overflow-hidden">
        {/* ── Sheet Header ── */}
        <SheetHeader className="text-left p-4 pb-3 border-b border-border flex flex-row items-center gap-2.5">
          <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Compass className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <SheetTitle className="text-base font-bold text-foreground">
              Dime Financial Coach
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Grounded conversational advisor & strategy simulator.
            </SheetDescription>
          </div>
        </SheetHeader>

        {/* ── Chat Messages Stream via Official shadcn MessageScroller ── */}
        <div className="flex-1 min-h-0 relative flex flex-col bg-muted/10 overflow-hidden">
          <MessageScrollerProvider autoScroll>
            <MessageScroller className="p-4">
              <MessageScrollerViewport className="overflow-x-hidden scrollbar-none">
                <MessageScrollerContent className="overflow-x-hidden">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center text-center p-6 gap-3 my-auto">
                      <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                        <Bot className="size-6" />
                      </div>
                      <div className="flex flex-col gap-1 max-w-xs">
                        <h4 className="text-sm font-bold text-foreground">
                          Ask your Coach anything
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Your coach uses your real budgets, loans, and emergency reserves to provide tailored optimization strategies.
                        </p>
                      </div>
                    </div>
                  )}

                  {messages.map((m) => (
                    <MessageScrollerItem
                      key={m._id}
                      messageId={m._id}
                      scrollAnchor={m.role === "user"}
                    >
                      <Message align={m.role === "user" ? "end" : "start"} className="gap-2.5">
                        <MessageAvatar className="bg-transparent">
                          <Avatar size="default">
                            <AvatarFallback
                              className={cn(
                                "text-[10px] font-bold",
                                m.role === "user"
                                  ? "bg-primary/10 text-primary"
                                  : "bg-primary text-primary-foreground"
                              )}
                            >
                              {m.role === "user" ? (
                                userName ? userName.slice(0, 2).toUpperCase() : <User className="size-3.5" />
                              ) : (
                                <Compass className="size-3.5" />
                              )}
                            </AvatarFallback>
                          </Avatar>
                        </MessageAvatar>

                        <MessageContent className="gap-1 min-w-0">
                          <Bubble
                            variant={m.role === "user" ? "default" : "muted"}
                            align={m.role === "user" ? "end" : "start"}
                            className="rounded-2xl shadow-xs max-w-full"
                          >
                            <BubbleContent className="text-xs leading-relaxed whitespace-pre-wrap break-words">
                              {m.content}
                            </BubbleContent>
                          </Bubble>
                        </MessageContent>
                      </Message>
                    </MessageScrollerItem>
                  ))}

                  {isPending && (
                    <MessageScrollerItem messageId="pending-turn">
                      <Marker role="status">
                        <MarkerContent className="shimmer">
                          <span className="font-medium">Dime Coach</span> is typing...
                        </MarkerContent>
                      </Marker>
                    </MessageScrollerItem>
                  )}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </MessageScrollerProvider>
        </div>

        {/* ── Prompt Suggestion Chips ── */}
        <Separator />
        <div className="px-3 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-card">
          {PROMPT_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isPending}
              onClick={() => handleSend(chip)}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium border border-border/40 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 transition-colors cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* ── Bottom Input Row ── */}
        <div className="px-3 pb-2.5 bg-card">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex items-center gap-2"
          >
            <InputGroup className="flex-1 rounded-xl h-10 border-border/40 bg-muted/20">
              <InputGroupInput
                placeholder="Ask about debt payoff, savings runway, budgets..."
                value={inputQuery}
                disabled={isPending}
                onChange={(e) => setInputQuery(e.target.value)}
                className="text-xs placeholder:text-muted-foreground"
              />
            </InputGroup>

            <Button
              type="submit"
              size="icon"
              disabled={!inputQuery.trim() || isPending}
              className="size-10 rounded-xl cursor-pointer shrink-0 shadow-sm"
            >
              <Send className="size-4" />
            </Button>
          </form>
        </div>

        {/* ── One-line Bottom Footer Element ── */}
        <Separator />
        <div className="px-3.5 py-2 flex items-center justify-between text-[11px] text-muted-foreground bg-muted/40">
          <span className="truncate text-muted-foreground/75 text-[11px]">
            Messages auto-delete after 30 days
          </span>
          {messages.length > 0 && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => setIsClearDialogOpen(true)}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer text-[11px] font-medium shrink-0 ml-2"
            >
              <Trash2 className="size-3" />
              <span>Clear chat history</span>
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>

    <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Trash2 className="size-6" />
          </AlertDialogMedia>
          <AlertDialogTitle>Clear Chat History</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete your entire conversation history with the Dime Financial Coach. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={confirmClear}
            disabled={isPending}
          >
            Clear History
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  )
}
