import type React from "react"
import type { Metadata } from "next"
import { Work_Sans, Open_Sans } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "./components/theme-provider"

const workSans = Work_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-work-sans",
  weight: ["400", "500", "600", "700"],
})

const openSans = Open_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-open-sans",
  weight: ["400", "500", "600"],
})

export const metadata: Metadata = {
  title: "LearnHub3DO - Nền tảng học trực tuyến",
  description: "Nền tảng học trực tuyến hiện đại với flashcard và thi thử",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" className={`${workSans.variable} ${openSans.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground">
        <ThemeProvider defaultTheme="light" storageKey="learnhub-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
