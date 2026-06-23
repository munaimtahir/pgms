import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AuthProvider } from "./context";
import Navbar from "../components/Navbar";

export const metadata: Metadata = {
  title: "PGMS — Postgraduate Management System",
  description: "Postgraduate Resident and Supervisor Management System",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}


