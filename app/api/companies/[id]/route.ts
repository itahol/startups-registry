import { generateCompanyText, generateEmbedding } from "@/lib/embeddings";
import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    if (!id) return NextResponse.json({ error: "Missing company id" }, { status: 400 });

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("companies")
      .select(
        `
        *,
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
      .single();

    if (error) {
      console.error("Failed to fetch company:", error);
      return NextResponse.json({ error: error.message || "Company not found" }, { status: 404 });
    }

    // Map founders from the join into founders array
    const foundersFromJoin = (data.person__company || [])
      .filter((pc) => pc.is_founder === true)
      .map((pc) => {
        const p = pc.person;
        return p ? `${p.first_name} ${p.last_name}`.trim() : null;
      })
      .filter(Boolean) as string[];

    const company = {
      id: data.id,
      name: data.name,
      description: data.description,
      tags: data.tags || [],
      sector: data.sector,
      backing_vcs: data.backing_vcs || [],
      stage: data.stage,
      founders: foundersFromJoin.length > 0 ? foundersFromJoin : data.founders || [],
      website: data.website,
      logo_url: data.logo_url,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    return NextResponse.json(company);
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await request.json();

    if (!id) return NextResponse.json({ error: "Missing company id" }, { status: 400 });

    const supabase = await createClient();

    const updatePayload: any = {};
    // Allow updating a subset of fields (note: we do NOT write `founders` into companies anymore)
    const updatable = ["name", "description", "tags", "backing_vcs", "stage", "website", "logo_url", "sector"];
    for (const key of updatable) {
      if (key in body) updatePayload[key] = body[key];
    }

    if (Object.keys(updatePayload).length === 0 && !("founders" in body)) {
      return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
    }

    const { data, error } = await supabase.from("companies").update(updatePayload).eq("id", id).select().single();

    if (error) {
      console.error("Failed to update company:", error);
      return NextResponse.json({ error: error.message || "Failed to update company" }, { status: 500 });
    }

    // If founders provided, sync person + person__company
    if (Array.isArray(body.founders)) {
      const founders: string[] = body.founders.map((f: any) => (typeof f === "string" ? f.trim() : "")).filter(Boolean);

      // Delete existing founder links for this company
      const { error: delErr } = await supabase
        .from("person__company")
        .delete()
        .eq("company_id", id)
        .eq("is_founder", true);
      if (delErr) console.error("Failed to delete existing founder links:", delErr);

      for (const fullName of founders) {
        const parts = fullName.split(/\s+/);
        const first_name = parts.shift() || "";
        const last_name = parts.join(" ") || "";

        // find existing person
        let personId = null;
        const { data: personData, error: personErr } = await supabase
          .from("person")
          .select("id")
          .eq("first_name", first_name)
          .eq("last_name", last_name)
          .maybeSingle();
        if (personErr) {
          console.error("Failed to query person:", personErr);
        } else if (personData && (personData as any).id) {
          personId = (personData as any).id;
        } else {
          // create person
          const { data: newPerson, error: insertPersonErr } = await supabase
            .from("person")
            .insert({ first_name, last_name })
            .select()
            .single();
          if (insertPersonErr) {
            console.error("Failed to create person:", insertPersonErr);
            continue;
          }
          personId = (newPerson as any).id;
        }

        if (personId) {
          const { error: linkErr } = await supabase.from("person__company").insert({
            company_id: id,
            person_id: personId,
            is_founder: true,
            currently_works_here: true,
            role: "",
          });
          if (linkErr) console.error("Failed to create person__company link:", linkErr);
        }
      }
    }

    // Regenerate embedding asynchronously
    try {
      const foundersForEmbedding = Array.isArray(body.founders) ? body.founders : data.founders || [];
      const safeCompany = {
        name: data.name,
        description: data.description || "",
        tags: data.tags || [],
        backing_vcs: data.backing_vcs || [],
        stage: data.stage || null,
        founders: foundersForEmbedding,
      };

      const companyText = generateCompanyText(safeCompany);
      const embedding = await generateEmbedding(companyText);

      const { error: updateError } = await supabase
        .from("companies")
        .update({ embedding: JSON.stringify(embedding) })
        .eq("id", id);

      if (updateError) console.error("Failed to update embedding after patch:", updateError);
    } catch (err) {
      console.error("Failed to generate embedding after patch:", err);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    if (!id) return NextResponse.json({ error: "Missing company id" }, { status: 400 });

    const supabase = await createClient();
    const { error } = await supabase.from("companies").delete().eq("id", id);

    if (error) {
      console.error("Failed to delete company:", error);
      return NextResponse.json({ error: error.message || "Failed to delete company" }, { status: 500 });
    }

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
