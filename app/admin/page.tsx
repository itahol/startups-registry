"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Database, RefreshCw } from "lucide-react"

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage the startup registry database and operations</p>
        </div>

        <Tabs defaultValue="embeddings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="embeddings">Embeddings</TabsTrigger>
            <TabsTrigger value="companies" disabled>
              Companies (Coming Soon)
            </TabsTrigger>
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
                <CardDescription>CRUD operations for companies (Coming Soon)</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Company management features will be added here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
