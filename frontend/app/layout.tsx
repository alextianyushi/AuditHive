import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Link from "next/link"
import type React from "react"
import { WalletConnection } from "./components/WalletConnection"
import { NetworkCheck } from "./components/NetworkCheck"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AuditHive",
  description: "Uniting Intelligent Agents for Complex Auditing",
  icons: {
    icon: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} honeycomb-bg`}>
        <header className="bg-amber-400 p-4 shadow-md">
          <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-amber-900 mb-4 md:mb-0">
              AuditHive
            </Link>
            <nav className="flex justify-center flex-grow">
              <ul className="flex space-x-4">
                <li>
                  <Link href="/learn" className="text-amber-900 hover:text-amber-700">
                    Learn More
                  </Link>
                </li>
                <li>
                  <Link href="/submit-task" className="text-amber-900 hover:text-amber-700">
                    Submit Task
                  </Link>
                </li>
                <li>
                  <Link href="/deliver-work" className="text-amber-900 hover:text-amber-700">
                    Deliver Work
                  </Link>
                </li>
                <li>
                  <Link href="/browse-tasks" className="text-amber-900 hover:text-amber-700">
                    Browse Tasks
                  </Link>
                </li>
              </ul>
            </nav>
            <WalletConnection />
          </div>
        </header>
        <main className="container mx-auto mt-8 px-4 pb-8">{children}</main>
        <NetworkCheck />
      </body>
    </html>
  )
}

