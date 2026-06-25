"use client"

import React, { useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ChevronDown, HelpCircle } from "lucide-react"

gsap.registerPlugin(ScrollTrigger)

const faqItems = [
  {
    question: "What is Dime and how does it work?",
    answer: "Dime is a self-owned personal finance workspace designed for absolute privacy. It runs locally and stores data inside your dedicated MongoDB database, allowing you to track multi-currency wallets, set budgets, scan receipts, and collaborate safely."
  },
  {
    question: "Is my financial data secure?",
    answer: "Absolutely. Dime is security-first. We use biometric WebAuthn Passkeys for passwordless authentication, support Time-Based OTP (TOTP), and store your data in your private MongoDB database. Your financial details are yours alone."
  },
  {
    question: "How does the AI Receipt Scanner work?",
    answer: "Simply drag and drop any receipt or invoice image. Dime utilizes Google Gemini OCR models to automatically extract the vendor name, transaction date, category, and total amount, completely saving you manual entry."
  },
  {
    question: "Can I share wallets with other people?",
    answer: "Yes. Dime supports shared accounts, allowing you to invite partners or household members to collaborate on specific wallets without sharing passwords or credentials."
  },
  {
    question: "How does the multi-currency system work?",
    answer: "Dime updates and caches exchange rates hourly. You can set individual currencies for each wallet, and Dime will automatically calculate conversions and display your total net worth in your preferred base currency."
  }
]

export function LandingFAQ() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index)
  }

  useGSAP(() => {
    const items = containerRef.current?.querySelectorAll(".faq-card")
    if (items) {
      gsap.fromTo(items,
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
            toggleActions: "play none none none"
          }
        }
      )
    }
  }, { scope: containerRef })

  return (
    <section id="faq" ref={containerRef} className="mx-auto max-w-4xl px-6 py-24 sm:py-32">
      <div className="mb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-muted/30 px-3.5 py-1 text-xs font-semibold backdrop-blur-xs mb-4">
          <HelpCircle className="size-3.5 text-primary" />
          Got Questions?
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
          Frequently Asked.
        </h2>
      </div>

      <div className="flex flex-col gap-4">
        {faqItems.map((item, idx) => {
          const isOpen = activeIndex === idx
          return (
            <div
              key={idx}
              className="faq-card border border-border/40 bg-card/45 rounded-2xl overflow-hidden backdrop-blur-xs transition-colors duration-300 hover:border-border/80"
            >
              <button
                onClick={() => toggleFAQ(idx)}
                className="w-full flex items-center justify-between p-6 text-left font-semibold text-lg text-foreground hover:text-primary transition-colors cursor-pointer select-none"
                aria-expanded={isOpen}
              >
                <span>{item.question}</span>
                <ChevronDown className={`size-5 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180 text-primary" : ""}`} />
              </button>

              {/* Smooth CSS Grid Height Transition */}
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-6 pb-6 text-sm text-muted-foreground leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
