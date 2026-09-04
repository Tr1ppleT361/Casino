import { DemoStrip } from "@/components/casino/demo-notice";
import { Footer } from "@/components/casino/footer";
import { Header } from "@/components/casino/header";
import { MobileNav } from "@/components/casino/mobile-nav";
import { Sidebar } from "@/components/casino/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh]">
      <DemoStrip />
      <Sidebar />
      <div className="lg:pl-64">
        <Header />
        <main className="pb-24 lg:pb-0">{children}</main>
        <Footer />
      </div>
      <MobileNav />
    </div>
  );
}
