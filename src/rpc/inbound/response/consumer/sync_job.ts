import * as v from "valibot";

const OkSchema = v.object({
  tag: v.literal("Ok"),
});

const InvalidJobIdSchema = v.object({
  tag: v.literal("InvalidJobId"),
});

const AlreadySyncedSchema = v.object({
  tag: v.literal("AlreadySynced"),
});

const ProviderJobIdUniquenessSchema = v.object({
  tag: v.literal("ProviderJobIdUniqueness"),
});

const ErroneousDataSchema = v.variant("tag", [
  InvalidJobIdSchema,
  AlreadySyncedSchema,
  ProviderJobIdUniquenessSchema,
]);

export class ConsumerSyncJobError extends Error {
  constructor(readonly data: v.InferOutput<typeof ErroneousDataSchema>) {
    super(JSON.stringify(data));
  }
}

const DataSchema = v.variant("tag", [
  OkSchema,
  InvalidJobIdSchema,
  AlreadySyncedSchema,
  ProviderJobIdUniquenessSchema,
]);

export const FrameSchema = v.object({
  kind: v.literal("Response"),
  type: v.literal("ConsumerSyncJob"),
  id: v.number(),
  data: DataSchema,
});
