import * as v from "valibot";

const DataSchema = v.object({
  database_job_id: v.number(),
});

export type ConsumerConfirmJobCompletionData = v.InferOutput<typeof DataSchema>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("ConsumerConfirmJobCompletion"),
  id: v.number(),
  data: DataSchema,
});
