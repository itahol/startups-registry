import type React from "react"
import type { Metadata } from "next"
import Link from "next/link"
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
                <Link href="/" className="flex items-center">
                  <img src="/placeholder-logo.svg" alt="Registry" className="h-8 w-auto object-contain" />
                  <span className="sr-only">Registry</span>
                </Link>
              </div>

              <div className="ml-auto flex items-center gap-4">
                <nav className="hidden sm:flex items-center gap-3">
                  <Link href="/search" className="text-sm text-muted-foreground hover:text-foreground">Discover</Link>
                  <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">Admin</Link>
                </nav>

                <div className="flex items-center gap-3">
                  <Link href="/account" className="text-sm text-muted-foreground hover:text-foreground hidden sm:inline">Account</Link>
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
