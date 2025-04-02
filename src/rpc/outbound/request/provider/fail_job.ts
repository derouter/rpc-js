import * as v from "valibot";

const DataSchema = v.object({
  database_job_id: v.number(),
  reason: v.string(),
  reason_class: v.optional(v.number()),
  private_payload: v.optional(v.string()),
});

export type ProviderFailJobData = v.InferOutput<typeof DataSchema>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("ProviderFailJob"),
  id: v.number(),
  data: DataSchema,
});
