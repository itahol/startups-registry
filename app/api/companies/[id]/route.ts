import { generateCompanyText, generateEmbedding } from '@/lib/embeddings'
import { createClient } from '@/lib/supabase/server'
import { type NextRequest, NextResponse } from 'next/server'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()

    if (!id) return NextResponse.json({ error: 'Missing company id' }, { status: 400 })

    const supabase = await createClient()

    const updatePayload: any = {}
    // Allow updating a subset of fields
    const updatable = ['name', 'description', 'tags', 'backing_vcs', 'stage', 'founders', 'website', 'logo_url', 'sector']
    for (const key of updatable) {
      if (key in body) updatePayload[key] = body[key]
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 })
    }

    const { data, error } = await supabase.from('companies').update(updatePayload).eq('id', id).select().single()

    if (error) {
      console.error('Failed to update company:', error)
      return NextResponse.json({ error: error.message || 'Failed to update company' }, { status: 500 })
    }

    // If relevant fields changed, regenerate embedding asynchronously
    try {
      const safeCompany = {
        name: data.name,
        description: data.description || '',
        tags: data.tags || [],
        backing_vcs: data.backing_vcs || [],
        stage: data.stage || null,
        founders: data.founders || [],
      }

      const companyText = generateCompanyText(safeCompany)
      const embedding = await generateEmbedding(companyText)

      const { error: updateError } = await supabase.from('companies').update({ embedding: JSON.stringify(embedding) }).eq('id', id)

      if (updateError) console.error('Failed to update embedding after patch:', updateError)
    } catch (err) {
      console.error('Failed to generate embedding after patch:', err)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    if (!id) return NextResponse.json({ error: 'Missing company id' }, { status: 400 })

    const supabase = await createClient()
    const { error } = await supabase.from('companies').delete().eq('id', id)

    if (error) {
      console.error('Failed to delete company:', error)
      return NextResponse.json({ error: error.message || 'Failed to delete company' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Deleted' })
  } catch (error) {
    console.error('DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
