import * as v from "valibot";

const DataSchema = v.object({
  database_job_id: v.number(),
  balance_delta: v.nullable(v.string()),
  public_payload: v.string(),
  private_payload: v.optional(v.string()),
});

export type ProviderCompleteJobData = v.InferOutput<typeof DataSchema>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("ProviderCompleteJob"),
  id: v.number(),
  data: DataSchema,
});
