import { createClient } from "./supabase/client";

export type ReportTargetType = "recipe" | "cook_photo";

export type ReportReason =
  | "inappropriate"
  | "spam"
  | "misleading"
  | "copyright"
  | "other";

export interface SubmitReportParams {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details?: string;
}

export interface ContentReportItem {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details: string;
  status: "pending" | "resolved" | "dismissed";
  createdAt: string;
}

/**
 * Submit a community content report.
 * Requires authenticated user. Duplicate reports for the same user + target are rejected gracefully.
 */
export async function submitContentReport(params: SubmitReportParams): Promise<{ success: boolean; message: string }> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: "You must be signed in to report content.",
    };
  }

  // Rate limiting check: max 5 reports in last 24h per user
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("content_reports")
    .select("id", { count: "exact", head: true })
    .eq("reporter_id", user.id)
    .gte("created_at", oneDayAgo);

  if ((count ?? 0) >= 5) {
    return {
      success: false,
      message: "Daily report limit reached. Thank you for your vigilance.",
    };
  }

  // Recipes must be public and cannot belong to the reporting user
  if (params.targetType === "recipe") {
    const { data: recipe } = await supabase
      .from("recipes")
      .select("is_public, user_id")
      .eq("id", params.targetId)
      .single();

    if (recipe) {
      if (!recipe.is_public) {
        return {
          success: false,
          message: "Private recipes cannot be reported.",
        };
      }
      if (recipe.user_id && recipe.user_id === user.id) {
        return {
          success: false,
          message: "You cannot report your own recipe.",
        };
      }
    }
  }

  const { error } = await supabase.from("content_reports").insert({
    reporter_id: user.id,
    target_type: params.targetType,
    target_id: params.targetId,
    reason: params.reason,
    details: (params.details || "").trim(),
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") {
      // Unique constraint violation: already reported
      return {
        success: true,
        message: "You have already submitted a report for this item. Our safety system is reviewing it.",
      };
    }
    console.error("Failed to submit content report:", error.message || error.details || error);
    return {
      success: false,
      message: error.message || "Could not submit report. Please try again later.",
    };
  }

  return {
    success: true,
    message: "Thank you for letting us know. Our safety system will review this content.",
  };
}

/**
 * Check if the currently signed-in user has already submitted a report for this item.
 */
export async function hasUserReported(
  targetType: ReportTargetType,
  targetId: string
): Promise<boolean> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data } = await supabase
    .from("content_reports")
    .select("id")
    .eq("reporter_id", user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();

  return Boolean(data);
}
