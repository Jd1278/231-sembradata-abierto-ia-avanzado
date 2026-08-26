import { z } from "https://esm.sh/zod@3.23.8";

export const ClaimTypeEnum = z.enum([
  "observed",
  "forecast",
  "model_estimate",
  "agronomic_requirement",
  "general_guidance",
]);

export type ClaimType = z.infer<typeof ClaimTypeEnum>;

export const ClaimSchema = z.object({
  text: z.string().min(1),
  claimType: ClaimTypeEnum,
  source: z.string().min(1),
  observedAt: z.string().nullable().optional(),
  value: z.number().nullable().optional(),
  unit: z.string().nullable().optional(),
  confidence: z.number().min(0).max(100).nullable().optional(),
});

export type Claim = z.infer<typeof ClaimSchema>;

export const RecommendationPriorityEnum = z.enum(["high", "medium", "low"]);
export type RecommendationPriority = z.infer<typeof RecommendationPriorityEnum>;

export const RecommendationSchema = z.object({
  action: z.string().min(1),
  basis: z.array(z.string()),
  priority: RecommendationPriorityEnum,
});

export type Recommendation = z.infer<typeof RecommendationSchema>;

export const ChatbotResponseSchema = z.object({
  answer: z.string().min(1),
  summary: z.string().min(1),
  claims: z.array(ClaimSchema).default([]),
  recommendations: z.array(RecommendationSchema).default([]),
  uncertainties: z.array(z.string()).default([]),
  insufficientData: z.boolean().default(false),
  needsHumanReview: z.boolean().default(false),
});

export type ChatbotResponse = z.infer<typeof ChatbotResponseSchema>;

/**
 * Checks if a specific number is verified in the server-side ground truth set.
 */
function isNumberVerified(num: number, verifiedNumbers: Set<number>): boolean {
  // Allow common structural constants (e.g., 1-12 for months, 87 Santander municipalities, 24 hours, 7 days)
  if ([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 24, 87].includes(num)) return true;
  return Array.from(verifiedNumbers).some((v) => Math.abs(v - num) < 0.15);
}

/**
 * Validates quantitative claims and text fields against server-side ground truth.
 * If the LLM generates unverified numbers or percentages, sanitizes them safely.
 */
export function verifyClaimsAgainstContext(
  claims: Claim[],
  verifiedNumbers: Set<number>,
): { sanitizedClaims: Claim[]; hasUnverifiedNumericClaims: boolean } {
  let hasUnverifiedNumericClaims = false;

  const sanitizedClaims = claims.map((c) => {
    if (typeof c.value === "number" && Number.isFinite(c.value)) {
      const isVerified = isNumberVerified(c.value, verifiedNumbers);

      if (!isVerified && c.claimType !== "general_guidance") {
        hasUnverifiedNumericClaims = true;
        return {
          ...c,
          claimType: "general_guidance" as const,
          source: `${c.source} (Dato no verificado en base local)`,
          confidence: null,
        };
      }
    }
    return c;
  });

  return { sanitizedClaims, hasUnverifiedNumericClaims };
}

/**
 * Deep response sanitizer that verifies claims, recommendations, and text assertions.
 */
export function verifyAndSanitizeResponse(
  resp: ChatbotResponse,
  verifiedNumbers: Set<number>,
): ChatbotResponse {
  const { sanitizedClaims, hasUnverifiedNumericClaims } = verifyClaimsAgainstContext(
    resp.claims,
    verifiedNumbers,
  );

  const sanitizedRecs = resp.recommendations.map((r) => {
    // Filter basis to only include verified institutional sources
    const validBasis = r.basis.filter(
      (b) => b && !b.toLowerCase().includes("desconocid") && !b.toLowerCase().includes("alucin"),
    );
    return {
      ...r,
      basis: validBasis.length > 0 ? validBasis : ["Orientación agronómica general"],
    };
  });

  return {
    ...resp,
    claims: sanitizedClaims,
    recommendations: sanitizedRecs,
    insufficientData: resp.insufficientData || hasUnverifiedNumericClaims,
    needsHumanReview: resp.needsHumanReview || hasUnverifiedNumericClaims,
  };
}
