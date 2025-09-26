import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { ReactQueryClientProvider } from "@/components/query-client-provider"
import "./globals.css"
import { Suspense } from "react"

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

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
          <header className="w-full bg-card border-b border-border shadow-sm">
            <div className="container mx-auto px-4 py-3 flex items-center gap-4">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <a href="/" className="flex items-center">
                  <img src="/placeholder-logo.svg" alt="Registry" className="h-8 w-auto object-contain" />
                  <span className="sr-only">Registry</span>
                </a>
              </div>

              <div className="ml-auto flex items-center gap-4">
                <nav className="hidden sm:flex items-center gap-3">
                  <a href="/search" className="text-sm text-muted-foreground hover:text-foreground">Discover</a>
                  <a href="/admin" className="text-sm text-muted-foreground hover:text-foreground">Admin</a>
                </nav>

                <div className="flex items-center gap-3">
                  <a href="/account" className="text-sm text-muted-foreground hover:text-foreground hidden sm:inline">Account</a>
                  <Avatar>
                    <AvatarImage src="/placeholder-user.jpg" alt="User" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </div>
          </header>

          <Suspense>{children}</Suspense>
        </ReactQueryClientProvider>
        <Analytics />
      </body>
    </html>
  )
}
