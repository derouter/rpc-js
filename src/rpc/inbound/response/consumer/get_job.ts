import * as v from "valibot";

const OkSchema = v.object({
  tag: v.literal("Ok"),
  content: v.object({
    public_payload: v.nullish(v.string()),
    balance_delta: v.nullish(v.string()),
    created_at_sync: v.number(),
    completed_at_sync: v.nullish(v.number()),
  }),
});

const ProviderUnreacheableSchema = v.object({
  tag: v.literal("ProviderUnreacheable"),
});

const JobNotFoundSchema = v.object({
  tag: v.literal("JobNotFound"),
});

const ErroneousDataSchema = v.variant("tag", [
  JobNotFoundSchema,
  ProviderUnreacheableSchema,
]);

export class ConsumerGetJobError extends Error {
  constructor(readonly data: v.InferOutput<typeof ErroneousDataSchema>) {
    super(JSON.stringify(data));
  }
}

const DataSchema = v.variant("tag", [
  OkSchema,
  JobNotFoundSchema,
  ProviderUnreacheableSchema,
]);

export const FrameSchema = v.object({
  kind: v.literal("Response"),
  type: v.literal("ConsumerGetJob"),
  id: v.number(),
  data: DataSchema,
});
