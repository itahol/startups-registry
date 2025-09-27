import { createClient } from "@/lib/supabase/client";
import type { Company, SearchFilters } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";

// Minimal DB row types for safer mapping
type PersonRow = {
  first_name?: string | null;
  last_name?: string | null;
};

type PersonCompanyRow = {
  person?: PersonRow | null;
  is_founder?: boolean | null;
};

type CompanyRow = {
  id: string;
  name: string;
  description?: string | null;
  tags?: string[] | null;
  sector?: string | null;
  backing_vcs?: string[] | null;
  stage?: string | null;
  founders?: string[] | null;
  website?: string | null;
  logo_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  person__company?: PersonCompanyRow[] | null;
};

export function useCompanies(filters?: SearchFilters) {
  const searchQuery = filters?.query;
  const tagFilters = filters?.tags || [];

  return useQuery({
    queryKey: ["companies", searchQuery, tagFilters],
    queryFn: async (): Promise<Company[]> => {
      const supabase = createClient();

      // If no search query and no tag filters, return empty (server returns nothing)
      if (!searchQuery?.trim() && tagFilters.length === 0) {
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
          return fallbackKeywordSearch(supabase, searchQuery ?? "", tagFilters);
        }

        const companiesJson = await res.json();

        // Ensure final filtering by tags client-side (extra safety)
        const results: Company[] = Array.isArray(companiesJson) ? companiesJson.filter((c) => !!c).map((c) => c) : [];

        if (tagFilters.length > 0) {
          return results.filter((company) => tagFilters.every((tag) => (company.tags || []).includes(tag)));
        }

        return results;
      } catch (error) {
        console.error("[v0] Error calling search API:", error);
        // Fallback to keyword search
        return fallbackKeywordSearch(supabase, searchQuery ?? "", tagFilters);
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

  const query = supabase
    .from("companies")
    .select(`*, person__company ( person ( first_name, last_name ), is_founder )`)
    .order("name");

  // Apply tag filters - company must have ALL specified tags
  let filteredQuery = query;
  for (const tag of tagFilters) {
    filteredQuery = filteredQuery.contains("tags", [tag]);
  }

  const { data, error } = await filteredQuery;

  if (error) {
    throw new Error(`Failed to fetch companies: ${error.message}`);
  }

  if (!data || data.length === 0) return [];

  const mapped: Company[] = data.map((c: CompanyRow) => {
    const joinRows = Array.isArray(c.person__company) ? c.person__company : [];
    const foundersFromJoin: string[] = joinRows
      .filter((pc): pc is PersonCompanyRow & { person: PersonRow } => !!pc && !!pc.is_founder && !!pc.person)
      .map((pc) => `${pc.person!.first_name ?? ""} ${pc.person!.last_name ?? ""}`.trim())
      .filter((s) => s.length > 0);

    return {
      id: c.id,
      name: c.name,
      description: c.description ?? null,
      tags: c.tags ?? null,
      sector: c.sector ?? null,
      backing_vcs: c.backing_vcs ?? null,
      stage: c.stage ?? null,
      founders: foundersFromJoin.length > 0 ? foundersFromJoin : (c.founders ?? null),
      website: c.website ?? null,
      logo_url: c.logo_url ?? null,
      created_at: c.created_at ?? null,
      updated_at: c.updated_at ?? null,
    };
  });

  console.log("[v0] Tag filter search returned", mapped.length, "results");
  return mapped;
}

async function fallbackKeywordSearch(
  supabase: SupabaseClient,
  searchQuery: string,
  tagFilters: string[] = [],
): Promise<Company[]> {
  console.log("[v0] Using fallback keyword search for:", searchQuery, "with tag filters:", tagFilters);

  let query = supabase
    .from("companies")
    .select(`*, person__company ( person ( first_name, last_name ), is_founder )`)
    .order("name");

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

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch companies: ${error.message}`);
  }

  if (!data || data.length === 0) return [];

  const mapped: Company[] = data.map((c: CompanyRow) => {
    const joinRows = Array.isArray(c.person__company) ? c.person__company : [];
    const foundersFromJoin: string[] = joinRows
      .filter((pc): pc is PersonCompanyRow & { person: PersonRow } => !!pc && !!pc.is_founder && !!pc.person)
      .map((pc) => `${pc.person!.first_name ?? ""} ${pc.person!.last_name ?? ""}`.trim())
      .filter((s) => s.length > 0);

    return {
      id: c.id,
      name: c.name,
      description: c.description ?? null,
      tags: c.tags ?? null,
      sector: c.sector ?? null,
      backing_vcs: c.backing_vcs ?? null,
      stage: c.stage ?? null,
      founders: foundersFromJoin.length > 0 ? foundersFromJoin : (c.founders ?? null),
      website: c.website ?? null,
      logo_url: c.logo_url ?? null,
      created_at: c.created_at ?? null,
      updated_at: c.updated_at ?? null,
    };
  });

  mapped.sort((a, b) => {
    const aNameMatch = (a.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const bNameMatch = (b.name || "").toLowerCase().includes(searchQuery.toLowerCase());

    if (aNameMatch && !bNameMatch) return -1;
    if (!aNameMatch && bNameMatch) return 1;
    return 0;
  });

  console.log("[v0] Fallback keyword search returned", mapped.length, "results");
  return mapped;
}
