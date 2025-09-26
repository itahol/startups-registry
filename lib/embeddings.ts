import { embed } from "ai"

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    console.log("[v0] Generating embedding for text:", text.substring(0, 100) + "...")

    // Use AI Gateway with OpenAI's embedding model
    const { embedding } = await embed({
      model: "openai/text-embedding-3-small",
      value: text,
    })

    console.log("[v0] Embedding generated successfully")
    return embedding
  } catch (error) {
    console.error("[v0] Error generating embedding:", error)
    throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Generate a comprehensive text representation of a company for embedding
export function generateCompanyText(company: {
  name: string
  description?: string
  categories: string[]
  backing_vcs: string[]
  stage: string
  founders: string[]
}): string {
  const parts = [
    company.name,
    company.description || "",
    `Categories: ${company.categories.join(", ")}`,
    `Backing VCs: ${company.backing_vcs.join(", ")}`,
    `Stage: ${company.stage}`,
    `Founders: ${company.founders.join(", ")}`,
  ]

  return parts.filter(Boolean).join(". ")
}
