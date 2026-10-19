import { Crown, ChevronLeft, ChevronRight } from "lucide-react";

export function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  section,
  setSection,
  navItems
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  section: string;
  setSection: (s: any) => void;
  navItems: any[]
}) {
  return (
    <aside className={`dashboard-sidebar ${sidebarOpen ? "fixed inset-y-0 left-0 z-40 block w-72 lg:sticky lg:w-72" : "hidden lg:sticky lg:block lg:w-20"}`}>
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground"><Crown className="h-5 w-5" /></div>
          {sidebarOpen && <div><p className="font-semibold">kalyan36bazar</p><p className="text-xs text-muted-foreground">Admin</p></div>}
        </div>
        <button className="icon-button hidden lg:grid" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <ChevronLeft /> : <ChevronRight />}
        </button>
      </div>
      <nav className="space-y-1 p-3">
        {navItems.map((item: any) => (
          <button
            key={item.id}
            className={`nav-item ${section === item.id ? "nav-item-active" : ""}`}
            onClick={() => {
              setSection(item.id);
              if (window.innerWidth < 1024) setSidebarOpen(false);
            }}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>{item.label}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
}
