import { useState, useEffect, ReactNode, useMemo } from "react";
import { AppUser, Market, ResultRecord } from "@/lib/mockApi";
import { Field, getToday } from "../ui/AdminUI";
import { ChevronDown, Search, Sparkles, Upload, ShieldCheck, CheckCircle2 } from "lucide-react";
import rsbossResults from "@/data/rsboss_results.json";
import { RsbossToggle, getTakeRsbossResult } from "../ExportChart";

const pannaList = ["000", "100", "110", "111", "112", "113", "114", "115", "116", "117", "118", "119", "120", "122", "123", "124", "125", "126", "127", "128", "129", "130", "133", "134", "135", "136", "137", "138", "139", "140", "144", "145", "146", "147", "148", "149", "150", "155", "156", "157", "158", "159", "160", "166", "167", "168", "169", "170", "177", "178", "179", "180", "188", "189", "190", "199", "200", "220", "222", "223", "224", "225", "226", "227", "228", "229", "230", "233", "234", "235", "236", "237", "238", "239", "240", "244", "245", "246", "247", "248", "249", "250", "255", "256", "257", "258", "259", "260", "266", "267", "268", "269", "270", "277", "278", "279", "280", "288", "289", "290", "299", "300", "330", "333", "334", "335", "336", "337", "338", "339", "340", "344", "345", "346", "347", "348", "349", "350", "355", "356", "357", "358", "359", "360", "366", "367", "368", "369", "370", "377", "378", "379", "380", "388", "389", "390", "399", "400", "440", "444", "445", "446", "447", "448", "449", "450", "455", "456", "457", "458", "459", "460", "466", "467", "468", "469", "470", "477", "478", "479", "480", "488", "489", "490", "499", "500", "550", "555", "556", "557", "558", "559", "560", "566", "567", "568", "569", "570", "577", "578", "579", "580", "588", "589", "590", "599", "600", "660", "666", "667", "668", "669", "670", "677", "678", "679", "680", "688", "689", "690", "699", "700", "770", "777", "778", "779", "780", "788", "789", "790", "799", "800", "880", "888", "889", "890", "899", "900", "990", "999"];



export function UserMultiSelect({ users, selectedIds = [] }: { users: AppUser[]; selectedIds?: string[] }) {
  // Ensure we start with unique string IDs
  const initialSelected = Array.from(new Set(selectedIds.map(String).filter(Boolean)));
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setSelected(Array.from(new Set(selectedIds.map(String).filter(Boolean))));
  }, [selectedIds.join(",")]);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.phone.includes(search)
  );

  const toggle = (id: string | number) => {
    const sId = String(id);
    setSelected((prev) => prev.includes(sId) ? prev.filter((i) => i !== sId) : [...prev, sId]);
  };

  const selectAll = () => {
    const allFilteredIds = filteredUsers.map(u => String(u.id));
    setSelected(prev => Array.from(new Set([...prev, ...allFilteredIds])));
  };

  const deselectAll = () => {
    const filteredIds = new Set(filteredUsers.map(u => String(u.id)));
    setSelected(prev => prev.filter(id => !filteredIds.has(id)));
  };

  return (
    <div className="md:col-span-2 border-t border-border pt-4 mt-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <label className="field-label mb-0">Assign Users to Sub-Admin</label>
        <div className="flex gap-2">
          <button type="button" onClick={selectAll} className="text-xs font-medium text-primary hover:underline">Select Filtered</button>
          <span className="text-border">|</span>
          <button type="button" onClick={deselectAll} className="text-xs font-medium text-muted-foreground hover:underline">Deselect Filtered</button>
        </div>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input 
          className="field-input pl-9" 
          placeholder="Search users by name or phone..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto p-2 border border-border/50 rounded-md bg-muted/5 shadow-inner">
        {filteredUsers.map((user) => (
          <label key={user.id} className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded cursor-pointer transition-colors border border-border/50 bg-background/50">
            <input 
              type="checkbox" 
              checked={selected.includes(String(user.id))} 
              onChange={() => toggle(user.id)}
              className="w-4 h-4 accent-primary"
            />
            <div className="text-sm">
              <p className="font-medium leading-tight">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.phone}</p>
            </div>
          </label>
        ))}
        {filteredUsers.length === 0 && (
          <div className="col-span-full py-8 text-center text-muted-foreground italic">
            No users found matching "{search}"
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-2 font-medium">
        {selected.length} users selected total {search && `(${filteredUsers.filter(u => selected.includes(u.id)).length} in current view)`}
      </p>
      <input type="hidden" name="assigned_user_ids" value={selected.join(",")} />
    </div>
  );
}

