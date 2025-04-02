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

const ErroneousDataSchema = v.variant("tag", [InvalidConnectionIdSchema]);

export class ProviderCreateJobError extends Error {
  constructor(readonly data: v.InferOutput<typeof ErroneousDataSchema>) {
    super(JSON.stringify(data));
  }
}

const DataSchema = v.variant("tag", [OkSchema, InvalidConnectionIdSchema]);

export const FrameSchema = v.object({
  kind: v.literal("Response"),
  type: v.literal("ProviderCreateJob"),
  id: v.number(),
  data: DataSchema,
});
