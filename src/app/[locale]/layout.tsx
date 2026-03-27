import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { SessionProvider } from "@/components/providers/session-provider";
import { PackageProvider } from "@/components/providers/PackageProvider";
import { GuestProvider } from "@/components/providers/GuestProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/sonner";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <SessionProvider>
      <GuestProvider>
        <PackageProvider>
          <NextIntlClientProvider>
            <Navbar />
            <main className="flex flex-1 flex-col">{children}</main>
            <Footer />
            <Toaster />
          </NextIntlClientProvider>
        </PackageProvider>
      </GuestProvider>
    </SessionProvider>
  );
}
