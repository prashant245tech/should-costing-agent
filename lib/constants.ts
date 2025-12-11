export const CHART_COLORS = {
  rawMaterial: "#3b82f6", // Blue
  conversion: "#8b5cf6",   // Purple
  labor: "#10b981",        // Green
  packing: "#f59e0b",      // Amber
  overhead: "#ef4444",     // Red
  margin: "#6b7280",       // Gray
  total: "#0f172a",        // Slate-900
};

export const EX_WORKS_COLORS_ARRAY = [
  CHART_COLORS.rawMaterial, // Raw Material
  CHART_COLORS.conversion,  // Conversion
  CHART_COLORS.labor,       // Labour
  CHART_COLORS.packing,     // Packing
  CHART_COLORS.overhead,    // Overhead
  CHART_COLORS.margin,      // Margin
];

export const PIE_CHART_COLORS = [
  CHART_COLORS.rawMaterial,
  CHART_COLORS.labor,
  CHART_COLORS.packing // Using Amber as third color (formerly yellow-ish)
];
