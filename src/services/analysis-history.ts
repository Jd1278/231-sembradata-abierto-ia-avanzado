import { isSupabaseConfigured, supabase } from "./supabase";
import type { CropKey } from "@/types/crops";
import type { ViabilityResult } from "@/types/prediction-v2";

export interface AnalysisRecord {
  id: string;
  municipio: string;
  departamento: string;
  cultivo: CropKey;
  lat: number;
  lng: number;
  score: number;
  viable: boolean;
  recommendations: string[];
  confidence: number;
  pestRiskLevel: string;
  created_at: string;
}

export interface AnalysisOperationResult {
  ok: boolean;
  error?: string;
}

/**
 * Persists an agronomic analysis record to Supabase.
 * Strictly requires active database connection (no offline localStorage fallback).
 */
export async function saveAnalysis(
  municipio: string,
  departamento: string,
  cultivo: CropKey,
  lat: number,
  lng: number,
  viability: ViabilityResult,
): Promise<AnalysisOperationResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Servicio de persistencia no configurado" };
  }

  try {
    const { error } = await supabase.from("analysis_history").insert({
      municipio,
      departamento,
      cultivo,
      lat,
      lng,
      score: viability.score,
      viable: viability.viable,
      recommendations: viability.recommendations,
      confidence: viability.confidence,
      pest_risk_level: viability.pestRisk.level,
    });

    if (error) {
      console.warn("[AnalysisHistory] Failed to insert analysis record:", error.message);
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error de red";
    console.warn("[AnalysisHistory] Exception saving analysis:", msg);
    return { ok: false, error: msg };
  }
}

/**
 * Retrieves persisted analyses from Supabase.
 * Returns empty array with clean error logging if connection is unavailable.
 */
export async function getAnalysisHistory(): Promise<AnalysisRecord[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("analysis_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.warn("[AnalysisHistory] Error fetching history:", error.message);
      return [];
    }

    return (data ?? []) as AnalysisRecord[];
  } catch (err) {
    console.warn("[AnalysisHistory] Network error fetching history:", err);
    return [];
  }
}

/**
 * Deletes an analysis record from Supabase.
 */
export async function deleteAnalysis(id: string): Promise<AnalysisOperationResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Servicio de persistencia no configurado" };
  }

  try {
    const { error } = await supabase.from("analysis_history").delete().eq("id", id);
    if (error) {
      console.warn("[AnalysisHistory] Error deleting analysis:", error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error de red";
    return { ok: false, error: msg };
  }
}
