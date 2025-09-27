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
        const { data, error }: { data: any[] | null; error: PostgrestError | null } = await supabase
          .from("companies")
          .select(`*, person__company ( person ( first_name, last_name ), is_founder )`)
          .order("name");

        if (error) {
          throw new Error(`Failed to fetch companies: ${error.message}`);
        }

        // Map founders from person__company join into founders string[]
        if (data) {
          const mapped = data.map((c: any) => {
            const foundersFromJoin = (c.person__company || [])
              .filter((pc: any) => pc.is_founder)
              .map((pc: any) => {
                const p = pc.person;
                return p ? `${p.first_name} ${p.last_name}`.trim() : null;
              })
              .filter(Boolean) as string[];

            return {
              id: c.id,
              name: c.name,
              description: c.description,
              tags: c.tags || [],
              sector: c.sector,
              backing_vcs: c.backing_vcs || [],
              stage: c.stage,
              founders: foundersFromJoin.length > 0 ? foundersFromJoin : c.founders || [],
              website: c.website,
              logo_url: c.logo_url,
              created_at: c.created_at,
              updated_at: c.updated_at,
            } as Company;
          });

          return mapped || [];
        }

        return [];
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

  let query = supabase.from("companies").select(`*, person__company ( person ( first_name, last_name ), is_founder )`).order("name");

  // Apply tag filters - company must have ALL specified tags
  for (const tag of tagFilters) {
    query = query.contains("tags", [tag]);
  }

  const { data, error }: { data: any[] | null; error: PostgrestError | null } = await query;

  if (error) {
    throw new Error(`Failed to fetch companies: ${error.message}`);
  }

  // Map founders from the join if present
  if (data) {
    const mapped = data.map((c: any) => {
      const foundersFromJoin = (c.person__company || [])
        .filter((pc: any) => pc.is_founder)
        .map((pc: any) => {
          const p = pc.person;
          return p ? `${p.first_name} ${p.last_name}`.trim() : null;
        })
        .filter(Boolean) as string[];

      return {
        id: c.id,
        name: c.name,
        description: c.description,
        tags: c.tags || [],
        sector: c.sector,
        backing_vcs: c.backing_vcs || [],
        stage: c.stage,
        founders: foundersFromJoin.length > 0 ? foundersFromJoin : c.founders || [],
        website: c.website,
        logo_url: c.logo_url,
        created_at: c.created_at,
        updated_at: c.updated_at,
      } as Company;
    });

    console.log("[v0] Tag filter search returned", mapped?.length || 0, "results");
    return mapped || [];
  }

  return [];
}

async function fallbackKeywordSearch(
  supabase: SupabaseClient,
  searchQuery: string,
  tagFilters: string[] = [],
): Promise<Company[]> {
  console.log("[v0] Using fallback keyword search for:", searchQuery, "with tag filters:", tagFilters);

  let query = supabase.from("companies").select(`*, person__company ( person ( first_name, last_name ), is_founder )`).order("name");

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

  const { data, error }: { data: any[] | null; error: PostgrestError | null } = await query;

  if (error) {
    throw new Error(`Failed to fetch companies: ${error.message}`);
  }

  // Map founders from join and then sort to prioritize name matches
  if (data) {
    const mapped = data.map((c: any) => {
      const foundersFromJoin = (c.person__company || [])
        .filter((pc: any) => pc.is_founder)
        .map((pc: any) => {
          const p = pc.person;
          return p ? `${p.first_name} ${p.last_name}`.trim() : null;
        })
        .filter(Boolean) as string[];

      return {
        id: c.id,
        name: c.name,
        description: c.description,
        tags: c.tags || [],
        sector: c.sector,
        backing_vcs: c.backing_vcs || [],
        stage: c.stage,
        founders: foundersFromJoin.length > 0 ? foundersFromJoin : c.founders || [],
        website: c.website,
        logo_url: c.logo_url,
        created_at: c.created_at,
        updated_at: c.updated_at,
      } as Company;
    });

    mapped.sort((a: Company, b: Company) => {
      const aNameMatch = (a.name || "").toLowerCase().includes(searchQuery.toLowerCase());
      const bNameMatch = (b.name || "").toLowerCase().includes(searchQuery.toLowerCase());

      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;
      return 0;
    });

    console.log("[v0] Fallback keyword search returned", mapped?.length || 0, "results");
    return mapped || [];
  }

  return [];
}
