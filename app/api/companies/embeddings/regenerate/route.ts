import { generateCompanyText, generateEmbedding } from "@/lib/embeddings";
import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

// Regenerate embeddings for ALL companies (overwrites existing ones)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get all companies (include person join to derive founders)
    const { data: companies, error: fetchError } = await supabase
      .from("companies")
      .select(`id,name,description,tags,backing_vcs,stage, person__company ( person ( first_name, last_name ), is_founder )`);

    if (fetchError) {
      return NextResponse.json({ error: `Failed to fetch companies: ${fetchError.message}` }, { status: 500 });
    }

    if (!companies || companies.length === 0) {
      return NextResponse.json({ message: "No companies found in database" });
    }

    const safeCompanies = companies.map((company: any) => {
      const foundersFromJoin = (company.person__company || [])
        .filter((pc: any) => pc.is_founder)
        .map((pc: any) => {
          const p = pc.person;
          return p ? `${p.first_name} ${p.last_name}`.trim() : null;
        })
        .filter(Boolean) as string[];

      return {
        ...company,
        tags: company.tags || [],
        founders: foundersFromJoin.length > 0 ? foundersFromJoin : [],
        backing_vcs: company.backing_vcs || [],
      };
    });

    // Generate embeddings for each company
    const updates = [];
    for (const company of safeCompanies) {
      const companyText = generateCompanyText(company);
      const embedding = await generateEmbedding(companyText);

      updates.push({
        id: company.id,
        embedding: JSON.stringify(embedding),
      });
    }

    // Update companies with new embeddings
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from("companies")
        .update({ embedding: update.embedding })
        .eq("id", update.id);

      if (updateError) {
        console.error(`Failed to update embedding for company ${update.id}:`, updateError);
      }
    }

    return NextResponse.json({
      message: `Regenerated embeddings for ${updates.length} companies`,
    });
  } catch (error) {
    console.error("Error regenerating embeddings:", error);
    return NextResponse.json({ error: "Failed to regenerate embeddings" }, { status: 500 });
  }
}
