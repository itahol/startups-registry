"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from '@/components/ui/button'
import { useDebounce } from "@/hooks/use-debounce"

export default function LandingPage() {
  const [q, setQ] = useState("")
  const router = useRouter()

  const debouncedQ = useDebounce(q, 300)

  useEffect(() => {
    // Only navigate after debounce when there is a non-empty query
    if (!debouncedQ.trim()) return

    const params = new URLSearchParams()
    params.set("q", debouncedQ.trim())
    router.push(`/search?${params.toString()}`)
  }, [debouncedQ, router])

  const handleChange = (value: string) => {
    setQ(value)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-3xl w-full px-6">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-extrabold">Your Gateway to the Startup Ecosystem</h1>
          <p className="mt-4 text-lg text-muted-foreground">Instantly find companies, founders, investors, and trends powering the future.</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3">
            <Search className="text-muted-foreground h-5 w-5" />
            <Input
              value={q}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Search companies, tags, sectors, VCs, stages, or founders..."
              className="flex-1 h-12"
            />
          </div>

          <p className="mt-4 text-sm text-muted-foreground">Type to start your search and see live results.</p>
        </div>
      </div>
    </div>
  )
}
