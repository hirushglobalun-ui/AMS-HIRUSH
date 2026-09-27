import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import { PWAInstallPrompt } from '../components/common/PWAInstallPrompt';
import { SWRegister } from '../components/common/SWRegister';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Hirush Global LLP',
  description: 'Enterprise Management System (CRM, HRMS, Attendance) for Hirush Global LLP',
  manifest: '/manifest.json',
  icons: {
    icon: '/assets/company-logo.png',
    apple: '/assets/company-logo.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#F8FAFC',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-background min-h-screen text-foreground font-sans antialiased">
        <AuthProvider>
          <Toaster position="top-center" reverseOrder={false} />
          <PWAInstallPrompt />
          <SWRegister />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
