import * as v from "valibot";

const OkSchema = v.object({
  tag: v.literal("Ok"),

  content: v.object({
    database_job_id: v.number(),
    provider_job_id: v.string(),
    created_at_sync: v.number(),
  }),
});

const InvalidConnectionIdSchema = v.object({
  tag: v.literal("InvalidConnectionId"),
});

const ErrorSchema = v.variant("tag", [InvalidConnectionIdSchema]);

export class ProviderCreateJobError extends Error {
  constructor(
    readonly tag: v.InferOutput<typeof ErrorSchema>["tag"],
    message?: string
  ) {
    super(message);
  }
}

const DataSchema = v.variant("tag", [OkSchema, InvalidConnectionIdSchema]);

export const FrameSchema = v.object({
  kind: v.literal("Response"),
  type: v.literal("ProviderCreateJob"),
  id: v.number(),
  data: DataSchema,
});
