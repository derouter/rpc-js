import * as v from "valibot";

const OkSchema = v.object({
  tag: v.literal("Ok"),
  content: v.number(),
});

const InvalidPeerIdSchema = v.object({
  tag: v.literal("InvalidPeerId"),
  content: v.string(),
});

const ErroneousDataSchema = v.variant("tag", [InvalidPeerIdSchema]);

export class SubscribeToJobsError extends Error {
  constructor(readonly data: v.InferOutput<typeof ErroneousDataSchema>) {
    super(JSON.stringify(data));
  }
}

const DataSchema = v.variant("tag", [OkSchema, InvalidPeerIdSchema]);

export const FrameSchema = v.object({
  kind: v.literal("Response"),
  type: v.literal("SubscribeToJobs"),
  id: v.number(),
  data: DataSchema,
});
