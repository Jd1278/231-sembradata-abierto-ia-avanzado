import type { RiskLevel, SoilType } from "@/types/crops";
import {
  getOfficialAltitude,
  estimateTemperature,
  estimatePrecipitation,
} from "@/components/sembradata/data";
import type { MunicipalityClimateState } from "./climate-state";
import type { AdvancedFilterValues } from "@/components/sembradata/AdvancedFilters";

export interface MapStyleResult {
  fillClass: string;
  opacityClass: string;
  strokeWidth: number;
  strokeColor?: string;
  isCompatible: boolean;
}

export const DEFAULT_ADVANCED_FILTERS: AdvancedFilterValues = {
  altitudeRange: [0, 4000],
  tempRange: [10, 35],
  precipRange: [0, 4000],
  soilType: "all" as SoilType,
};

/**
 * Checks if the user has modified any filter from its default range.
 */
export function hasActiveAdvancedFilters(filters: AdvancedFilterValues): boolean {
  return (
    filters.altitudeRange[0] !== DEFAULT_ADVANCED_FILTERS.altitudeRange[0] ||
    filters.altitudeRange[1] !== DEFAULT_ADVANCED_FILTERS.altitudeRange[1] ||
    filters.tempRange[0] !== DEFAULT_ADVANCED_FILTERS.tempRange[0] ||
    filters.tempRange[1] !== DEFAULT_ADVANCED_FILTERS.tempRange[1] ||
    filters.precipRange[0] !== DEFAULT_ADVANCED_FILTERS.precipRange[0] ||
    filters.precipRange[1] !== DEFAULT_ADVANCED_FILTERS.precipRange[1] ||
    filters.soilType !== DEFAULT_ADVANCED_FILTERS.soilType
  );
}

/**
 * Pure evaluation function checking whether a municipality meets the active filter criteria.
 * Utilizes official altitude, real-time climate state observations when available,
 * or physics-based altitude regressions.
 */
export function isMunicipalityCompatible(
  muni: { name: string; altitude?: number; factor?: number },
  filters: AdvancedFilterValues,
  climateState?: MunicipalityClimateState,
): boolean {
  if (!muni || !filters) return false;

  const rawAlt = muni.altitude ?? getOfficialAltitude(muni.name);
  const alt = Number.isFinite(rawAlt) ? rawAlt : 1000;

  const minAlt = Math.min(filters.altitudeRange[0], filters.altitudeRange[1]);
  const maxAlt = Math.max(filters.altitudeRange[0], filters.altitudeRange[1]);
  if (alt < minAlt || alt > maxAlt) return false;

  const rawTemp = climateState?.climate?.temperature ?? estimateTemperature(alt);
  const temp = Number.isFinite(rawTemp) ? rawTemp : estimateTemperature(alt);
  const minTemp = Math.min(filters.tempRange[0], filters.tempRange[1]);
  const maxTemp = Math.max(filters.tempRange[0], filters.tempRange[1]);
  if (temp < minTemp || temp > maxTemp) return false;

  const rawPrecip = climateState?.climate?.precipitation ?? estimatePrecipitation(alt);
  const precip = Number.isFinite(rawPrecip) ? rawPrecip : estimatePrecipitation(alt);
  const minPrecip = Math.min(filters.precipRange[0], filters.precipRange[1]);
  const maxPrecip = Math.max(filters.precipRange[0], filters.precipRange[1]);
  if (precip < minPrecip || precip > maxPrecip) return false;

  if (filters.soilType !== "all") {
    const soilByAlt: SoilType =
      alt < 800 ? "arcilla" : alt < 1500 ? "franco" : alt < 2200 ? "limo" : "arena";
    if (soilByAlt !== filters.soilType) return false;
  }

  return true;
}

export const RISK_FILL: Record<RiskLevel, string> = {
  Bajo: "fill-risk-low",
  Medio: "fill-risk-med",
  Alto: "fill-risk-high",
  NoData: "fill-muted/70",
};

/**
 * Visual styling hierarchy for map polygons:
 * 1. Selection / Focus highlight
 * 2. Compatibility:
 *    - Incompatible: loses risk color, transitions to muted/neutral gray (NEVER low-risk green).
 *    - Compatible: retains true agroclimatic risk color.
 * 3. Hover state.
 */
export function getMunicipalityMapStyle({
  risk,
  compatible,
  hasActiveFilters,
  selected,
  hovered,
  focused,
}: {
  risk: RiskLevel;
  compatible: boolean;
  hasActiveFilters: boolean;
  selected: boolean;
  hovered: boolean;
  focused: boolean;
}): MapStyleResult {
  const strokeWidth = selected ? 1.6 : focused ? 1.2 : 0.6;
  const strokeColor = selected || focused ? "currentColor" : undefined;

  if (hasActiveFilters && !compatible) {
    return {
      fillClass: "fill-muted/40 dark:fill-muted/25",
      opacityClass: hovered || focused ? "opacity-75" : "opacity-45",
      strokeWidth,
      strokeColor,
      isCompatible: false,
    };
  }

  const fillClass = RISK_FILL[risk] ?? "fill-muted/70";
  const opacityClass = hovered || focused ? "opacity-100" : "opacity-90";

  return {
    fillClass,
    opacityClass,
    strokeWidth,
    strokeColor,
    isCompatible: true,
  };
}
