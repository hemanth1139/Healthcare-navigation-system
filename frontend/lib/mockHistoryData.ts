import { HistoryItem, HistoryTypeFilter, HistoryDateRange } from "@/types/history";

export const MOCK_HISTORY_ITEMS: HistoryItem[] = [];

export const historyApi = {
  getHistory: async (
    typeFilter: HistoryTypeFilter = "All",
    dateRange: HistoryDateRange = "all"
  ): Promise<HistoryItem[]> => {
    let results = [...MOCK_HISTORY_ITEMS];

    if (typeFilter !== "All") {
      results = results.filter((item) => item.type === typeFilter);
    }

    if (dateRange === "7d") {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      results = results.filter((item) => new Date(item.timestamp) >= cutoff);
    } else if (dateRange === "30d") {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      results = results.filter((item) => new Date(item.timestamp) >= cutoff);
    }

    return results;
  },

  getHistoryItem: async (id: string): Promise<HistoryItem | null> => {
    return MOCK_HISTORY_ITEMS.find((item) => item.id === id) || null;
  },
};
