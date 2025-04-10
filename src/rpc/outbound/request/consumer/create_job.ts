import * as v from "valibot";

export const ConsumerCreateJobDataSchema = v.object({
  offer_snapshot_id: v.number(),
  currency: v.number(),
  job_args: v.optional(v.string()),
});

export type ConsumerCreateJobData = v.InferInput<
  typeof ConsumerCreateJobDataSchema
>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("ConsumerCreateJob"),
  id: v.number(),
  data: ConsumerCreateJobDataSchema,
});
