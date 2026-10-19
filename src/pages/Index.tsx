import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Crown,
  Database,
  DoorOpen,
  Gauge,
  History,
  Landmark,
  Lock,
  LogOut,
  Menu,
  RefreshCw,
  ShieldCheck,
  Trophy,
  Users,
  X,
  ListFilter,
  ClipboardList
} from "lucide-react";
import { toast } from "sonner";
import { realApi as mockApi } from "../lib/api";
import type { AppUser, Market, WithdrawDetail, ResultRecord, Bid, WinHistory, BalanceTransaction, MarketRecord, ActivityLog, Session } from "@/lib/mockApi";

import { money, formatDate, getToday } from "@/components/ui/AdminUI";
import { AdminModal, ModalState } from "@/components/modals/AdminModal";
import { Dashboard, UsersModule, MarketsModule, ResultsModule, WinsModule, RecordsModule, CommissionModule, BidsModule, SubAdminsModule, SubAdminOverviewModule, ActivityLogModule } from "@/components/modules/AdminModules";
import { CircleDollarSign } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

type Section = "dashboard" | "users" | "markets" | "results" | "wins" | "records" | "commission" | "bids" | "subadmins" | "activity" | "overview";

type Filters = {
  status: string;
  marketId: string;
  date: string;
};


const getEmptyFilters = (): Filters => ({ status: "all", marketId: "all", date: getToday() });

const navItems: Array<{ id: Section; label: string; icon: any }> = [
  { id: "dashboard", label: "Dashboard", icon: Gauge },
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "users", label: "Users", icon: Users },
  { id: "markets", label: "Markets", icon: DoorOpen },
  { id: "bids", label: "All Bids", icon: ListFilter },
  { id: "results", label: "Results", icon: Trophy },
  { id: "wins", label: "Win History", icon: History },
  { id: "records", label: "Bids Data", icon: Database },
  { id: "activity", label: "Activity Log", icon: ClipboardList },
  { id: "commission", label: "Commission", icon: CircleDollarSign },
  { id: "subadmins", label: "Sub Admins", icon: ShieldCheck },
];

const numberOrZero = (value: unknown) => Number(value ?? 0);

const bidTypeLabels: Record<Bid["bid_type"], string> = {
  single_digit: "Single Digit",
  single_pana: "Single Pana",
  double_pana: "Double Pana",
  triple_pana: "Triple Pana",
};

