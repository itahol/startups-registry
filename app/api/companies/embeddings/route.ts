import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateEmbedding, generateCompanyText } from "@/lib/embeddings"

// Generate embeddings for all companies that don't have them
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get companies without embeddings
    const { data: companies, error: fetchError } = await supabase.from("companies").select("*").is("embedding", null)

    if (fetchError) {
      return NextResponse.json({ error: `Failed to fetch companies: ${fetchError.message}` }, { status: 500 })
    }

    if (!companies || companies.length === 0) {
      return NextResponse.json({ message: "All companies already have embeddings" })
    }

    // Generate embeddings for each company
    const updates = []
    for (const company of companies) {
      const companyText = generateCompanyText(company)
      const embedding = await generateEmbedding(companyText)

      updates.push({
        id: company.id,
        embedding: `[${embedding.join(",")}]`, // PostgreSQL vector format
      })
    }

    // Update companies with embeddings
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from("companies")
        .update({ embedding: update.embedding })
        .eq("id", update.id)

      if (updateError) {
        console.error(`Failed to update embedding for company ${update.id}:`, updateError)
      }
    }

    return NextResponse.json({
      message: `Generated embeddings for ${updates.length} companies`,
    })
  } catch (error) {
    console.error("Error generating embeddings:", error)
    return NextResponse.json({ error: "Failed to generate embeddings" }, { status: 500 })
  }
}
