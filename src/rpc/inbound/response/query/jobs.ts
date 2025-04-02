import * as v from "valibot";
import { JobRecordSchema } from "../../dto.js";

const OkSchema = v.object({
  tag: v.literal("Ok"),
  content: v.array(JobRecordSchema),
});

const InvalidPeerIdSchema = v.object({
  tag: v.literal("InvalidPeerId"),
  content: v.string(),
});

const InvalidLimitSchema = v.object({
  tag: v.literal("InvalidLimit"),
  content: v.string(),
});

const ErroneousDataSchema = v.variant("tag", [
  InvalidPeerIdSchema,
  InvalidLimitSchema,
]);

export class QueryJobsError extends Error {
  constructor(readonly data: v.InferOutput<typeof ErroneousDataSchema>) {
    super(JSON.stringify(data));
  }
}

const DataSchema = v.variant("tag", [
  OkSchema,
  InvalidPeerIdSchema,
  InvalidLimitSchema,
]);

export const FrameSchema = v.object({
  kind: v.literal("Response"),
  type: v.literal("QueryJobs"),
  id: v.number(),
  data: DataSchema,
});
