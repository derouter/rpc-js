import * as v from "valibot";

const DataSchema = v.object({
  database_job_id: v.number(),
  provider_job_id: v.string(),
  private_payload: v.optional(v.string()),
  created_at_sync: v.number(),
});

export type ConsumerSyncJobData = v.InferOutput<typeof DataSchema>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("ConsumerSyncJob"),
  id: v.number(),
  data: DataSchema,
});