function App({ isSubAdminPortal = false }: { isSubAdminPortal?: boolean }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [section, setSection] = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filters, setFilters] = useState<Filters>(getEmptyFilters);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [withdrawDetails, setWithdrawDetails] = useState<WithdrawDetail[]>([]);
  const [results, setResults] = useState<ResultRecord[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [wins, setWins] = useState<WinHistory[]>([]);
  const [records, setRecords] = useState<MarketRecord[]>([]);
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([]);
  const [detailedBids, setDetailedBids] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [subAdmins, setSubAdmins] = useState<any[]>([]);

  useEffect(() => {
    const { data: listener } = mockApi.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    mockApi.auth.getSession().then(({ data }) => setSession(data.session));
    return () => listener.subscription.unsubscribe();
  }, []);

  const sessionUserId = session?.user?.id;
  useEffect(() => {
    if (session) {
      const role = (session.user as any)?.role;
      if (role === "admin") {
        setIsAdmin(true);
      } else if (role === "subadmin") {
        setIsAdmin(false); // They are sub-admin
      }
    }
  }, [session]);

  const filteredNavItems = useMemo(() => {
    const user = session?.user as any;
    const role = user?.role;
    if (role === "subadmin") {
      return navItems.filter(item => {
        if (item.id === "overview") return true;
        if (item.id === "users") return true; // My Users
        if (item.id === "commission") return user.show_commission !== false;
        if (item.id === "results") return user.show_result !== false;
        if (item.id === "records") return user.show_bid_data !== false;
        return false;
      }).map(item => item.id === "users" ? { ...item, label: "My Users" } : item);
    }
    return navItems;
  }, [session]);

  useEffect(() => {
    if (session) {
      const role = (session.user as any)?.role;
      if (role === "subadmin") {
        const allowedIds = filteredNavItems.map(i => i.id as string);
        if (!allowedIds.includes(section)) {
          setSection("overview");
        }
      }
      void loadAll();
      const interval = window.setInterval(() => void loadAll(false), 15000);
      return () => window.clearInterval(interval);
    }
  }, [session, filteredNavItems, section]);

  const userRole = (session?.user as any)?.role;
  const isSubAdmin = userRole === "subadmin";

  const assignedUserIds = useMemo(() => {
    if (!isSubAdmin) return null;
    return (session?.user as any)?.assigned_user_ids
      ? (session.user as any).assigned_user_ids.split(",").filter(Boolean).map(String)
      : [];
  }, [session, isSubAdmin]);

  const displayUsers = useMemo(() => {
    if (!assignedUserIds) return users;
    return users.filter(u => assignedUserIds.includes(String(u.id)));
  }, [users, assignedUserIds]);

  const displayBids = useMemo(() => {
    if (!assignedUserIds) return bids;
    return bids.filter(b => assignedUserIds.includes(String(b.app_user_id)));
  }, [bids, assignedUserIds]);

  const displayWins = useMemo(() => {
    if (!assignedUserIds) return wins;
    return wins.filter(w => assignedUserIds.includes(String(w.app_user_id)));
  }, [wins, assignedUserIds]);

  const displayDetailedBids = useMemo(() => {
    if (!assignedUserIds) return detailedBids;
    return detailedBids.filter(b => assignedUserIds.includes(String(b.app_user_id)));
  }, [detailedBids, assignedUserIds]);

  const displayTransactions = useMemo(() => {
    if (!assignedUserIds) return transactions;
    return transactions.filter(t => assignedUserIds.includes(String(t.app_user_id)));
  }, [transactions, assignedUserIds]);

  const userById = useMemo(() => new Map(displayUsers.map((user) => [user.id, user])), [displayUsers]);
  const marketById = useMemo(() => new Map(markets.map((market) => [market.id, market])), [markets]);

  const filteredMarkets = useMemo(() => markets.filter((market) => filters.status === "all"), [markets, filters.status]);

  const filteredResults = useMemo(() => results.filter((item) =>
    (!filters.date || item.result_date === filters.date) &&
    (filters.marketId === "all" || String(item.market_id) === String(filters.marketId))
  ), [results, filters.date, filters.marketId]);

  const filteredRecords = useMemo(() => {
    const dailyBids = displayBids.filter((bid) =>
      (!filters.date || bid.bid_date === filters.date) &&
      (filters.marketId === "all" || String(bid.market_id) === String(filters.marketId))
    );

    const grouped = new Map<string, MarketRecord>();

    dailyBids.forEach(bid => {
      const key = `${bid.bid_date}-${bid.market_id}`;
      if (!grouped.has(key)) {
        const market = marketById.get(bid.market_id);
        grouped.set(key, {
          date: bid.bid_date,
          market_id: bid.market_id,
          market_name: market?.market_name || "Unknown",
          total_bids: 0,
          total_bid_amount: 0,
          single_digit_0: 0, single_digit_1: 0, single_digit_2: 0, single_digit_3: 0, single_digit_4: 0,
          single_digit_5: 0, single_digit_6: 0, single_digit_7: 0, single_digit_8: 0, single_digit_9: 0,
          single_pana: 0,
          double_pana: 0,
          triple_pana: 0,
        });
      }

      const rec = grouped.get(key)!;
      rec.total_bids += 1;
      rec.total_bid_amount += numberOrZero(bid.amount);

      if (bid.bid_type === "single_digit") {
        const digitKey = `single_digit_${bid.number_played}` as keyof MarketRecord;
        if (digitKey in rec) {
          (rec[digitKey] as number) += numberOrZero(bid.amount);
        }
      } else {
        // Handle Pana types and others with detailed breakdown strings
        // We'll store them in a temporary structure or update the existing number fields if we don't mind type casting
        const type = bid.bid_type as keyof MarketRecord;
        if (type === "single_pana" || type === "double_pana" || type === "triple_pana") {
          // If it's the first bid of this type for this market/date, it might be a number (0)
          // We'll use a hidden property to store the map for calculation, then convert to string later
          const mapKey = `_map_${type}`;
          if (!(rec as any)[mapKey]) (rec as any)[mapKey] = new Map<string, number>();
          const m = (rec as any)[mapKey] as Map<string, number>;
          m.set(bid.number_played, (m.get(bid.number_played) || 0) + numberOrZero(bid.amount));
        }
      }
    });

    // Post-process to convert Maps to display strings
    grouped.forEach(rec => {
      ["single_pana", "double_pana", "triple_pana"].forEach(type => {
        const mapKey = `_map_${type}`;
        const m = (rec as any)[mapKey] as Map<string, number> | undefined;
        if (m) {
          // Store numeric sum for totals calculation
          const sum = Array.from(m.values()).reduce((a, b) => a + b, 0);
          (rec as any)[type] = sum;

          // Store display string for the table cell
          (rec as any)[`${type}_display`] = Array.from(m.entries())
            .map(([num, amt]) => `${num} = ${amt}`)
            .join("\n");
        }
      });
    });

    return Array.from(grouped.values());
  }, [bids, filters.date, filters.marketId, marketById]);

  const analytics = useMemo(() => {
    const dailyBids = displayBids.filter((bid) =>
      (!filters.date || bid.bid_date === filters.date) &&
      (filters.marketId === "all" || String(bid.market_id) === String(filters.marketId))
    );
    const totalBidAmount = dailyBids.reduce((sum, bid) => sum + numberOrZero(bid.amount), 0);
    const totalWithdraw = 0; // Simplified for now
    const totalDeposit = displayTransactions.filter((trx) => ["add", "deposit"].includes(trx.transaction_type)).reduce((sum, trx) => sum + numberOrZero(trx.amount), 0);
    const totalCommission = Math.round(totalBidAmount * 0.05);
    const digits = Array.from({ length: 10 }, (_, digit) => dailyBids.filter((bid) => bid.bid_type === "single_digit" && bid.number_played === String(digit)).length);
    const digitAmounts = Array.from({ length: 10 }, (_, digit) => dailyBids.filter((bid) => bid.bid_type === "single_digit" && bid.number_played === String(digit)).reduce((sum, bid) => sum + numberOrZero(bid.amount), 0));
    const typeCounts = Object.keys(bidTypeLabels).map((type) => ({ label: bidTypeLabels[type as Bid["bid_type"]], count: dailyBids.filter((bid) => bid.bid_type === type).length }));
    const marketStats = markets.map((market) => ({ name: market.market_name, bids: dailyBids.filter((bid) => bid.market_id === market.id).length, amount: dailyBids.filter((bid) => bid.market_id === market.id).reduce((sum, bid) => sum + numberOrZero(bid.amount), 0) })).sort((a, b) => b.amount - a.amount);
    return { totalBidAmount, totalWithdraw, totalDeposit, totalCommission, digits, digitAmounts, typeCounts, marketStats };
  }, [displayBids, markets, displayTransactions, displayUsers, filters.date, filters.marketId]);

  async function loadAll(showSpinner = true) {
    if (showSpinner) setLoading(true);
    const { data, error } = await mockApi.db.getAll();
    if (!error) {
      setUsers(data.app_users || []); setMarkets(data.markets || []);
      setResults(data.results || []); setBids(data.bids || []); setWins(data.win_history || []);
      setRecords(data.market_bid_records || []); setTransactions(data.balance_transactions || []);
      setActivityLogs(data.activity_logs || []);
      setWithdrawDetails(data.withdraw_details || []); setSubAdmins(data.sub_admins || []);
    }

    const { data: bidData } = await mockApi.db.getAllBids();
    if (bidData) setDetailedBids(bidData);

    if (showSpinner) setLoading(false);
  }

  async function remove(table: string, id: string, label: string) {
    if (!window.confirm(`Delete ${label}?`)) return;
    const { error } = await mockApi.db.delete(table as any, id);
    if (!error) { toast.success(`${label} deleted.`); void loadAll(false); }
  }

  const handleLogout = async () => { await mockApi.auth.signOut(); setSection("dashboard"); };

  if (!session) return <AuthScreen isSubAdminPortal={isSubAdminPortal} />;

  return (
    <main className="min-h-screen bg-background text-foreground flex">
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        section={section}
        setSection={setSection}
        navItems={filteredNavItems}
      />

      <section className="min-w-0 flex-1">
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          section={section}
          navItems={filteredNavItems}
          filters={filters}
          markets={markets}
          loading={loading}
          loadAll={() => void loadAll()}
          handleLogout={handleLogout}
          updateFilter={(k, v) => setFilters(f => ({ ...f, [k]: v }))}
          resetFilters={() => setFilters(getEmptyFilters())}
        />

        <div className="p-4 lg:p-6">
          {section === "dashboard" && <Dashboard users={displayUsers} bids={displayBids} wins={displayWins} markets={markets} results={results} analytics={analytics} setSection={setSection} filters={filters} updateFilter={(k, v) => setFilters(f => ({ ...f, [k]: v }))} />}
          {section === "overview" && (
            <SubAdminOverviewModule
              users={displayUsers}
              bids={displayBids}
              wins={displayWins}
              markets={markets}
              results={results}
              filters={filters}
              updateFilter={(k, v) => setFilters(f => ({ ...f, [k]: v }))}
              assignedUserIds={assignedUserIds || undefined}
            />
          )}
          {section === "users" && (
            <UsersModule
              users={displayUsers}
              onCreate={!isSubAdmin ? () => setModal({ kind: "user", mode: "create" }) : undefined}
              onEdit={!isSubAdmin ? (item) => setModal({ kind: "user", mode: "edit", item }) : undefined}
              onDelete={!isSubAdmin ? (id) => remove("app_users", id, "user") : undefined}
            />
          )}
          {section === "markets" && <MarketsModule items={filteredMarkets} onCreate={() => setModal({ kind: "market", mode: "create" })} onEdit={(item) => setModal({ kind: "market", mode: "edit", item })} onDelete={(id) => remove("markets", id, "market")} />}
          {section === "results" && (
            <ResultsModule
              items={filteredResults}
              marketById={marketById}
              filters={filters}
              updateFilter={(k, v) => setFilters(f => ({ ...f, [k]: v }))}
              onCreate={() => setModal({ kind: "result", mode: "create" })}
              onEdit={(item) => setModal({ kind: "result", mode: "edit", item })}
              onDelete={(id) => remove("results", id, "result")}
              canAdd={(session?.user as any)?.can_add_result !== false}
              canUpdate={(session?.user as any)?.can_update_result !== false}
              canDelete={(session?.user as any)?.can_delete_result !== false}
            />
          )}
          {section === "wins" && <WinsModule items={displayWins} />}
          {section === "records" && <RecordsModule items={filteredRecords} markets={markets} filters={filters} updateFilter={(k, v) => setFilters(f => ({ ...f, [k]: v }))} />}
          {section === "commission" && (
            <CommissionModule
              users={displayUsers}
              bids={displayBids}
              wins={displayWins}
              filters={filters}
              updateFilter={(k, v) => setFilters(f => ({ ...f, [k]: v }))}
              assignedUserIds={assignedUserIds || undefined}
            />
          )}
          {section === "bids" && <BidsModule items={displayDetailedBids} filters={filters} updateFilter={(k, v) => setFilters(f => ({ ...f, [k]: v }))} />}
          {section === "subadmins" && <SubAdminsModule items={subAdmins} onCreate={() => setModal({ kind: "sub_admin", mode: "create" })} onEdit={(item) => setModal({ kind: "sub_admin", mode: "edit", item })} onDelete={(id) => remove("sub_admins", id, "sub admin")} />}
          {section === "activity" && <ActivityLogModule items={activityLogs} users={displayUsers} />}
        </div>
      </section>

      {modal && <AdminModal modal={modal} users={users} markets={markets} results={results} onClose={() => setModal(null)} onSaved={() => { setModal(null); void loadAll(false); }} />}
    </main>
  );
}

function AuthScreen({ isSubAdminPortal }: { isSubAdminPortal: boolean }) {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true);
    const { error } = await mockApi.auth.signInWithPassword({ email, password });
    setBusy(false); if (error) toast.error(error.message); else toast.success("Signed in.");
  }
  return (
    <main className="auth-screen min-h-screen bg-background text-foreground grid place-items-center">
      <section className="dashboard-panel w-full max-w-md p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-md bg-primary text-primary-foreground">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{isSubAdminPortal ? "Kalyan 36 Bazar Sub-Admin" : "Kalyan 36 Bazar Admin"}</h1>
            <p className="text-sm text-muted-foreground">{isSubAdminPortal ? "Sub-admin access portal" : "Secure gaming operations console"}</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4"><label className="field-label">Username<input className="field-input" type="text" value={email} onChange={(e) => setEmail(e.target.value)} required /></label><label className="field-label">Password<input className="field-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label><button className="btn-primary w-full" disabled={busy}>{busy ? "Please wait…" : "Login"}</button></form>

        <div className="mt-8 pt-6 border-t border-border/50 text-center">
          <a
            href="/apk"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
          >
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Download Kalyan 36 Bazar App
          </a>
        </div>
      </section>
    </main>
  );
}

export default App;
