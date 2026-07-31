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

export async function saveAnalysis(
  municipio: string,
  departamento: string,
  cultivo: CropKey,
  lat: number,
  lng: number,
  viability: ViabilityResult,
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    saveAnalysisLocal(municipio, departamento, cultivo, lat, lng, viability);
    return true;
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
    });
    if (error) throw error;
    return true;
  } catch {
    saveAnalysisLocal(municipio, departamento, cultivo, lat, lng, viability);
    return false;
  }
}

export async function getAnalysisHistory(): Promise<AnalysisRecord[]> {
  if (!isSupabaseConfigured()) {
    return getAnalysisHistoryLocal();
  }

  try {
    const { data, error } = await supabase
      .from("analysis_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data ?? []) as AnalysisRecord[];
  } catch {
    return getAnalysisHistoryLocal();
  }
}

export async function deleteAnalysis(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    deleteAnalysisLocal(id);
    return true;
  }

  try {
    const { error } = await supabase.from("analysis_history").delete().eq("id", id);
    if (error) throw error;
    return true;
  } catch {
    deleteAnalysisLocal(id);
    return false;
  }
}

// Local fallback using localStorage
const LOCAL_KEY = "sembraData:analysisHistory";

interface LocalAnalysis {
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

function saveAnalysisLocal(
  municipio: string,
  departamento: string,
  cultivo: CropKey,
  lat: number,
  lng: number,
  viability: ViabilityResult,
) {
  try {
    const existing = getAnalysisHistoryLocal();
    const record: LocalAnalysis = {
      id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      municipio,
      departamento,
      cultivo,
      lat,
      lng,
      score: viability.score,
      viable: viability.viable,
      recommendations: viability.recommendations,
      confidence: viability.confidence,
      pestRiskLevel: viability.pestRisk.level,
      created_at: new Date().toISOString(),
    };
    existing.unshift(record);
    const trimmed = existing.slice(0, 100);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore
  }
}

function getAnalysisHistoryLocal(): AnalysisRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function deleteAnalysisLocal(id: string) {
  try {
    const existing = getAnalysisHistoryLocal().filter((a) => a.id !== id);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(existing));
  } catch {
    // ignore
  }
}
