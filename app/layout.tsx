import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { ReactQueryClientProvider } from "@/components/query-client-provider"
import "./globals.css"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ReactQueryClientProvider>
          <header className="w-full bg-card border-b border-border">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <a href="/" className="text-lg font-semibold">Registry</a>
              <a href="/admin" className="text-sm text-muted-foreground">Admin</a>
            </div>
          </header>

          <Suspense>{children}</Suspense>
        </ReactQueryClientProvider>
        <Analytics />
      </body>
    </html>
  )
}
