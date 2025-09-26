import { createClient } from "@/lib/supabase/client";
import type { Company, SearchFilters } from "@/lib/types";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";

export function useCompanies(filters?: SearchFilters) {
  const searchQuery = filters?.query;
  const tagFilters = filters?.tags || [];

  return useQuery({
    queryKey: ["companies", searchQuery, tagFilters],
    queryFn: async (): Promise<Company[]> => {
      const supabase = createClient();

      // If no search query and no tag filters, return all companies
      if (!searchQuery?.trim() && tagFilters.length === 0) {
        const { data, error }: { data: Company[] | null; error: PostgrestError | null } = await supabase
          .from("companies")
          .select("*")
          .order("name");

        if (error) {
          throw new Error(`Failed to fetch companies: ${error.message}`);
        }

        return data || [];
      }

      // If only tag filters (no search query), use simple tag filtering
      if (!searchQuery?.trim() && tagFilters.length > 0) {
        return tagFilterSearch(supabase, tagFilters);
      }

      try {
        console.log("[v0] Client: calling server search API for query:", searchQuery);

        const params = new URLSearchParams();
        params.set("q", searchQuery || "");
        if (tagFilters.length > 0) params.set("tags", tagFilters.join(","));

        const res = await fetch(`/api/companies?${params.toString()}`);

        if (!res.ok) {
          console.error("[v0] search API returned error", await res.text());
          return fallbackKeywordSearch(supabase, searchQuery as string, tagFilters);
        }

        const companies = await res.json();

        // Ensure final filtering by tags client-side (extra safety)
        let results = (companies || []) as Company[];
        if (tagFilters.length > 0) {
          results = results.filter((company) => tagFilters.every((tag) => (company.tags || []).includes(tag)));
        }

        return results;
      } catch (error) {
        console.error("[v0] Error calling search API:", error);
        // Fallback to keyword search
        return fallbackKeywordSearch(supabase, searchQuery as string, tagFilters);
      }
    },
    // Only enable query when there's a search query or tag filters
    enabled: Boolean(searchQuery?.trim() || tagFilters.length > 0),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}

async function tagFilterSearch(supabase: SupabaseClient, tagFilters: string[]): Promise<Company[]> {
  console.log("[v0] Using tag filter search for:", tagFilters);

  let query = supabase.from("companies").select("*").order("name");

  // Apply tag filters - company must have ALL specified tags
  for (const tag of tagFilters) {
    query = query.contains("tags", [tag]);
  }

  const { data, error }: { data: Company[] | null; error: PostgrestError | null } = await query;

  if (error) {
    throw new Error(`Failed to fetch companies: ${error.message}`);
  }

  console.log("[v0] Tag filter search returned", data?.length || 0, "results");
  return data || [];
}

async function fallbackKeywordSearch(
  supabase: SupabaseClient,
  searchQuery: string,
  tagFilters: string[] = [],
): Promise<Company[]> {
  console.log("[v0] Using fallback keyword search for:", searchQuery, "with tag filters:", tagFilters);

  let query = supabase.from("companies").select("*").order("name");

  query = query.or(
    `name.ilike.%${searchQuery}%,` +
      `description.ilike.%${searchQuery}%,` +
      `tags.cs.{${searchQuery}},` +
      `sector.ilike.%${searchQuery}%,` +
      `backing_vcs.cs.{${searchQuery}},` +
      `stage.ilike.%${searchQuery}%,` +
      `founders.cs.{${searchQuery}}`,
  );

  for (const tag of tagFilters) {
    query = query.contains("tags", [tag]);
  }

  const { data, error }: { data: Company[] | null; error: PostgrestError | null } = await query;

  if (error) {
    throw new Error(`Failed to fetch companies: ${error.message}`);
  }

  // Sort results to prioritize name matches
  if (data) {
    data.sort((a: Company, b: Company) => {
      const aNameMatch = (a.name || "").toLowerCase().includes(searchQuery.toLowerCase());
      const bNameMatch = (b.name || "").toLowerCase().includes(searchQuery.toLowerCase());

      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;
      return 0;
    });
  }

  console.log("[v0] Fallback keyword search returned", data?.length || 0, "results");
  return data || [];
}
