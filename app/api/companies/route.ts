import { generateEmbedding } from "@/lib/embeddings";
import { createClient } from "@/lib/supabase/server";
import type { Company } from "@/lib/types";
import type { PostgrestError } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") || "").trim();
    const tagsParam = searchParams.get("tags") || "";
    const tagFilters = tagsParam
      ? tagsParam
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    // If there's no search query and no tags, return all companies
    if (!query && tagFilters.length === 0) {
      const { data: companies, error } = (await supabase.from("companies").select("*").order("name")) as {
        data: Company[] | null;
        error: PostgrestError | null;
      };
      if (error) {
        console.error("Database error:", error);
        return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 });
      }
      return NextResponse.json(companies || []);
    }

    // If there's a search query, attempt hybrid search (server-side embedding + Supabase RPC)
    if (query) {
      try {
        console.log("[v0] Server: generating embedding for query:", query);
        const embedding = await generateEmbedding(query);

        // Verify embedding isn't a zero vector
        const isValidEmbedding = Array.isArray(embedding) && embedding.some((v) => v !== 0);

        if (isValidEmbedding) {
          console.log("[v0] Server: calling hybrid_search_companies RPC");
          const rpcArgs = {
            query_embedding: JSON.stringify(embedding),
            query_text: query,
            match_threshold: 0.5,
            match_count: 50,
          } as const;

          // Expecting the RPC to return an array of CompanySearchResult-like objects
          const rpcResponse = await supabase.rpc("hybrid_search_companies", rpcArgs);

          const { data, error } = rpcResponse;

          if (error) {
            console.error("[v0] Hybrid search RPC error:", error);
            // fallback to keyword search below
          } else {
            let results = (data || []).map(({ similarity, rank_score, ...company }) => company);
            if (tagFilters.length > 0) {
              results = results.filter((company) => (company.tags || []).every((t: string) => tagFilters.includes(t)));
            }
            return NextResponse.json(results || []);
          }
        } else {
          console.log("[v0] Server: embedding invalid, falling back to keyword search");
        }
      } catch (err) {
        console.error("[v0] Server: embedding/hybrid search error:", err);
        // Fall through to keyword search fallback
      }
    }

    // Keyword fallback search (applies for tag-only searches or when hybrid fails)
    let supabaseQuery = supabase.from("companies").select("*").order("name");

    if (query) {
      supabaseQuery = supabaseQuery.or(
        `name.ilike.%${query}%,` +
          `description.ilike.%${query}%,` +
          `tags.cs.{${query}},` +
          `sector.ilike.%${query}%,` +
          `backing_vcs.cs.{${query}},` +
          `stage.ilike.%${query}%,` +
          `founders.cs.{${query}}`,
      );
    }

    for (const tag of tagFilters) {
      supabaseQuery = supabaseQuery.contains("tags", [tag]);
    }

    const { data, error } = (await supabaseQuery) as { data: Company[] | null; error: PostgrestError | null };

    if (error) {
      console.error("Database error (keyword fallback):", error);
      return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 });
    }

    const companies = data || [];

    // If there's a search query, sort results to prioritize name matches
    if (query && companies.length > 0) {
      companies.sort((a: Company, b: Company) => {
        const aNameMatch = (a.name || "").toLowerCase().includes(query.toLowerCase());
        const bNameMatch = (b.name || "").toLowerCase().includes(query.toLowerCase());

        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;
        return 0;
      });
    }

    return NextResponse.json(companies);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
