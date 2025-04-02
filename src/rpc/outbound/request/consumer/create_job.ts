import * as v from "valibot";

const DataSchema = v.object({
  connection_id: v.number(),
  private_payload: v.optional(v.string()),
});

export type ConsumerCreateJobData = v.InferOutput<typeof DataSchema>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("ConsumerCreateJob"),
  id: v.number(),
  data: DataSchema,
});
