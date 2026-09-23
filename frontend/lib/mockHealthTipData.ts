import { HealthTip, HealthTipCategory } from "@/types/healthTip";
import { api, USE_MOCK_API } from "./api";

export const MOCK_HEALTH_TIPS: HealthTip[] = [];

export const healthTipApi = {
  getTips: async (
    categoryFilter: HealthTipCategory | "All" = "All",
    _userHasChronicCondition: boolean = true
  ): Promise<HealthTip[]> => {
    let results: HealthTip[] = [];

    if (!USE_MOCK_API) {
      try {
        const { data } = await api.get("/tips/daily");
        if (Array.isArray(data)) {
          results = data.map((tip: any, index: number) => ({
            tip_id: tip.tip_id || `tip_${index + 1}`,
            title: tip.title || "Health Recommendation",
            category: (tip.category as HealthTipCategory) || "General Wellness",
            target_condition: tip.target_condition,
            icon_type: tip.icon_type || "shield",
            read_time: tip.read_time || "2 min read",
            summary: tip.recommendation || tip.summary || tip.content || tip.description || "",
            full_content: tip.full_content || tip.content || tip.recommendation || tip.summary || "",
          }));
        }
      } catch (err) {
        console.warn("[API] Failed to fetch tips from /tips/daily:", err);
      }
    }

    if (results.length === 0) {
      results = [...MOCK_HEALTH_TIPS];
    }

    if (categoryFilter !== "All") {
      results = results.filter((t) => t.category === categoryFilter);
    }

    return results;
  },
};
