import * as v from "valibot";

const OkSchema = v.object({
  tag: v.literal("Ok"),

  /**
   * Module-defined nonce for the connection.
   */
  content: v.string(),
});

const JobNotFoundSchema = v.object({
  tag: v.literal("JobNotFound"),
});

const BusySchema = v.object({
  tag: v.literal("Busy"),
});

const ErroneousDataSchema = v.variant("tag", [JobNotFoundSchema, BusySchema]);

export class ProviderPrepareJobConnectionError extends Error {
  constructor(readonly data: v.InferOutput<typeof ErroneousDataSchema>) {
    super(JSON.stringify(data));
  }
}

const DataSchema = v.variant("tag", [OkSchema, JobNotFoundSchema, BusySchema]);

export type ProviderPrepareJobConnectionResponseData = v.InferOutput<
  typeof DataSchema
>;

export const FrameSchema = v.object({
  kind: v.literal("Response"),
  type: v.literal("ProviderPrepareJobConnection"),
  id: v.number(),
  data: DataSchema,
});
