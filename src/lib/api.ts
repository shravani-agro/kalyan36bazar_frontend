import axios from "axios";

const isLocal = typeof window !== "undefined" && (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname.startsWith("192.168.")
);
const API_BASE = isLocal ? "https://api.kalyan36bazar.online" : "";
// const API_BASE = "http://localhost:8000";
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

let authListeners: Array<(event: string, session: any) => void> = [];

export const realApi = {
  auth: {
    getSession: async () => {
      try {
        const res = await api.get("/auth/session");
        return { data: res.data, error: null };
      } catch (err: any) {
        return { data: { session: null }, error: err.response?.data || { message: err.message } };
      }
    },
    signInWithPassword: async ({ email, password }: { email: string; password?: string }) => {
      try {
        const res = await api.post("/auth/login", { email, password });
        if (res.data.session) {
          authListeners.forEach((l) => l("SIGNED_IN", res.data.session));
        }
        return { data: res.data, error: res.data.error };
      } catch (err: any) {
        return { data: { session: null }, error: err.response?.data || { message: err.message } };
      }
    },
    signOut: async () => {
      try {
        await api.post("/auth/logout");
        authListeners.forEach((l) => l("SIGNED_OUT", null));
        return { error: null };
      } catch (err: any) {
        return { error: err.response?.data || { message: err.message } };
      }
    },
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
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
    getAll: async (bidDate?: string) => {
      try {
        const res = await api.get("/api/all", {
          params: bidDate ? { bid_date: bidDate } : undefined,
        });
        return { data: res.data, error: null };
      } catch (err: any) {
        return { data: null, error: err.response?.data || { message: err.message } };
      }
    },
    getAllBids: async (bidDate?: string, marketId?: string, limit: number = 500, offset: number = 0) => {
      try {
        const params: any = { limit, offset };
        if (bidDate) params.bid_date = bidDate;
        if (marketId && marketId !== "all") params.market_id = marketId;
        const res = await api.get("/api/bids/all", { params });
        return { data: res.data, error: null };
      } catch (err: any) {
        return { data: null, error: err.response?.data || { message: err.message } };
      }
    },
    getMarkets: async () => {
      try {
        const res = await api.get("/api/markets");
        return { data: res.data, error: null };
      } catch (err: any) {
        return { data: null, error: err.response?.data || { message: err.message } };
      }
    },
    getUsers: async () => {
      try {
        const res = await api.get("/api/users");
        return { data: res.data, error: null };
      } catch (err: any) {
        return { data: null, error: err.response?.data || { message: err.message } };
      }
    },
    getResults: async (resultDate?: string, marketId?: string, limit?: number) => {
      try {
        const params: any = {};
        if (resultDate) params.result_date = resultDate;
        if (marketId && marketId !== "all") params.market_id = marketId;
        if (limit) params.limit = limit;
        const res = await api.get("/api/results", { params });
        return { data: res.data, error: null };
      } catch (err: any) {
        return { data: null, error: err.response?.data || { message: err.message } };
      }
    },
    getPdfResults: async () => {
      try {
        const res = await api.get("/api/get_pdf_results");
        return { data: res.data, error: null };
      } catch (err: any) {
        return { data: null, error: err.response?.data || { message: err.message } };
      }
    },
    declareBulkResults: async (results: any[], allowOverwrite: boolean = true) => {
      try {
        const res = await api.post("/api/create/bulk-results", { results, allow_overwrite: allowOverwrite });
        return { data: res.data, error: null };
      } catch (err: any) {
        return { data: null, error: err.response?.data || { message: err.message } };
      }
    },
    getBidsByDate: async (bidDate?: string, marketId?: string) => {
      try {
        const params: any = {};
        if (bidDate) params.bid_date = bidDate;
        if (marketId && marketId !== "all") params.market_id = marketId;
        const res = await api.get("/api/bids/by-date", { params });
        return { data: res.data, error: null };
      } catch (err: any) {
        return { data: null, error: err.response?.data || { message: err.message } };
      }
    },
    getWinHistory: async (limit: number = 200) => {
      try {
        const res = await api.get("/api/win_history", { params: { limit } });
        return { data: res.data, error: null };
      } catch (err: any) {
        return { data: null, error: err.response?.data || { message: err.message } };
      }
    },
    getSubAdmins: async () => {
      try {
        const res = await api.get("/api/sub_admins");
        return { data: res.data, error: null };
      } catch (err: any) {
        return { data: null, error: err.response?.data || { message: err.message } };
      }
    },
    getActivityLogs: async (limit: number = 100) => {
      try {
        const res = await api.get("/api/activity_logs", { params: { limit } });
        return { data: res.data, error: null };
      } catch (err: any) {
        return { data: null, error: err.response?.data || { message: err.message } };
      }
    },
    getBalanceTransactions: async (limit: number = 200) => {
      try {
        const res = await api.get("/api/balance_transactions", { params: { limit } });
        return { data: res.data, error: null };
      } catch (err: any) {
        return { data: null, error: err.response?.data || { message: err.message } };
      }
    },
    getWithdrawDetails: async (limit: number = 100) => {
      try {
        const res = await api.get("/api/withdraw_details", { params: { limit } });
        return { data: res.data, error: null };
      } catch (err: any) {
        return { data: null, error: err.response?.data || { message: err.message } };
      }
    },
    getAggregatedBids: async (bidDate: string, marketId: string) => {
      try {
        const res = await api.get(`/api/bids/aggregated`, {
          params: { bid_date: bidDate, market_id: marketId },
        });
        return { data: res.data, error: null };
      } catch (err: any) {
        return { data: null, error: err.response?.data || { message: err.message } };
      }
    },
    insert: async (table: string, item: any) => {
      try {
        let endpoint = `/api/${table}`;
        if (table === "app_users") endpoint = "/api/create/users";
        if (table === "markets") endpoint = "/api/create/markets";
        if (table === "sub_admins") endpoint = "/api/create/sub_admins";

        const res = await api.post(endpoint, item);
        return { data: res.data, error: null };
      } catch (err: any) {
        return { data: null, error: err.response?.data || { message: err.message } };
      }
    },
    update: async (table: string, id: string, payload: any) => {
      try {
        const res = await api.patch(`/api/${table}/${id}`, payload);
        return { data: res.data, error: null };
      } catch (err: any) {
        return { data: null, error: err.response?.data || { message: err.message } };
      }
    },
    delete: async (table: string, id: string | number) => {
      try {
        await api.delete(`/api/${table}/${id}`);
        return { error: null };
      } catch (err: any) {
        return { error: err.response?.data || { message: err.message } };
      }
    },
    declareResult: async (payload: any) => {
      try {
        const res = await api.post("/api/create/result", payload);
        return { data: res.data, error: null };
      } catch (err: any) {
        return { data: null, error: err.response?.data || { message: err.message } };
      }
    },
    testNotification: async (token?: string) => {
      try {
        const res = await api.post("/api/test-notification", {
          title: "Test Notification",
          body: "This is a test notification from Kalyan 36 Bazar Admin console.",
          token: token
        });
        return { data: res.data, error: null };
      } catch (err: any) {
        return { data: null, error: err.response?.data || { message: err.message } };
      }
    },
  },
};
