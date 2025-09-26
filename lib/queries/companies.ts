import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import type { Company, CompanySearchResult, SearchFilters } from "@/lib/types"

import { generateEmbedding } from "@/lib/embeddings"

export function useCompanies(filters?: SearchFilters) {
  const searchQuery = filters?.query
  const tagFilters = filters?.tags || []

  return useQuery({
    queryKey: ["companies", searchQuery, tagFilters],
    queryFn: async (): Promise<Company[]> => {
      const supabase = createClient()

      // If no search query and no tag filters, return all companies
      if (!searchQuery?.trim() && tagFilters.length === 0) {
        const { data, error } = await supabase.from("companies").select("*").order("name")

        if (error) {
          throw new Error(`Failed to fetch companies: ${error.message}`)
        }

        return data || []
      }

      // If only tag filters (no search query), use simple tag filtering
      if (!searchQuery?.trim() && tagFilters.length > 0) {
        return tagFilterSearch(supabase, tagFilters)
      }

      try {
        console.log("[v0] Attempting to generate embedding for search query:", searchQuery)
        const queryEmbedding = await generateEmbedding(searchQuery)

        // Check if embedding generation actually succeeded (not just a zero vector fallback)
        const isValidEmbedding = queryEmbedding.some((val) => val !== 0)

        if (!isValidEmbedding) {
          console.log("[v0] Embedding generation failed, using fallback keyword search")
          return fallbackKeywordSearch(supabase, searchQuery, tagFilters)
        }

        console.log("[v0] Embedding generated successfully, attempting hybrid search")
        const { data, error } = (await supabase.rpc("hybrid_search_companies", {
          query_text: searchQuery,
          query_embedding: `[${queryEmbedding.join(",")}]`,
          match_threshold: 0.78,
          match_count: 50,
        })) as { data: CompanySearchResult[] | null; error: any }

        if (error) {
          console.error("[v0] Hybrid search error:", error)
          // Fallback to keyword search if hybrid search fails
          return fallbackKeywordSearch(supabase, searchQuery, tagFilters)
        }

        console.log("[v0] Hybrid search successful, returning results")
        let results = (data || []).map(({ similarity, rank_score, ...company }) => company)

        if (tagFilters.length > 0) {
          results = results.filter((company) => tagFilters.every((tag) => company.tags.includes(tag)))
        }

        return results
      } catch (error) {
        console.error("[v0] Error in hybrid search:", error)
        // Fallback to keyword search
        return fallbackKeywordSearch(supabase, searchQuery, tagFilters)
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  })
}

async function tagFilterSearch(supabase: any, tagFilters: string[]): Promise<Company[]> {
  console.log("[v0] Using tag filter search for:", tagFilters)

  let query = supabase.from("companies").select("*").order("name")

  // Apply tag filters - company must have ALL specified tags
  for (const tag of tagFilters) {
    query = query.contains("tags", [tag])
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch companies: ${error.message}`)
  }

  console.log("[v0] Tag filter search returned", data?.length || 0, "results")
  return data || []
}

async function fallbackKeywordSearch(
  supabase: any,
  searchQuery: string,
  tagFilters: string[] = [],
): Promise<Company[]> {
  console.log("[v0] Using fallback keyword search for:", searchQuery, "with tag filters:", tagFilters)

  let query = supabase.from("companies").select("*").order("name")

  query = query.or(
    `name.ilike.%${searchQuery}%,` +
      `description.ilike.%${searchQuery}%,` +
      `tags.cs.{${searchQuery}},` +
      `sector.ilike.%${searchQuery}%,` +
      `backing_vcs.cs.{${searchQuery}},` +
      `stage.ilike.%${searchQuery}%,` +
      `founders.cs.{${searchQuery}}`,
  )

  for (const tag of tagFilters) {
    query = query.contains("tags", [tag])
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch companies: ${error.message}`)
  }

  // Sort results to prioritize name matches
  if (data) {
    data.sort((a, b) => {
      const aNameMatch = a.name.toLowerCase().includes(searchQuery.toLowerCase())
      const bNameMatch = b.name.toLowerCase().includes(searchQuery.toLowerCase())

      if (aNameMatch && !bNameMatch) return -1
      if (!aNameMatch && bNameMatch) return 1
      return 0
    })
  }

  console.log("[v0] Fallback keyword search returned", data?.length || 0, "results")
  return data || []
}
