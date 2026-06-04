"use client"

import React, { useState, useEffect, useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ArrowLeftRight, Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

// Register ScrollTrigger
gsap.registerPlugin(ScrollTrigger)

export function LiveConversionShowcase() {
  const [amount, setAmount] = useState<string>("100")
  const [fromCurrency, setFromCurrency] = useState<string>("USD")
  const [toCurrency, setToCurrency] = useState<string>("EUR")
  const [converted, setConverted] = useState<number | null>(null)
  const [rate, setRate] = useState<number | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const sectionRef = useRef<HTMLDivElement>(null)
  const leftColRef = useRef<HTMLDivElement>(null)
  const rightColRef = useRef<HTMLDivElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  const currencies = ["USD", "EUR", "GBP", "INR", "JPY", "CAD", "AUD", "SGD"]

  useEffect(() => {
    async function fetchRate() {
      if (!fromCurrency || !toCurrency) return
      if (fromCurrency === toCurrency) {
        setRate(1)
        return
      }
      setLoading(true)
      try {
        const res = await fetch(`https://open.er-api.com/v6/latest/${fromCurrency}`)
        if (res.ok) {
          const data = await res.json()
          const val = data.rates[toCurrency]
          if (val) setRate(val)
        }
      } catch (err) {
        console.error("Failed to fetch client rate:", err)
        // Static fallbacks
        const mockRates: Record<string, Record<string, number>> = {
          USD: { EUR: 0.92, INR: 83.5, GBP: 0.78, JPY: 155.2 },
          EUR: { USD: 1.08, INR: 90.7, GBP: 0.85, JPY: 168.4 },
          INR: { USD: 0.012, EUR: 0.011, GBP: 0.0094, JPY: 1.86 },
        }
        const val = mockRates[fromCurrency]?.[toCurrency] || 1
        setRate(val)
      } finally {
        setLoading(false)
      }
    }
    fetchRate()
  }, [fromCurrency, toCurrency])

  useEffect(() => {
    const num = parseFloat(amount)
    if (isNaN(num) || rate === null) {
      setConverted(null)
    } else {
      setConverted(Math.round(num * rate * 100) / 100)
    }
  }, [amount, rate])

  // Scroll Trigger Entrance Animations
  useGSAP(() => {
    // Left text section entrance
    gsap.fromTo(leftColRef.current?.children || [],
      { opacity: 0, x: -30 },
      {
        opacity: 1,
        x: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: leftColRef.current,
          start: "top 80%",
          toggleActions: "play none none none"
        }
      }
    )

    // Right card entrance - with subtle 3D rotate in
    gsap.fromTo(rightColRef.current,
      { opacity: 0, y: 50, rotateY: 8, transformPerspective: 1000 },
      {
        opacity: 1,
        y: 0,
        rotateY: 0,
        duration: 1.1,
        ease: "power4.out",
        scrollTrigger: {
          trigger: rightColRef.current,
          start: "top 75%",
          toggleActions: "play none none none"
        }
      }
    )
  }, { scope: sectionRef })

  // Micro-interaction flash feedback when converted rate changes
  useGSAP(() => {
    if (converted !== null && !loading) {
      gsap.fromTo(resultRef.current,
        { scale: 0.97, backgroundColor: "rgba(var(--primary), 0.12)" },
        { scale: 1, backgroundColor: "rgba(var(--primary), 0.05)", duration: 0.45, ease: "power2.out" }
      )
    }
  }, { dependencies: [converted, loading], scope: sectionRef })

  const handleSwap = () => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)

    // Rotate swap button icon
    gsap.fromTo(".swap-icon-svg",
      { rotate: 0 },
      { rotate: 180, duration: 0.45, ease: "back.out(1.4)" }
    )
  }

  return (
    <section id="analytics" ref={sectionRef} className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
      <Card className="relative overflow-hidden rounded-[3rem] border border-border bg-card shadow-xl">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 to-transparent" />
        <CardContent className="p-12 lg:p-20 relative z-10">
          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-12 gap-y-16 lg:max-w-none lg:grid-cols-2 lg:items-center">
            
            {/* Details */}
            <div ref={leftColRef} className="flex flex-col gap-6 text-left">
              <div className="inline-flex size-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="size-3.5 animate-spin" /> Live Exchange Calculator
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
                Instant multi-currency exchange rates.
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
                Every wallet in Dime can hold balances in a unique currency. Dime handles rate fetches automatically, converts report charts to your default preference in real time, and logs exact rates at the moment of creation.
              </p>
            </div>

            {/* Calculator widget */}
            <Card ref={rightColRef} className="relative aspect-auto rounded-3xl border border-border/50 bg-background/80 shadow-2xl overflow-hidden text-left">
              <CardContent className="p-8 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label htmlFor="landing-amount-input" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Amount</label>
                  <Input
                    id="landing-amount-input"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-input/30"
                    placeholder="0.00"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="w-full sm:flex-1 flex flex-col gap-2">
                    <label htmlFor="landing-from-currency" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">From</label>
                    <Select value={fromCurrency} onValueChange={setFromCurrency}>
                      <SelectTrigger id="landing-from-currency" className="w-full bg-input/30">
                        <SelectValue placeholder="USD" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {currencies.map(c => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleSwap}
                    className="mt-2 sm:mt-6 rounded-full bg-input/30 hover:bg-input/50 transition-transform cursor-pointer shrink-0"
                    aria-label="Swap currencies"
                  >
                    <ArrowLeftRight className="swap-icon-svg rotate-90 sm:rotate-0 transition-transform" />
                  </Button>

                  <div className="w-full sm:flex-1 flex flex-col gap-2">
                    <label htmlFor="landing-to-currency" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">To</label>
                    <Select value={toCurrency} onValueChange={setToCurrency}>
                      <SelectTrigger id="landing-to-currency" className="w-full bg-input/30">
                        <SelectValue placeholder="EUR" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {currencies.map(c => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="h-px bg-border/40 w-full" />

                <div ref={resultRef} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-primary/5 border border-primary/10 rounded-2xl p-5 w-full">
                  <div className="space-y-1 text-left">
                    <p className="text-xs font-semibold text-muted-foreground">Estimated Result</p>
                    <h4 className="text-2xl font-black text-foreground break-all">
                      {loading ? (
                        <span className="text-muted-foreground animate-pulse text-lg">Fetching rates...</span>
                      ) : converted !== null ? (
                        `${converted.toLocaleString()} ${toCurrency}`
                      ) : (
                        "0.00"
                      )}
                    </h4>
                  </div>
                  <div className="text-left sm:text-right text-xs text-muted-foreground shrink-0">
                    <p>1 {fromCurrency} =</p>
                    <p className="font-semibold text-foreground mt-0.5">{rate !== null ? rate.toFixed(4) : "1.0000"} {toCurrency}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