type SelectOption = string | { value: string; label: string };

function SearchableSelect({ 
  options, 
  value, 
  onChange, 
  placeholder = "Search...", 
  name,
  label 
}: { 
  options: SelectOption[], 
  value: string, 
  onChange: (val: string) => void, 
  placeholder?: string, 
  name?: string,
  label: string
}) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const getLabel = (opt: SelectOption) => typeof opt === "string" ? opt : opt.label;
  const getValue = (opt: SelectOption) => typeof opt === "string" ? opt : opt.value;

  const filtered = options.filter(opt => getLabel(opt).toLowerCase().includes(search.toLowerCase()));
  const currentLabel = getLabel(options.find(opt => getValue(opt) === value) || "") || value;

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".searchable-select-container")) {
        setIsOpen(false);
      }
    };
    window.addEventListener("mousedown", handleDown);
    return () => window.removeEventListener("mousedown", handleDown);
  }, [isOpen]);

  return (
    <div className="field-label searchable-select-container">
      {label}
      <div className="relative mt-1">
        <input type="hidden" name={name} value={value} />
        <div 
          className="field-input flex items-center justify-between cursor-pointer bg-background"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={value ? "text-foreground" : "text-muted-foreground"}>
            {currentLabel || placeholder}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </div>
        
        {isOpen && (
          <div className="absolute z-[100] w-full mt-1 bg-card text-card-foreground border border-border rounded-md shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-2 border-b border-border flex items-center gap-2 bg-muted/20">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input 
                className="w-full bg-transparent text-sm outline-none py-1" 
                placeholder={placeholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="max-h-[240px] overflow-y-auto">
              {filtered.length > 0 ? (
                filtered.map(opt => {
                  const optVal = getValue(opt);
                  const optLab = getLabel(opt);
                  return (
                    <div 
                      key={optVal}
                      className={`px-3 py-2 text-sm cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground ${optVal === value ? "bg-primary/20 text-primary font-bold" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange(optVal);
                        setIsOpen(false);
                        setSearch("");
                      }}
                    >
                      {optLab}
                    </div>
                  );
                })
              ) : (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">No results found</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function UserSelect({ users, defaultValue }: { users: AppUser[]; defaultValue?: string }) {
  const [val, setVal] = useState(defaultValue || "");
  const options = users.map(u => ({ value: u.id, label: `${u.name} • ${u.phone}` }));

  return (
    <SearchableSelect 
      label="User"
      name="app_user_id"
      options={options}
      value={val}
      onChange={setVal}
      placeholder="Select or search user..."
    />
  );
}

export function MarketSelect({ markets, defaultValue }: { markets: Market[]; defaultValue?: string }) {
  return (
    <label className="field-label">
      Market
      <select className="field-input" name="market_id" defaultValue={defaultValue ?? ""} required>
        <option value="" disabled>Select market</option>
        {markets.map((market) => <option key={market.id} value={market.id}>{market.market_name}</option>)}
      </select>
    </label>
  );
}

export function ResultFormFields({ markets, item, results = [], mode }: { markets: Market[]; item?: ResultRecord; results?: ResultRecord[]; mode?: string }) {
  const [date, setDate] = useState(item?.result_date ?? getToday());
  const [pana, setPana] = useState(item?.open_pana || "100");
  const calculateDigit = (p: string) => {
    const sum = p.split("").reduce((acc, digit) => acc + Number(digit), 0);
    return sum % 10;
  };
  const [digit, setDigit] = useState(item?.open_digit ?? calculateDigit(pana));

  const handlePanaChange = (newPana: string) => {
    setPana(newPana);
    setDigit(calculateDigit(newPana));
  };

  const availableMarkets = useMemo(() => {
    if (mode === "edit") return markets; // Allow keeping the same market in edit mode
    const declaredMarketIds = new Set(results.filter(r => r.result_date === date).map(r => String(r.market_id)));
    return markets.filter(m => !declaredMarketIds.has(String(m.id)));
  }, [markets, results, date, mode]);

  return (
    <>
      <label className="field-label">
        Date
        <input 
          className="field-input w-full" 
          name="result_date" 
          type="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)}
          required 
        />
      </label>
      
      <MarketSelect markets={availableMarkets} defaultValue={item?.market_id} />
      
      <SearchableSelect 
        label="Open Pana"
        name="open_pana"
        options={pannaList}
        value={pana}
        onChange={handlePanaChange}
        placeholder="Select or search Pana..."
      />

      <label className="field-label">
        Open Digit
        <input className="field-input bg-muted/30 font-bold" name="open_digit" type="number" value={digit} readOnly required />
      </label>
    </>
  );
}

export function PermissionSelect({ item }: { item?: any }) {
  const [perms, setPerms] = useState({
    can_add_result: item?.can_add_result ?? true,
    can_update_result: item?.can_update_result ?? true,
    can_delete_result: item?.can_delete_result ?? true,
    show_commission: item?.show_commission ?? true,
    show_bid_data: item?.show_bid_data ?? true,
    show_result: item?.show_result ?? true,
    show_agent_report: item?.show_agent_report ?? true,
  });

  const toggle = (key: string) => {
    setPerms((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  const labels: Record<string, string> = {
    can_add_result: "Add Result",
    can_update_result: "Update Result",
    can_delete_result: "Delete Result",
    show_commission: "Show Commission",
    show_bid_data: "Show Bid Data",
    show_result: "Show Results Section",
    show_agent_report: "Show Agent Report (एजंट रिपोर्ट)",
  };

  return (
    <div className="md:col-span-2 border-t border-border pt-4 mt-2">
      <label className="field-label mb-3 text-primary font-bold">Sub-Admin Permissions</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(labels).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors border border-border/50 bg-muted/10">
            <input 
              type="checkbox" 
              name={key}
              checked={!!perms[key as keyof typeof perms]} 
              onChange={() => toggle(key)}
              className="w-4 h-4 accent-primary"
              value="true"
            />
            <span className="text-sm font-medium">{label}</span>
            <input type="hidden" name={`${key}_hidden`} value={perms[key as keyof typeof perms] ? "true" : "false"} />
          </label>
        ))}
      </div>
    </div>
  );
}

export function EntityForm({ fields, busy, onSubmit }: { fields: ReactNode; busy: boolean; onSubmit: (form: FormData) => void | Promise<void> }) {
  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); void onSubmit(new FormData(event.currentTarget)); }}>
      {fields}
      <div className="flex justify-end md:col-span-2">
        <button className="btn-primary" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
      </div>
    </form>
  );
}

export function BulkResultUploadForm({
  markets,
  results = [],
  defaultDate,
  onSave,
  busy,
  onClose
}: {
  markets: Market[];
  results?: ResultRecord[];
  defaultDate?: string;
  onSave: (items: any[]) => Promise<void>;
  busy: boolean;
  onClose?: () => void;
}) {
  const [targetDate, setTargetDate] = useState(defaultDate || getToday());
  const [rows, setRows] = useState<Array<{
    marketId: number;
    marketName: string;
    openTime: string;
    openPana: string;
    openDigit: string;
    isExistingManual: boolean;
    hasBackup: boolean;
    backupValue?: string;
  }>>([]);

  const calculateDigit = (p: string) => {
    if (!p || p.length < 3) return "";
    const sum = p.slice(0, 3).split("").reduce((acc, digit) => acc + (parseInt(digit, 10) || 0), 0);
    return String(sum % 10);
  };

  const parseMins = (tStr: string) => {
    if (!tStr) return -1;
    const t = String(tStr).trim().toLowerCase();
    const match = t.match(/(\d+):(\d+)/);
    if (!match) return -1;
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    if (t.includes("pm") && h < 12) h += 12;
    if (t.includes("am") && h === 12) h = 0;
    return h * 60 + m;
  };

  useEffect(() => {
    const existingManualMap = new Map<number, ResultRecord>();
    results.filter(r => r.result_date === targetDate).forEach(r => {
      existingManualMap.set(Number(r.market_id), r);
    });

    const backupMap = new Map<number, any>();
    if (Array.isArray(rsbossResults)) {
      rsbossResults.filter((item: any) => item.result_date === targetDate).forEach((item: any) => {
        const mins = parseMins(item.time);
        if (mins !== -1) backupMap.set(mins, item);
      });
    }

    const sortedMarkets = [...markets].sort((a, b) => parseMins(a.open_time) - parseMins(b.open_time));

    const initialRows = sortedMarkets.map(m => {
      const existing = existingManualMap.get(Number(m.id));
      const mins = parseMins(m.open_time);
      const backup = backupMap.get(mins);

      let pana = "";
      let digit = "";
      let isExisting = false;

      if (existing) {
        pana = String(existing.open_pana || "");
        digit = existing.open_digit !== undefined && existing.open_digit !== null ? String(existing.open_digit) : calculateDigit(pana);
        isExisting = true;
      }

      return {
        marketId: Number(m.id),
        marketName: m.market_name,
        openTime: m.open_time,
        openPana: pana,
        openDigit: digit,
        isExistingManual: isExisting,
        hasBackup: !!backup,
        backupValue: backup ? `${backup.open_pana}-${backup.open_digit}` : undefined
      };
    });

    setRows(initialRows);
  }, [targetDate, markets, results]);

  const handlePanaChange = (index: number, val: string) => {
    const sanitized = val.replace(/\D/g, "").slice(0, 3);
    const digit = calculateDigit(sanitized);
    setRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], openPana: sanitized, openDigit: digit };
      return updated;
    });
  };

  const fillFromBackup = () => {
    setRows(prev => prev.map(row => {
      if (row.openPana) return row; // Don't overwrite existing manual
      if (row.backupValue) {
        const [bPana, bDigit] = row.backupValue.split("-");
        return {
          ...row,
          openPana: bPana || "",
          openDigit: bDigit || calculateDigit(bPana || "")
        };
      }
      return row;
    }));
  };

  const clearDraft = () => {
    setRows(prev => prev.map(row => row.isExistingManual ? row : { ...row, openPana: "", openDigit: "" }));
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = rows
      .filter(r => r.openPana.length === 3)
      .map(r => ({
        market_id: r.marketId,
        result_date: targetDate,
        open_pana: r.openPana,
        open_digit: Number(r.openDigit || calculateDigit(r.openPana))
      }));

    if (validItems.length === 0) {
      alert("Please enter at least one valid 3-digit Pana to upload.");
      return;
    }

    await onSave(validItems);
  };

  const manualCount = rows.filter(r => r.openPana.length === 3).length;
  const backupCount = rows.filter(r => r.hasBackup).length;

  return (
    <form onSubmit={handleSaveAll} className="space-y-4 max-h-[80vh] flex flex-col">
      {/* Top Banner explaining Priority */}
      <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-xs sm:text-sm flex items-start gap-2 text-foreground">
        <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-primary">Manual Result Upload Priority Notice:</p>
          <p className="text-muted-foreground mt-0.5">
            Results entered here have <strong>TOP PRIORITY</strong> across the entire system and PDF export chart.
            Any RSBOSS data serves strictly as a secondary backup for unentered slots.
          </p>
        </div>
      </div>

      {/* Control bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/20 p-3 rounded-lg border border-border">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Target Date:
            </label>
            <input
              type="date"
              className="field-input py-1 px-2 text-sm"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>
          <RsbossToggle />
        </div>

        <div className="flex items-center gap-2">
          {backupCount > 0 && (
            <button
              type="button"
              onClick={fillFromBackup}
              className="btn-compact border border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 flex items-center gap-1.5"
              title="Fill empty rounds using RSBOSS backup as a draft to edit and upload"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Fill Empty from Backup ({backupCount})
            </button>
          )}
          <button
            type="button"
            onClick={clearDraft}
            className="btn-compact border border-border text-muted-foreground hover:bg-muted"
          >
            Reset Draft
          </button>
        </div>
      </div>

      {/* Grid of 36 Markets */}
      <div className="overflow-y-auto max-h-[50vh] border border-border rounded-lg bg-card divide-y divide-border/60">
        <div className="grid grid-cols-12 gap-2 p-2.5 bg-muted/50 text-xs font-semibold text-muted-foreground sticky top-0 z-10 border-b border-border">
          <div className="col-span-1">#</div>
          <div className="col-span-4">Market & Time</div>
          <div className="col-span-3">Open Pana (3 Digits)</div>
          <div className="col-span-2 text-center">Digit</div>
          <div className="col-span-2 text-right">Status</div>
        </div>

        {rows.map((row, idx) => (
          <div
            key={row.marketId}
            className={`grid grid-cols-12 gap-2 p-2 items-center text-sm transition-colors hover:bg-muted/30 ${
              row.isExistingManual ? "bg-primary/5" : ""
            }`}
          >
            <div className="col-span-1 text-xs text-muted-foreground font-mono">{idx + 1}</div>
            <div className="col-span-4">
              <p className="font-medium text-xs sm:text-sm leading-tight">{row.marketName}</p>
              <span className="text-[11px] text-muted-foreground">{row.openTime}</span>
            </div>
            <div className="col-span-3">
              <input
                type="text"
                maxLength={3}
                placeholder="Pana (e.g. 137)"
                value={row.openPana}
                onChange={(e) => handlePanaChange(idx, e.target.value)}
                className="field-input py-1 px-2 font-mono text-center tracking-widest text-sm w-full font-bold focus:border-primary"
              />
            </div>
            <div className="col-span-2 flex justify-center">
              <span className="w-8 h-8 rounded-full bg-muted/60 border border-border flex items-center justify-center font-bold text-sm text-primary">
                {row.openDigit || "—"}
              </span>
            </div>
            <div className="col-span-2 text-right">
              {row.isExistingManual ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-green-600 dark:text-green-400 font-semibold bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/30">
                  <CheckCircle2 className="h-3 w-3" /> Manual
                </span>
              ) : row.hasBackup ? (
                <span className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20" title={`RSBOSS Backup: ${row.backupValue}`}>
                  Backup: {row.backupValue}
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground">Pending</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Submit */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border">
        <div className="text-xs text-muted-foreground">
          <strong>{manualCount}</strong> of <strong>{rows.length}</strong> markets ready to publish for {targetDate}.
        </div>
        <div className="flex gap-2">
          {onClose && (
            <button type="button" onClick={onClose} className="btn-compact border border-border text-foreground px-4 py-2">
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={busy || manualCount === 0}
            className="btn-primary flex items-center gap-2 px-5 py-2"
          >
            <Upload className="h-4 w-4" />
            {busy ? "Uploading & Publishing…" : `Upload & Save ${manualCount} Manual Results`}
          </button>
        </div>
      </div>
    </form>
  );
}

