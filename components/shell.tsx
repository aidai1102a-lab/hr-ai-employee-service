import { AppNav } from "@/components/app-nav";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen bg-background">
      <div className="hidden md:block"><AppNav /></div>
      <section className="min-w-0 flex-1">
        <div className="border-b bg-card md:hidden"><AppNav compact /></div>
        {children}
      </section>
    </main>
  );
}
