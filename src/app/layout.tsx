import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import ProviderApp from "@/components/ProviverApp";

export const metadata = {
  title: "Dashboard Recrutement",
  description: "Analyse professionnelle des tests de recrutement",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased transition-colors">
        {/* Navigation, Breadcrumbs, etc. à intégrer ici */}
        <ProviderApp>
          {children}
          <Toaster richColors position="top-right" />
        </ProviderApp>
      </body>
    </html>
  );
}
