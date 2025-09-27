import { createClient } from "@/lib/supabase/server";
import type { Company } from "@/lib/types";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";

async function getCompany(id: string): Promise<Company | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select(
      `
      id,
      name,
      description,
      tags,
      sector,
      backing_vcs,
      stage,
      founders,
      website,
      logo_url,
      person__company (
        is_founder,
        person (
          first_name,
          last_name
        )
      )
    `,
    )
    .eq("id", id)
    .eq("person__company.is_founder", true)
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    tags: data.tags,
    sector: data.sector,
    backing_vcs: data.backing_vcs,
    stage: data.stage,
    founders: data.person__company.map((pc) => `${pc.person.first_name} ${pc.person.last_name}`) || [],
    website: data.website,
    logo_url: data.logo_url,
  };
}

const getStageColor = (stage?: string | null) => {
  if (!stage) return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
  switch (stage.toLowerCase()) {
    case "seed":
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
    case "series a":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
    case "series b":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
    case "series c":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
  }
};

export default async function CompanyPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const { id } = params;
  const company = await getCompany(id);

  if (!company) return notFound();

  const tags = company.tags || [];
  const founders = company.founders || [];
  const backing = company.backing_vcs || [];

  // Recreate the original search query string to pass back when going back
  const q =
    typeof searchParams.q === "string" ? searchParams.q : Array.isArray(searchParams.q) ? searchParams.q.join("") : "";
  const tagsParam =
    typeof searchParams.tags === "string"
      ? searchParams.tags
      : Array.isArray(searchParams.tags)
        ? searchParams.tags.join(",")
        : "";

  const backHref =
    q || tagsParam
      ? `/search?${new URLSearchParams(Object.fromEntries(Object.entries({ q, tags: tagsParam }).filter(([_, v]) => v))).toString()}`
      : "/search";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{company.name}</h1>
        <div className="flex items-center gap-2">
          <Button asChild>
            <a href={backHref}>Back to results</a>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{company.name}</CardTitle>
              <div className="mt-2 flex flex-wrap gap-2">
                {company.stage && (
                  <Badge className={getStageColor(company.stage)} variant="secondary">
                    {company.stage}
                  </Badge>
                )}
                {company.sector && (
                  <Badge variant="outline" className="text-xs font-medium">
                    {company.sector}
                  </Badge>
                )}
              </div>
            </div>
            {company.logo_url && (
              <img
                src={company.logo_url}
                alt={`${company.name} logo`}
                className="w-16 h-16 rounded-md object-contain"
              />
            )}
          </div>
          <CardDescription className="mt-4 text-sm leading-relaxed">{company.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <Badge key={t} variant="outline" className="text-xs">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {founders.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Founders</h4>
              <p className="text-sm">{founders.join(", ")}</p>
            </div>
          )}

          {backing.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Backing VCs</h4>
              <div className="flex flex-wrap gap-1">
                {backing.map((b) => (
                  <Badge key={b} variant="secondary" className="text-xs">
                    {b}
                  </Badge>
                ))}
              </div>
            </div>
          )}

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
    </div>
  );
}
