"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Database, RefreshCw } from "lucide-react"

import { useForm } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { TagInput } from "@/components/ui/tag-input"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useEffect } from "react"

function CreateCompanyForm({ onCreated }: { onCreated?: () => void } ) {
  const { register, handleSubmit, reset, setValue } = useForm()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [founders, setFounders] = useState<string[]>([])
  const [backing, setBacking] = useState<string[]>([])

  useEffect(() => {
    setValue('tags', tags.join(','))
  }, [tags, setValue])

  useEffect(() => {
    setValue('founders', founders.join(','))
  }, [founders, setValue])

  useEffect(() => {
    setValue('backing_vcs', backing.join(','))
  }, [backing, setValue])

  const onSubmit = async (values: any) => {
    setLoading(true)
    setStatus(null)

    try {
      const payload = {
        name: values.name,
        description: values.description || null,
        tags,
        founders,
        backing_vcs: backing,
        stage: values.stage || null,
        sector: values.sector || null,
        website: values.website || null,
        logo_url: values.logo_url || null,
      }

      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok) {
        setStatus({ type: "success", message: `Company '${data.name}' created` })
        reset()
        setTags([])
        setFounders([])
        setBacking([])
        if (onCreated) onCreated()
      } else {
        setStatus({ type: "error", message: data.error || "Failed to create company" })
      }
    } catch (err) {
      setStatus({ type: "error", message: err instanceof Error ? err.message : String(err) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label className="mb-1">Name</Label>
          <Input {...register("name", { required: true })} placeholder="Company name" />
        </div>

        <div>
          <Label className="mb-1">Stage</Label>
          <Input {...register("stage")} placeholder="e.g. Seed, Series A" />
        </div>
      </div>

      <div>
        <Label className="mb-1">Description</Label>
        <Textarea {...register("description")} placeholder="Short description" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label className="mb-1">Tags</Label>
          <TagInput value={tags} onChange={setTags} placeholder="Add tag (supports spaces)" />
        </div>

        <div>
          <Label className="mb-1">Sector</Label>
          <Input {...register("sector")} placeholder="e.g. Fintech" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label className="mb-1">Founders</Label>
          <TagInput value={founders} onChange={setFounders} placeholder="Founder name" />
        </div>

        <div>
          <Label className="mb-1">Backing VCs</Label>
          <TagInput value={backing} onChange={setBacking} placeholder="VC name" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label className="mb-1">Website</Label>
          <Input {...register("website")} placeholder="https://example.com" />
        </div>

        <div>
          <Label className="mb-1">Logo URL</Label>
          <Input {...register("logo_url")} placeholder="https://.../logo.png" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={loading} className={cn("flex items-center", loading && "opacity-70")}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Create Company
        </Button>

        {status && (
          <div
            className={`p-2 rounded-md text-sm ${status.type === "error" ? "text-red-700 bg-red-50" : "text-green-700 bg-green-50"}`}
          >
            {status.message}
          </div>
        )}
      </div>
    </form>
  )
}

function CompaniesManager() {
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [deleting, setDeleting] = useState<any | null>(null)

  const fetchCompanies = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/companies')
      const data = await res.json()
      if (res.ok) setCompanies(data)
    } catch (err) {
      console.error('Failed to fetch companies', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCompanies() }, [])

  const onSave = async (id: string, payload: any) => {
    try {
      const res = await fetch(`/api/companies/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (res.ok) {
        setEditing(null)
        fetchCompanies()
      } else {
        alert(data.error || 'Failed to save')
      }
    } catch (err) {
      alert(String(err))
    }
  }

  const onDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/companies/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        setDeleting(null)
        fetchCompanies()
      } else {
        alert(data.error || 'Failed to delete')
      }
    } catch (err) {
      alert(String(err))
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Companies</h3>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-2">
          {companies.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <div className="font-semibold">{c.name}</div>
                <div className="text-sm text-muted-foreground">{c.sector || c.stage}</div>
                <div className="text-sm text-muted-foreground">{c.tags?.join(', ')}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => setEditing(c)} variant="outline">Edit</Button>
                <Button onClick={() => setDeleting(c)} variant="destructive">Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Dialog open onOpenChange={(open) => !open && setEditing(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Company</DialogTitle>
              <DialogDescription>Edit company details</DialogDescription>
            </DialogHeader>
            <EditCompanyForm company={editing} onCancel={() => setEditing(null)} onSave={onSave} />
          </DialogContent>
        </Dialog>
      )}

      {deleting && (
        <Dialog open onOpenChange={(open) => !open && setDeleting(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogDescription>Are you sure you want to delete {deleting.name}?</DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => onDelete(deleting.id)}>Delete</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function EditCompanyForm({ company, onCancel, onSave }: { company: any, onCancel: () => void, onSave: (id: string, payload: any) => void }) {
  const { register, handleSubmit, setValue } = useForm()
  const [tags, setTags] = useState<string[]>(company.tags || [])
  const [founders, setFounders] = useState<string[]>(company.founders || [])
  const [backing, setBacking] = useState<string[]>(company.backing_vcs || [])

  useEffect(() => {
    setValue('name', company.name)
    setValue('description', company.description || '')
    setValue('stage', company.stage || '')
    setValue('sector', company.sector || '')
    setValue('website', company.website || '')
    setValue('logo_url', company.logo_url || '')
  }, [company, setValue])

  const submit = (vals: any) => {
    const payload = {
      ...vals,
      tags,
      founders,
      backing_vcs: backing,
    }
    onSave(company.id, payload)
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div>
        <Label className="mb-1">Name</Label>
        <Input {...register('name', { required: true })} />
      </div>

      <div>
        <Label className="mb-1">Description</Label>
        <Textarea {...register('description')} />
      </div>

      <div>
        <Label className="mb-1">Tags</Label>
        <TagInput value={tags} onChange={setTags} />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} type="button">Cancel</Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  )
}

export default function AdminPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [message, setMessage] = useState("")

  const generateMissingEmbeddings = async () => {
    setIsGenerating(true)
    setMessage("")

    try {
      const response = await fetch("/api/companies/embeddings", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message)
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const regenerateAllEmbeddings = async () => {
    setIsRegenerating(true)
    setMessage("")

    try {
      const response = await fetch("/api/companies/embeddings/regenerate", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message)
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsRegenerating(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage the startup registry database and operations</p>
          </div>

        </div>

        <Tabs defaultValue="embeddings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="embeddings">Embeddings</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
          </TabsList>

          <TabsContent value="embeddings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Vector Embeddings Management
                </CardTitle>
                <CardDescription>
                  Manage embeddings for semantic search functionality using Vercel AI Gateway
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Generate Missing Embeddings</h3>
                    <p className="text-sm text-muted-foreground">
                      Generate embeddings only for companies that don't have them yet. This is useful for new companies
                      added to the database.
                    </p>
                    <Button
                      onClick={generateMissingEmbeddings}
                      disabled={isGenerating || isRegenerating}
                      className="w-full"
                      variant="default"
                    >
                      {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Database className="mr-2 h-4 w-4" />
                      Generate Missing
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Regenerate All Embeddings</h3>
                    <p className="text-sm text-muted-foreground">
                      Regenerate embeddings for all companies in the database. Use this when updating the embedding
                      model or fixing data issues.
                    </p>
                    <Button
                      onClick={regenerateAllEmbeddings}
                      disabled={isGenerating || isRegenerating}
                      className="w-full bg-transparent"
                      variant="outline"
                    >
                      {isRegenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate All
                    </Button>
                  </div>
                </div>

                {message && (
                  <div
                    className={`p-4 rounded-lg border ${
                      message.includes("Error")
                        ? "bg-red-50 border-red-200 text-red-800"
                        : "bg-green-50 border-green-200 text-green-800"
                    }`}
                  >
                    <p className="text-sm font-medium">{message}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="companies">
            <Card>
              <CardHeader>
                <CardTitle>Company Management</CardTitle>
                <CardDescription>Manage companies in the registry</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <CreateCompanyForm onCreated={() => window.location.reload()} />
                  <CompaniesManager />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
