import * as v from "valibot";

const OkSchema = v.object({
  tag: v.literal("Ok"),
  content: v.object({ completed_at_sync: v.number() }),
});

const InvalidJobIdSchema = v.object({
  tag: v.literal("InvalidJobId"),
});

const AlreadyCompletedSchema = v.object({
  tag: v.literal("AlreadyCompleted"),
  content: v.object({ completed_at_sync: v.number() }),
});

const AlreadyFailedSchema = v.object({
  tag: v.literal("AlreadyFailed"),
});

const InvalidBalanceDeltaSchema = v.object({
  tag: v.literal("InvalidBalanceDelta"),
  content: v.object({ message: v.string() }),
});

const ErrorSchema = v.variant("tag", [
  InvalidJobIdSchema,
  AlreadyFailedSchema,
  InvalidBalanceDeltaSchema,
]);

export class ProviderCompleteJobError extends Error {
  constructor(
    readonly tag: v.InferOutput<typeof ErrorSchema>["tag"],
    message?: string
  ) {
    super(message);
  }
}

const DataSchema = v.variant("tag", [
  OkSchema,
  InvalidJobIdSchema,
  AlreadyCompletedSchema,
  AlreadyFailedSchema,
  InvalidBalanceDeltaSchema,
]);

export const FrameSchema = v.object({
  kind: v.literal("Response"),
  type: v.literal("ProviderCompleteJob"),
  id: v.number(),
  data: DataSchema,
});
