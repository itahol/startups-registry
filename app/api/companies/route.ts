import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""

    let supabaseQuery = supabase.from("companies").select("*").order("name")

    // If there's a search query, filter the results
    if (query.trim()) {
      // Search across name, categories, backing_vcs, stage, and founders
      supabaseQuery = supabaseQuery.or(
        `name.ilike.%${query}%,` +
          `categories.cs.{${query}},` +
          `backing_vcs.cs.{${query}},` +
          `stage.ilike.%${query}%,` +
          `founders.cs.{${query}}`,
      )
    }

    const { data: companies, error } = await supabaseQuery

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 })
    }

    // If there's a search query, sort results to prioritize name matches
    if (query.trim() && companies) {
      companies.sort((a, b) => {
        const aNameMatch = a.name.toLowerCase().includes(query.toLowerCase())
        const bNameMatch = b.name.toLowerCase().includes(query.toLowerCase())

        if (aNameMatch && !bNameMatch) return -1
        if (!aNameMatch && bNameMatch) return 1
        return 0
      })
    }

    return NextResponse.json(companies || [])
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
