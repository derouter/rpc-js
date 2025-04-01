import * as v from "valibot";

const OkSchema = v.object({
  tag: v.literal("Ok"),
});

const InvalidJobIdSchema = v.object({
  tag: v.literal("InvalidJobId"),
});

const AlreadyCompletedSchema = v.object({
  tag: v.literal("AlreadyCompleted"),
});

const AlreadyFailedSchema = v.object({
  tag: v.literal("AlreadyFailed"),
});

const ErrorSchema = v.variant("tag", [
  InvalidJobIdSchema,
  AlreadyCompletedSchema,
]);

export class ProviderFailJobError extends Error {
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
]);

export const FrameSchema = v.object({
  kind: v.literal("Response"),
  type: v.literal("ProviderFailJob"),
  id: v.number(),
  data: DataSchema,
});
