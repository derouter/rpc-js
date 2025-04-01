import * as v from "valibot";

export const ConsumerConfigSchema = v.object({});
export type ConsumerConfig = v.InferOutput<typeof ConsumerConfigSchema>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("ConsumerConfig"),
  id: v.number(),
  data: ConsumerConfigSchema,
});
