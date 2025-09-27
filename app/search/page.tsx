"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, X, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useDebounce } from "@/hooks/use-debounce"
import { useCompanies } from "@/lib/queries/companies"
import type { SearchFilters } from "@/lib/types"
import { Button } from '@/components/ui/button'

const getStageColor = (stage: string) => {
  switch (stage.toLowerCase()) {
    case "seed":
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
    case "series a":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
    case "series b":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
    case "series c":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
    case "series d":
    case "series e":
    case "series f":
    case "series g":
    case "series h":
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
    case "public":
    case "acquired":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
  }
}

const getSectorColor = (sector: string) => {
  const colors = [
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800",
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800",
    "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800",
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800",
    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800",
    "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800",
  ]

  const hash = sector.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const qParam = searchParams.get("q") || ""
  const tagsParam = searchParams.get("tags") || ""

  const [searchQuery, setSearchQuery] = useState(qParam)
  const [selectedTags, setSelectedTags] = useState<string[]>(
    tagsParam ? tagsParam.split(",").filter(Boolean) : [],
  )

  const inputRef = useRef<HTMLInputElement | null>(null)

  // Keep local state in sync with URL (back/forward navigation)
  useEffect(() => {
    setSearchQuery(qParam)
    setSelectedTags(tagsParam ? tagsParam.split(",").filter(Boolean) : [])
  }, [qParam, tagsParam])

  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Always focus the search input when the search page mounts
  useEffect(() => {
    // small timeout to ensure element is mounted and visible
    setTimeout(() => {
      try {
        const el = inputRef.current ?? document.querySelector('input[data-slot="input"]') as HTMLInputElement | null
        if (el) {
          el.focus()
          // place caret at the end instead of selecting text so typing appends/replaces naturally
          try {
            const pos = el.value ? el.value.length : 0
            el.setSelectionRange(pos, pos)
          } catch (e) {
            // older browsers might not support setSelectionRange; fallback to no selection
          }
        }
      } catch (e) {
        // ignore
      }
    }, 50)
  }, [])

  const searchFilters: SearchFilters = {
    query: debouncedSearchQuery.trim() || "",
    tags: selectedTags,
  }

  const {
    data: companies = [],
    isLoading: loading,
    error,
  } = useCompanies(searchFilters.query || searchFilters.tags.length > 0 ? searchFilters : undefined)

  const safeCompanies = companies.map((company) => ({
    ...company,
    tags: company.tags || [],
    founders: company.founders || [],
    backing_vcs: company.backing_vcs || [],
  }))

  // Sync debounced query and tag changes back to the URL
  useEffect(() => {
    const currentQ = searchParams.get("q") || ""
    const currentTags = searchParams.get("tags") || ""

    const newParams = new URLSearchParams()
    if (debouncedSearchQuery.trim()) newParams.set("q", debouncedSearchQuery.trim())
    if (selectedTags.length > 0) newParams.set("tags", selectedTags.join(","))

    const newSearch = newParams.toString()

    if (newSearch !== (searchParams.toString() || "")) {
      const path = newSearch ? `/search?${newSearch}` : '/search'
      // replace so we don't spam history entries while typing
      router.replace(path)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery, selectedTags])

  const handleTagClick = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const removeTagFilter = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter((tag) => tag !== tagToRemove))
  }

  const clearAllFilters = () => {
    setSelectedTags([])
    setSearchQuery("")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h1 className="text-4xl font-bold text-balance">Startup Registry</h1>
              <p className="text-lg text-muted-foreground text-pretty max-w-2xl">
                Discover and explore innovative startups across different industries, funding stages, and backing
                investors.
              </p>
            </div>

          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search companies, tags, sectors, VCs, stages, or founders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>

          {selectedTags.length > 0 && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Active Filters</span>
                </div>
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    onClick={() => removeTagFilter(tag)}
                  >
                    {tag}
                    <X className="ml-1 h-3 w-3" />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {(debouncedSearchQuery || selectedTags.length > 0) && !loading && (
            <p className="text-sm text-muted-foreground mt-3">
              Found {safeCompanies.length} companies
              {debouncedSearchQuery && ` matching "${debouncedSearchQuery}"`}
              {selectedTags.length > 0 && ` with tags: ${selectedTags.join(", ")}`}
            </p>
          )}
        </div>

        {/* No Query Placeholder */}
        {!loading && !error && !debouncedSearchQuery && selectedTags.length === 0 && (
          <div className="flex items-center justify-center py-24">
            <div className="text-center max-w-lg px-4">
              <div className="mx-auto mb-4 w-10 h-10 flex items-center justify-center rounded-lg border border-border bg-muted/5">
                <Search className="w-4 h-4 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-semibold">Begin your search</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Enter a company name or keyword to find startups, tags, sectors, stages, or investors for your next
                project.
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading companies...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-500">Error: {error.message}</p>
          </div>
        )}

        {/* Company Cards */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {safeCompanies.map((company) => (
              <Card key={company.id} className="hover:shadow-lg transition-shadow duration-200 cursor-pointer" onClick={() => {
                          const params = new URLSearchParams();
                          if (debouncedSearchQuery.trim()) params.set('q', debouncedSearchQuery.trim());
                          if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
                          const qs = params.toString();
                          router.push(`/companies/${company.id}${qs ? `?${qs}` : ''}`);
                        }}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-xl">{company.name}</CardTitle>
                      <div className="flex flex-wrap gap-2">
                        {company.stage && (
                          <Badge className={getStageColor(company.stage)} variant="secondary">
                            {company.stage}
                          </Badge>
                        )}
                        {company.sector && (
                          <Badge variant="outline" className={`text-xs font-medium ${getSectorColor(company.sector)}`}>
                            {company.sector}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {company.logo_url && (
                      <img
                        src={company.logo_url || "/placeholder.svg"}
                        alt={`${company.name} logo`}
                        className="w-10 h-10 rounded-md object-contain"
                      />
                    )}
                  </div>
                  <CardDescription className="text-sm leading-relaxed">{company.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {company.tags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-1">
                        {company.tags.map((tag) => {
                          const isSelected = selectedTags.includes(tag)
                          return (
                            <Badge
                              key={tag}
                              variant={isSelected ? "default" : "outline"}
                              className={`text-xs cursor-pointer transition-all duration-200 ${
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-primary hover:text-primary-foreground hover:border-primary"
                              }`}
                              onClick={(e) => { e.stopPropagation(); handleTagClick(tag) }}
                            >
                              {tag}
                              {isSelected && <span className="ml-1">✓</span>}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Founders */}
                  {company.founders.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Founders</h4>
                      <p className="text-sm">{company.founders.join(", ")}</p>
                    </div>
                  )}

                  {/* Backing VCs */}
                  {company.backing_vcs.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Backing VCs</h4>
                      <div className="flex flex-wrap gap-1">
                        {company.backing_vcs.slice(0, 3).map((vc) => (
                          <Badge key={vc} variant="secondary" className="text-xs">
                            {vc}
                          </Badge>
                        ))}
                        {company.backing_vcs.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{company.backing_vcs.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Website Link */}
                  {company.website && (
                    <div>
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Visit Website →
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && !error && safeCompanies.length === 0 && (debouncedSearchQuery || selectedTags.length > 0) && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No companies found
              {debouncedSearchQuery && ` matching "${debouncedSearchQuery}"`}
              {selectedTags.length > 0 && ` with the selected filters`}. Try adjusting your search.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
