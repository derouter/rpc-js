import * as v from "valibot";

const OkSchema = v.object({
  tag: v.literal("Ok"),
  content: v.object({ database_job_id: v.number() }),
});

const ConnectionNotFoundSchema = v.object({
  tag: v.literal("ConnectionNotFound"),
});

const ProviderJobIdUniquenessSchema = v.object({
  tag: v.literal("ProviderJobIdUniqueness"),
});

const ErrorSchema = v.variant("tag", [
  ConnectionNotFoundSchema,
  ProviderJobIdUniquenessSchema,
]);

export class ConsumerCreateJobError extends Error {
  constructor(
    readonly tag: v.InferOutput<typeof ErrorSchema>["tag"],
    message?: string
  ) {
    super(message);
  }
}

const DataSchema = v.variant("tag", [
  OkSchema,
  ConnectionNotFoundSchema,
  ProviderJobIdUniquenessSchema,
]);

export const FrameSchema = v.object({
  kind: v.literal("Response"),
  type: v.literal("ConsumerCreateJob"),
  id: v.number(),
  data: DataSchema,
});
