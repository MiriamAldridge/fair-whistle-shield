import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Image from "next/image";
import Link from "next/link";
import { ConnectWalletTopRight } from "@/components/ConnectWalletTopRight";

export const metadata: Metadata = {
  title: "Fair Whistle Shield",
  description: "Anonymous encrypted whistleblower system powered by FHEVM",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        <div className="min-h-screen">
          <main className="flex flex-col max-w-screen-lg mx-auto pb-20 px-3 md:px-0">
            <Providers>
              <nav className="flex w-full px-3 md:px-0 h-fit py-6 items-center gap-4">
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Image
                    src="/whistle-logo.svg"
                    alt="Fair Whistle Shield"
                    width={96}
                    height={96}
                    style={{ width: "auto", height: "auto" }}
                    priority
                    sizes="(max-width: 768px) 96px, 96px"
                  />
                </div>
                <div className="flex-1 flex items-center justify-center gap-2 text-sm md:text-base">
                  <Link
                    href="/"
                    className="btn btn-ghost btn-sm md:btn-md px-3 md:px-4"
                  >
                    Report
                  </Link>
                  <Link
                    href="/decrypt"
                    className="btn btn-ghost btn-sm md:btn-md px-3 md:px-4"
                  >
                    Decrypt
                  </Link>
                </div>
                <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                  <ConnectWalletTopRight />
                </div>
              </nav>
              {children}
            </Providers>
          </main>
        </div>
      </body>
    </html>
  );
}
