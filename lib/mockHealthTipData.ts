import { HealthTip, HealthTipCategory } from "@/types/healthTip";

const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const MOCK_HEALTH_TIPS: HealthTip[] = [
  {
    tip_id: "tip_01",
    title: "Monsoon Hydration & Waterborne Illness Prevention",
    category: "Seasonal",
    icon_type: "water",
    read_time: "2 min read",
    summary:
      "During monsoon months, tap and municipal water supplies carry a higher risk of waterborne pathogens. Always boil water for at least 5 minutes before drinking.",
    full_content:
      "Monsoon rain runoff often contaminates municipal water lines and local wells with pathogens causing typhoid, cholera, and gastroenteritis. Ensure your drinking water is boiled for at least 5 minutes or passed through a certified RO/UV purifier. Avoid consuming unwashed raw salads or cut fruits from street vendors during the rainy season.",
  },
  {
    tip_id: "tip_02",
    title: "Managing High Humidity Heat Exhaustion in Summer",
    category: "Seasonal",
    icon_type: "sun",
    read_time: "2 min read",
    summary:
      "High ambient humidity restricts sweat evaporation, increasing core body heat fast. Replenish electrolytes using homemade ORS or nimbu pani regularly.",
    full_content:
      "In coastal and tropical summer climates, high humidity stops body sweat from cooling you down effectively. Sip homemade ORS (1 liter water + 6 tsp sugar + 1/2 tsp salt) or fresh coconut water throughout outdoor daytime activities. If experiencing dizziness, cold sweat, or muscle cramps, rest immediately in a shaded, ventilated area.",
  },
  {
    tip_id: "tip_03",
    title: "Glycemic Control & Meal Timing for Type 2 Diabetes",
    category: "Chronic Condition Management",
    target_condition: "Diabetes",
    icon_type: "apple",
    read_time: "3 min read",
    summary:
      "Replacing high-GI refined grains with whole millets (Ragi, Jowar) helps stabilize post-meal glucose spikes and supports sustained daily energy.",
    full_content:
      "Refined white rice and maida digest rapidly, causing steep postprandial blood sugar spikes. Incorporating whole millets like Foxtail, Jowar, or Bajra alongside high-fiber leafy vegetables delays glucose absorption. Pair carbohydrates with lean protein (dal, paneer, fish) and maintain consistent meal intervals every 4 hours.",
  },
  {
    tip_id: "tip_04",
    title: "Sodium Reduction Strategies for Blood Pressure Management",
    category: "Chronic Condition Management",
    target_condition: "Hypertension",
    icon_type: "heart",
    read_time: "2 min read",
    summary:
      "Limiting daily dietary sodium intake below 2,000 mg (approx 1 teaspoon of table salt) significantly reduces arterial pressure and strain on cardiac tissue.",
    full_content:
      "Excess salt intake causes fluid retention in blood vessels, forcing your heart to pump harder. Reduce consumption of high-sodium papads, commercial pickles, packaged namkeens, and instant noodles. Flavor home-cooked dishes using natural herbs, lemon juice, roasted cumin, and garlic instead of adding extra table salt.",
  },
  {
    tip_id: "tip_05",
    title: "Daily 30-Minute Aerobic Walking Routine",
    category: "General Wellness",
    icon_type: "activity",
    read_time: "1 min read",
    summary:
      "Brisk walking for 30 minutes 5 days a week improves insulin sensitivity, lowers resting heart rate, and elevates natural mood endorphins.",
    full_content:
      "Consistent moderate-intensity physical activity is one of the most effective preventive health interventions. A brisk 30-minute walk—split into two 15-minute sessions if needed—improves vascular compliance, reduces LDL cholesterol, and aids sleep quality without causing high-impact joint stress.",
  },
  {
    tip_id: "tip_06",
    title: "Ergonomic Neck & Shoulder Relief for Desk Workers",
    category: "General Wellness",
    icon_type: "shield",
    read_time: "2 min read",
    summary:
      "Prolonged screen posture strain leads to chronic tension-type headaches and cervical stiffness. Perform gentle chin tucks every 45 minutes.",
    full_content:
      "Forward head posture places up to 27 kg of extra weight strain on cervical spine muscles. Adjust your computer display to eye level and keep elbows supported at 90 degrees. Take a 60-second posture break every 45 minutes to stretch neck levator muscles and rest your eyes from digital glare.",
  },
  {
    tip_id: "tip_07",
    title: "Gut Microbiome Health & Probiotic Foods",
    category: "Nutrition",
    icon_type: "apple",
    read_time: "2 min read",
    summary:
      "Consuming traditional fermented foods like homemade curd (dahi) and buttermilk (chaas) fosters diverse gut microbiota beneficial for immunity.",
    full_content:
      "A healthy gut microbiome aids nutrient absorption, regulates gastrointestinal motility, and synthesizes short-chain fatty acids. Include a small bowl of fresh homemade curd or spiced buttermilk with roasted cumin seed after lunch to nourish beneficial Lactobacillus bacteria strains.",
  },
  {
    tip_id: "tip_08",
    title: " Dengue & Vector-Borne Mosquito Protection",
    category: "Seasonal",
    icon_type: "shield",
    read_time: "2 min read",
    summary:
      "Aedes mosquitoes that spread Dengue bite primarily during daytime hours. Prevent stagnant water accumulation around flowerpots and coolers.",
    full_content:
      "Dengue virus transmission surges during post-monsoon months. Aedes aegypti mosquitoes breed in clean, stagnant water inside homes and balconies. Inspect water trays under refrigerators, AC drainage buckets, and plant pots weekly. Wear long-sleeved light clothing and apply neem-based or DEET mosquito repellent during morning and dusk hours.",
  },
];

export const healthTipApi = {
  getTips: async (
    categoryFilter: HealthTipCategory | "All" = "All",
    userHasChronicCondition: boolean = true
  ): Promise<HealthTip[]> => {
    await delay(250);
    let results = [...MOCK_HEALTH_TIPS];

    if (categoryFilter !== "All") {
      results = results.filter((t) => t.category === categoryFilter);
    }

    return results;
  },
};
