import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import Sidebar from '@/components/Sidebar';

import { FaceApiProvider } from '@/context/FaceApiContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Face Attendance App",
  description: "Manage attendance with face recognition",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        <FaceApiProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 lg:pl-64 transition-all duration-300">
              <div className="p-4 lg:p-8 max-w-7xl mx-auto">
                <Toaster position="top-right" />
                {children}
              </div>
            </main>
          </div>
        </FaceApiProvider>
      </body>
    </html>
  );
}
