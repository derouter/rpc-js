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

const ErroneousDataSchema = v.variant("tag", [
  InvalidJobIdSchema,
  AlreadyCompletedSchema,
]);

export class ConsumerFailJobError extends Error {
  constructor(readonly data: v.InferOutput<typeof ErroneousDataSchema>) {
    super(JSON.stringify(data));
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
  type: v.literal("ConsumerFailJob"),
  id: v.number(),
  data: DataSchema,
});
