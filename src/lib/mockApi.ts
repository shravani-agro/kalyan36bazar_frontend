import { toast } from "sonner";

// Mock types to match the database structure
export type AppUser = {
  id: string;
  name: string;
  phone: string;
  password?: string;
  commission: number;
  created_at: string;
  updated_at?: string;
};

export type Market = {
  id: string;
  market_name: string;

  open_time: string;
  created_at: string;
};

export type WithdrawDetail = {
  id: string;
  app_user_id: string | null;
  user_name: string;
  account_holder_name: string;
  upi_name: string | null;
  account_number: string;
  ifsc_code: string;
  upi_id: string | null;
  created_at: string;
};

export type ResultRecord = {
  id: string;
  result_date: string;
  market_id: string;
  open_pana: string;
  open_digit: number;
  created_at: string;
};

export type Bid = {
  id: string;
  app_user_id: string;
  market_id: string;
  bid_date: string;
  bid_type: "single_digit" | "single_pana" | "double_pana" | "triple_pana";
  number_played: string;
  amount: number;
  status: "pending" | "won" | "lost" | "cancelled";
  created_at: string;
};

export type WinHistory = {
  id: string;
  market_id: string | null;
  app_user_id: string | null;
  market_name: string;
  winner_name: string;
  winner_phone: string;
  amount: number;
  number_played: string;
  win_amount: number;
  created_at: string;
};

export type MarketRecord = {
  date: string;
  market_id: string;
  market_name: string;
  total_bids: number;
  total_bid_amount: number;
  single_digit_0: number;
  single_digit_1: number;
  single_digit_2: number;
  single_digit_3: number;
  single_digit_4: number;
  single_digit_5: number;
  single_digit_6: number;
  single_digit_7: number;
  single_digit_8: number;
  single_digit_9: number;
  single_pana: number;
  double_pana: number;
  triple_pana: number;
  single_pana_display?: string;
  double_pana_display?: string;
  triple_pana_display?: string;
};


export type BalanceTransaction = {
  id: string;
  app_user_id: string;
  transaction_type: "add" | "deduct" | "deposit" | "withdraw" | "bonus" | "win" | "bid";
  amount: number;
  reason: string | null;
  balance_before: number;
  balance_after: number;
  created_at: string;
};

export type ActivityLog = {
  id: string;
  app_user_id: string | null;
  admin_id: string | null;
  action_type: string;
  description: string;
  ip_address: string | null;
  device_info: string | null;
  created_at: string;
};

export type Session = { user: { id: string; email: string } } | null;


const STORAGE_KEY = "kalyan36bazar_admin_data";

interface StorageData {
  app_users: AppUser[];
  markets: Market[];

  results: ResultRecord[];
  bids: Bid[];
  win_history: WinHistory[];
  balance_transactions: BalanceTransaction[];
  market_bid_records: MarketRecord[];
  activity_logs: ActivityLog[];
  session: Session;
}

const initialData: StorageData = {
  app_users: [],
  markets: [],

  results: [],
  bids: [],
  win_history: [],
  balance_transactions: [],
  market_bid_records: [],
  activity_logs: [],
  session: null,
};

const getStorage = (): StorageData => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return initialData;
  try {
    return JSON.parse(data);
  } catch {
    return initialData;
  }
};

const setStorage = (data: StorageData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

let authListeners: Array<(event: string, session: Session) => void> = [];

export const mockApi = {
  auth: {
    getSession: async () => {
      const data = getStorage();
      return { data: { session: data.session }, error: null };
    },
    signInWithPassword: async ({ email, password }: { email: string; password?: string }) => {
      if (email === "admin" && password === "admin") {
        const data = getStorage();
        const session = { user: { id: "admin-id", email: "admin@local" } };
        data.session = session;
        setStorage(data);
        authListeners.forEach((l) => l("SIGNED_IN", session));
        return { data: { session }, error: null };
      }
      return { data: { session: null }, error: { message: "Invalid credentials" } };
    },
    signUp: async () => {
      return { data: { session: null }, error: { message: "Sign up is disabled" } };
    },
    signOut: async () => {
      const data = getStorage();
      data.session = null;
      setStorage(data);
      authListeners.forEach((l) => l("SIGNED_OUT", null));
      return { error: null };
    },
    onAuthStateChange: (callback: (event: string, session: Session) => void) => {
      authListeners.push(callback);
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              authListeners = authListeners.filter((l) => l !== callback);
            },
          },
        },
      };
    },
  },

  db: {
    getAll: async () => {
      return { data: getStorage(), error: null };
    },
    insert: async (table: keyof Omit<StorageData, "session">, item: any) => {
      const data = getStorage();
      const newItem = {
        ...item,
        id: item.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)),
        created_at: new Date().toISOString(),
      };
      (data[table] as any[]).push(newItem);
      setStorage(data);
      return { data: newItem, error: null };
    },
    update: async (table: keyof Omit<StorageData, "session">, id: string, payload: any) => {
      const data = getStorage();
      const index = (data[table] as any[]).findIndex((i) => i.id === id);
      if (index === -1) return { error: { message: "Not found" } };
      data[table][index] = { ...data[table][index], ...payload, updated_at: new Date().toISOString() };
      setStorage(data);
      return { data: data[table][index], error: null };
    },
    delete: async (table: keyof Omit<StorageData, "session">, id: string) => {
      const data = getStorage();
      data[table] = (data[table] as any[]).filter((i) => i.id !== id) as any;
      setStorage(data);
      return { error: null };
    },
  },
};
