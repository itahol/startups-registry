import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateEmbedding, generateCompanyText } from "@/lib/embeddings"

// Regenerate embeddings for ALL companies (overwrites existing ones)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get all companies
    const { data: companies, error: fetchError } = await supabase.from("companies").select("*")

    if (fetchError) {
      return NextResponse.json({ error: `Failed to fetch companies: ${fetchError.message}` }, { status: 500 })
    }

    if (!companies || companies.length === 0) {
      return NextResponse.json({ message: "No companies found in database" })
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

    // Update companies with new embeddings
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
      message: `Regenerated embeddings for ${updates.length} companies`,
    })
  } catch (error) {
    console.error("Error regenerating embeddings:", error)
    return NextResponse.json({ error: "Failed to regenerate embeddings" }, { status: 500 })
  }
}
