import { useState, useMemo } from "react";
import { AppUser, Bid, WinHistory } from "@/lib/mockApi";
import { Panel, DataTable, money, getToday } from "../ui/AdminUI";
import {
  ReceiptText,
  Copy,
  Check,
  Calculator,
  Briefcase,
  Wallet,
  Percent,
  Trophy,
  Info,
  Calendar,
  UserCheck,
  Eye
} from "lucide-react";
import { toast } from "sonner";

interface AgentReportModuleProps {
  users: AppUser[];
  bids: Bid[];
  wins: WinHistory[];
  filters: { date: string; marketId: string; status: string };
  updateFilter: (k: string, v: string) => void;
  assignedUserIds?: string[];
}

export function AgentReportModule({
  users,
  bids,
  wins,
  filters,
  updateFilter,
  assignedUserIds,
}: AgentReportModuleProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>(filters.date || getToday());
  const [customCommission, setCustomCommission] = useState<number | "">("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter users based on sub-admin assignment if any
  const availableUsers = useMemo(() => {
    if (assignedUserIds && assignedUserIds.length > 0) {
      return users.filter((u) => assignedUserIds.includes(String(u.id)));
    }
    return users;
  }, [users, assignedUserIds]);

  // Selected agent object
  const selectedAgent = useMemo(() => {
    if (selectedAgentId === "all") return null;
    return availableUsers.find((u) => String(u.id) === String(selectedAgentId)) || null;
  }, [availableUsers, selectedAgentId]);

  // Effective commission percentage for selected agent or global default
  const effectiveCommissionRate = useMemo(() => {
    if (customCommission !== "" && !isNaN(Number(customCommission))) {
      return Number(customCommission);
    }
    if (selectedAgent && selectedAgent.commission !== undefined) {
      return Number(selectedAgent.commission);
    }
    return 10; // Default 10% commission
  }, [customCommission, selectedAgent]);

  // Format date helper: YYYY-MM-DD -> DD-MM-YYYY
  const formatDisplayDate = (d: string) => {
    try {
      const parts = d.split("-");
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    } catch (_) { }
    return d;
  };

  const isToday = selectedDate === getToday();
  const dateFormatted = formatDisplayDate(selectedDate);
  const periodLabel = isToday ? `आजचा हिशोब ${dateFormatted}` : dateFormatted;

  // Function to build standard settlement clipboard message
  const generateSettlementMessage = (
    agentName: string,
    collection: number,
    commission: number,
    winAmt: number
  ) => {
    const balance = collection - commission - winAmt;
    const isPos = balance > 0;
    const isNeg = balance < 0;
    const absBal = Math.abs(balance);

    const statusTitle = isPos ? "जमा" : isNeg ? "नावे (देणे)" : "शून्य";
    const balanceDisplay = isNeg
      ? `-₹${absBal.toLocaleString("en-IN")}`
      : `₹${absBal.toLocaleString("en-IN")}`;

    const actionMsg = isPos
      ? `एजंटकडून कंपनीला ₹${absBal.toLocaleString("en-IN")} जमा करायचे आहेत.`
      : isNeg
        ? `कंपनीकडून एजंटला ₹${absBal.toLocaleString("en-IN")} द्यायचे आहेत.`
        : `दोन्ही बाजूंचा हिशोब पूर्णपणे जुळला आहे.`;

    return `कल्याण 36 बाजार

एजंट सेटलमेंट रिपोर्ट

एजंट नाव: ${agentName}
कालावधी: ${periodLabel}

Total Collection: ₹${collection.toLocaleString("en-IN")}
Total Commission: ₹${commission.toLocaleString("en-IN")}
Total Win Amount: ₹${winAmt.toLocaleString("en-IN")}

Final Settlement: ${balanceDisplay}
स्थिती: ${statusTitle}

${actionMsg}

कृपया वरील हिशोब तपासून घ्यावा.
धन्यवाद!
कल्याण 36 बाजार`;
  };

  // Per-user calculation for all users (Admin can see all users' agent reports)
  const allUsersReport = useMemo(() => {
    return availableUsers.map((user) => {
      const userBids = bids.filter((b) => b.app_user_id === user.id && b.bid_date === selectedDate);
      const userWins = wins.filter((w) => w.app_user_id === user.id && w.created_at.startsWith(selectedDate));

      const collection = userBids.reduce((sum, b) => sum + Number(b.amount || 0), 0);
      const winAmt = userWins.reduce((sum, w) => sum + Number(w.win_amount || 0), 0);
      const commRate = user.commission !== undefined && user.commission !== null ? Number(user.commission) : effectiveCommissionRate;
      const comm = Math.round((collection * commRate) / 100);
      const balance = collection - comm - winAmt;

      return {
        user,
        bidsCount: userBids.length,
        winsCount: userWins.length,
        collection,
        commission: comm,
        commRate,
        winAmount: winAmt,
        balance,
        isPositive: balance > 0,
        isNegative: balance < 0,
        isZero: balance === 0,
      };
    });
  }, [availableUsers, bids, wins, selectedDate, effectiveCommissionRate]);

  // Aggregated totals across all users or selected agent
  const currentViewStats = useMemo(() => {
    if (selectedAgentId === "all") {
      const collection = allUsersReport.reduce((s, u) => s + u.collection, 0);
      const winAmt = allUsersReport.reduce((s, u) => s + u.winAmount, 0);
      const comm = allUsersReport.reduce((s, u) => s + u.commission, 0);
      const balance = collection - comm - winAmt;
      const totalBidsCount = allUsersReport.reduce((s, u) => s + u.bidsCount, 0);
      const totalWinsCount = allUsersReport.reduce((s, u) => s + u.winsCount, 0);

      return {
        agentDisplayName: "All Users / सर्व एजंट",
        totalCollection: collection,
        totalWinAmount: winAmt,
        totalCommission: comm,
        finalBalance: balance,
        totalBidsCount,
        totalWinsCount,
      };
    } else {
      const userStat = allUsersReport.find((u) => String(u.user.id) === String(selectedAgentId));
      if (userStat) {
        return {
          agentDisplayName: userStat.user.name,
          totalCollection: userStat.collection,
          totalWinAmount: userStat.winAmount,
          totalCommission: userStat.commission,
          finalBalance: userStat.balance,
          totalBidsCount: userStat.bidsCount,
          totalWinsCount: userStat.winsCount,
        };
      }
      return {
        agentDisplayName: selectedAgent?.name || "Demo Agent",
        totalCollection: 0,
        totalWinAmount: 0,
        totalCommission: 0,
        finalBalance: 0,
        totalBidsCount: 0,
        totalWinsCount: 0,
      };
    }
  }, [selectedAgentId, allUsersReport, selectedAgent]);

  const {
    agentDisplayName,
    totalCollection,
    totalWinAmount,
    totalCommission,
    finalBalance,
  } = currentViewStats;

  const isPositive = finalBalance > 0;
  const isNegative = finalBalance < 0;
  const absBalance = Math.abs(finalBalance);
  const statusBadgeText = isPositive ? "जमा (+)" : isNegative ? "देणे (−)" : "शून्य (0)";

  const statusActionMessage = isPositive
    ? `एजंटकडून कंपनीला ₹${absBalance.toLocaleString("en-IN")} जमा करायचे आहेत.`
    : isNegative
      ? `कंपनीकडून एजंटला ₹${absBalance.toLocaleString("en-IN")} द्यायचे आहेत.`
      : `दोन्ही बाजूंचा हिशोब पूर्णपणे जुळला आहे.`;

  // Formatted settlement text for clipboard copy
  const activeSettlementMessage = useMemo(() => {
    return generateSettlementMessage(
      agentDisplayName,
      totalCollection,
      totalCommission,
      totalWinAmount
    );
  }, [agentDisplayName, totalCollection, totalCommission, totalWinAmount]);

  const copyToClipboard = (text: string, id: string = "main") => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      toast.success("रिपोर्ट क्लिपबोर्डवर कॉपी झाला! (Report copied to clipboard)");
      setTimeout(() => setCopiedId(null), 2500);
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <ReceiptText className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Agent Settlement Report</h1>
                <p className="text-sm font-semibold text-muted-foreground">एजंट सेटलमेंट रिपोर्ट (Admin Panel)</p>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary">
                <UserCheck className="h-3 w-3" /> Agent: {agentDisplayName}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 font-medium text-muted-foreground">
                <Calendar className="h-3 w-3" /> Period: {periodLabel}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 font-medium text-amber-600">
                <Percent className="h-3 w-3" /> Commission: {effectiveCommissionRate}%
              </span>
            </div>
          </div>

          {/* Quick Clipboard Action Only */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(activeSettlementMessage, "top")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow transition hover:opacity-90"
            >
              {copiedId === "top" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedId === "top" ? "Copied to Clipboard!" : "Copy to Clipboard"}
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-5 grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">एजंट / युझर निवडा</label>
            <select
              value={selectedAgentId}
              onChange={(e) => {
                setSelectedAgentId(e.target.value);
                const user = availableUsers.find(u => String(u.id) === e.target.value);
                if (user && user.commission !== undefined) {
                  setCustomCommission(user.commission);
                }
              }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">-- सर्व युझर्स एकत्र (All Users) --</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.phone || "No phone"}) - Comm: {u.commission || 0}%
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">तारीख निवडा (Date)</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                updateFilter("date", e.target.value);
              }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">कमिशन % (Commission %)</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                value={customCommission !== "" ? customCommission : effectiveCommissionRate}
                onChange={(e) => setCustomCommission(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="उदा. 10"
                className="w-full rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="pointer-events-none absolute right-3 top-2 text-sm font-bold text-muted-foreground">%</span>
            </div>
          </div>


        </div>
      </div>
    </div>

      {/* 4 Metrics Summary Cards */ }
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {/* Total Business */}
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Business</span>
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-500/10 text-blue-600">
          <Briefcase className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">एकूण धंदा</p>
      <p className="mt-2 text-2xl font-black text-foreground">
        {money.format(totalCollection)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{agentDisplayName}</p>
    </div>

    {/* Total Collection */}
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Collection</span>
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600">
          <Wallet className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">एकूण कलेक्शन</p>
      <p className="mt-2 text-2xl font-black text-emerald-600">
        {money.format(totalCollection)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">100% बिड अमाऊंट</p>
    </div>

    {/* Total Commission */}
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Commission</span>
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/10 text-amber-600">
          <Percent className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">एकूण कमिशन ({effectiveCommissionRate}%)</p>
      <p className="mt-2 text-2xl font-black text-amber-600">
        {money.format(totalCommission)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">कमिशन कपात</p>
    </div>

    {/* Total Win Amount */}
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Win Amount</span>
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-purple-500/10 text-purple-600">
          <Trophy className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">विन अमाऊंट</p>
      <p className="mt-2 text-2xl font-black text-purple-600">
        {money.format(totalWinAmount)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">एकूण विनर्स</p>
    </div>
  </div>

  {/* Hero Settlement Card */ }
  <div
    className={`rounded-2xl border p-6 text-card-foreground shadow-md transition-all ${isPositive
      ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-background to-emerald-500/5"
      : isNegative
        ? "border-rose-500/30 bg-gradient-to-br from-rose-500/10 via-background to-rose-500/5"
        : "border-border bg-card"
      }`}
  >
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Final Settlement Formula / अंतिम सेटलमेंट
          </span>
          <span
            className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-extrabold shadow-sm ${isPositive
              ? "bg-emerald-600 text-white"
              : isNegative
                ? "bg-rose-600 text-white"
                : "bg-muted text-muted-foreground"
              }`}
          >
            स्थिती: {statusBadgeText}
          </span>
        </div>

        <div className="mt-2 flex items-baseline gap-3">
          <span className="text-sm font-semibold text-muted-foreground">Final Balance:</span>
          <span
            className={`text-3xl font-black md:text-4xl ${isPositive
              ? "text-emerald-600 dark:text-emerald-400"
              : isNegative
                ? "text-rose-600 dark:text-rose-400"
                : "text-foreground"
              }`}
          >
            {isPositive ? `+₹${absBalance.toLocaleString("en-IN")}` : isNegative ? `-₹${absBalance.toLocaleString("en-IN")}` : `₹0`}
          </span>
        </div>

        <p className="mt-2 text-sm font-bold text-foreground">
          👉 {statusActionMessage}
        </p>
      </div>

      {/* Formula calculation badge with quick copy */}
      <div className="flex flex-col items-end gap-2">
        <div className="rounded-xl border border-border/80 bg-background/80 p-3 text-xs backdrop-blur-sm">
          <p className="font-bold text-muted-foreground">हिशोब सूत्र (Calculation):</p>
          <p className="mt-1 font-mono font-semibold">
            कलेक्शन ({money.format(totalCollection)})
            <br />− कमिशन ({money.format(totalCommission)})
            <br />− विन अमाऊंट ({money.format(totalWinAmount)})
            <br />
            <span className="font-bold underline underline-offset-2">
              = {isPositive ? `+₹${absBalance.toLocaleString("en-IN")}` : isNegative ? `-₹${absBalance.toLocaleString("en-IN")}` : `₹0`}
            </span>
          </p>
        </div>
        <button
          onClick={() => copyToClipboard(activeSettlementMessage, "hero")}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-bold shadow-sm transition hover:bg-muted"
        >
          {copiedId === "hero" ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-primary" />}
          {copiedId === "hero" ? "Copied!" : "Copy Report"}
        </button>
      </div>
    </div>
  </div>



  {/* All Users Agent Settlement Table (Admin Panel Only feature to see ALL users) */ }
  <Panel
    title={`सर्व युझर्स एजंट सेटलमेंट यादी (${allUsersReport.length} Users · ${periodLabel})`}
    action={
      <button
        onClick={() => copyToClipboard(activeSettlementMessage, "all_users_copy")}
        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow transition hover:opacity-95"
      >
        {copiedId === "all_users_copy" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copiedId === "all_users_copy" ? "Copied Total!" : "Copy Active Report"}
      </button>
    }
  >
    <div className="space-y-4">
      <DataTable headers={["एजंट / युझर", "एकूण कलेक्शन", "कमिशन", "विन अमाऊंट", "अंतिम सेटलमेंट", "स्थिती", "Action (कॉपी)"]}>
        {allUsersReport.map((stat) => {
          const userMsg = generateSettlementMessage(
            stat.user.name,
            stat.collection,
            stat.commission,
            stat.winAmount
          );
          const absVal = Math.abs(stat.balance);
          const isSelected = String(stat.user.id) === String(selectedAgentId);

          return (
            <tr
              key={stat.user.id}
              className={`transition-colors hover:bg-muted/30 ${isSelected ? "bg-primary/5 font-semibold" : ""}`}
            >
              <td className="font-medium">
                <div className="flex items-center gap-2">
                  <button
                    title="View user settlement"
                    onClick={() => setSelectedAgentId(String(stat.user.id))}
                    className="text-left hover:text-primary hover:underline"
                  >
                    <span className="font-bold">{stat.user.name}</span>
                    <br />
                    <span className="text-xs text-muted-foreground">{stat.user.phone || "No phone"}</span>
                  </button>
                </div>
              </td>
              <td className="font-bold text-foreground">
                {money.format(stat.collection)}
                <br />
                <span className="text-xs font-normal text-muted-foreground">{stat.bidsCount} bids</span>
              </td>
              <td className="font-semibold text-amber-600">
                {money.format(stat.commission)}
                <br />
                <span className="text-xs font-normal text-muted-foreground">({stat.commRate}%)</span>
              </td>
              <td className="font-semibold text-purple-600">
                {money.format(stat.winAmount)}
                <br />
                <span className="text-xs font-normal text-muted-foreground">{stat.winsCount} wins</span>
              </td>
              <td className={`font-black ${stat.isPositive ? "text-emerald-600" : stat.isNegative ? "text-rose-600" : "text-foreground"}`}>
                {stat.isPositive ? `+₹${absVal.toLocaleString("en-IN")}` : stat.isNegative ? `-₹${absVal.toLocaleString("en-IN")}` : "₹0"}
              </td>
              <td>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${stat.isPositive
                    ? "bg-emerald-500/10 text-emerald-600"
                    : stat.isNegative
                      ? "bg-rose-500/10 text-rose-600"
                      : "bg-muted text-muted-foreground"
                    }`}
                >
                  {stat.isPositive ? "जमा (+)" : stat.isNegative ? "देणे (−)" : "शून्य"}
                </span>
              </td>
              <td>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => copyToClipboard(userMsg, `user_${stat.user.id}`)}
                    title="Copy this agent's report"
                    className="inline-flex items-center gap-1 rounded border border-border bg-background px-2.5 py-1 text-xs font-semibold shadow-sm transition hover:bg-muted"
                  >
                    {copiedId === `user_${stat.user.id}` ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3 text-primary" />
                    )}
                    <span>{copiedId === `user_${stat.user.id}` ? "Copied" : "Copy"}</span>
                  </button>
                  <button
                    onClick={() => setSelectedAgentId(String(stat.user.id))}
                    title="Select & View Hero Card"
                    className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground transition hover:opacity-90"
                  >
                    <Eye className="h-3 w-3" />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
        {/* Grand Total Row */}
        <tr className="bg-muted/40 font-black">
          <td colSpan={1}>Grand Total / सर्व युझर्स एकूण:</td>
          <td className="text-foreground">{money.format(allUsersReport.reduce((s, u) => s + u.collection, 0))}</td>
          <td className="text-amber-600">{money.format(allUsersReport.reduce((s, u) => s + u.commission, 0))}</td>
          <td className="text-purple-600">{money.format(allUsersReport.reduce((s, u) => s + u.winAmount, 0))}</td>
          <td className="text-foreground">
            {(() => {
              const totBal = allUsersReport.reduce((s, u) => s + u.balance, 0);
              const isPos = totBal > 0;
              const isNeg = totBal < 0;
              return isPos ? `+₹${Math.abs(totBal).toLocaleString("en-IN")}` : isNeg ? `-₹${Math.abs(totBal).toLocaleString("en-IN")}` : "₹0";
            })()}
          </td>
          <td>
            {(() => {
              const totBal = allUsersReport.reduce((s, u) => s + u.balance, 0);
              return (
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${totBal > 0 ? "bg-emerald-500/10 text-emerald-600" : totBal < 0 ? "bg-rose-500/10 text-rose-600" : "bg-muted text-muted-foreground"}`}>
                  {totBal > 0 ? "जमा (+)" : totBal < 0 ? "देणे (−)" : "शून्य"}
                </span>
              );
            })()}
          </td>
          <td>
            <button
              onClick={() => copyToClipboard(generateSettlementMessage("All Users / सर्व युझर्स", allUsersReport.reduce((s, u) => s + u.collection, 0), allUsersReport.reduce((s, u) => s + u.commission, 0), allUsersReport.reduce((s, u) => s + u.winAmount, 0)), "grand_total")}
              className="inline-flex items-center gap-1 rounded bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground shadow transition hover:opacity-95"
            >
              {copiedId === "grand_total" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              <span>{copiedId === "grand_total" ? "Copied" : "Copy Total"}</span>
            </button>
          </td>
        </tr>
      </DataTable>
    </div>
  </Panel>

  {/* Message Copy Preview Card */ }
  <Panel
    title={`कॉपी मेसेज प्रिव्ह्यू (${agentDisplayName})`}
    action={
      <button
        onClick={() => copyToClipboard(activeSettlementMessage, "preview")}
        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow transition hover:opacity-95"
      >
        {copiedId === "preview" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copiedId === "preview" ? "Copied!" : "Copy Format"}
      </button>
    }
  >
    <div className="relative rounded-lg border border-border bg-muted/30 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
      {activeSettlementMessage}
    </div>
  </Panel>
    </div >
  );
}
