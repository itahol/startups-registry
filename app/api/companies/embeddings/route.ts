import { generateCompanyText, generateEmbedding } from "@/lib/embeddings";
import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

// Generate embeddings for all companies that don't have them
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get companies without embeddings
    const { data: companies, error: fetchError } = await supabase
      .from("companies")
      .select("id,name,description,tags,founders,backing_vcs,stage")
      .is("embedding", null);

    if (fetchError) {
      return NextResponse.json({ error: `Failed to fetch companies: ${fetchError.message}` }, { status: 500 });
    }

    if (!companies || companies.length === 0) {
      return NextResponse.json({ message: "All companies already have embeddings" });
    }
    const safeCompanies = companies.map((company) => ({
      ...company,
      tags: company.tags || [],
      founders: company.founders || [],
      backing_vcs: company.backing_vcs || [],
    }));

    // Generate embeddings for each company
    const updates = [];
    for (const company of safeCompanies) {
      console.log(`[v0] Trying to embed company - name: ${company.name}, id: ${company.id} `);
      const companyText = generateCompanyText(company);
      const embedding = await generateEmbedding(companyText);

      updates.push({
        id: company.id,
        embedding: JSON.stringify(embedding),
      });
    }

    // Update companies with embeddings
    for (const update of updates) {
      console.log(`[v0] Update: ${update.id}, id: ${update.embedding} `);
      const { error: updateError } = await supabase
        .from("companies")
        .update({ embedding: update.embedding })
        .eq("id", update.id);

      if (updateError) {
        console.error(`Failed to update embedding for company ${update.id}:`, updateError);
      }
    }

    return NextResponse.json({
      message: `Generated embeddings for ${updates.length} companies`,
    });
  } catch (error) {
    console.error("Error generating embeddings:", error);
    return NextResponse.json({ error: "Failed to generate embeddings" }, { status: 500 });
  }
}
