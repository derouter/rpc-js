import * as v from "valibot";

const OkSchema = v.object({
  tag: v.literal("Ok"),
});

const BusySchema = v.object({
  tag: v.literal("Busy"),
});

const InvalidJobArgsSchema = v.object({
  tag: v.literal("InvalidJobArgs"),
  content: v.string(),
});

const ErroneousDataSchema = v.variant("tag", [
  BusySchema,
  InvalidJobArgsSchema,
]);

export class ProviderCreateJobError extends Error {
  constructor(readonly data: v.InferOutput<typeof ErroneousDataSchema>) {
    super(JSON.stringify(data));
  }
}

const DataSchema = v.variant("tag", [
  OkSchema,
  BusySchema,
  InvalidJobArgsSchema,
]);

export type ProviderCreateJobResponseData = v.InferOutput<typeof DataSchema>;

export const FrameSchema = v.object({
  kind: v.literal("Response"),
  type: v.literal("ProviderCreateJob"),
  id: v.number(),
  data: DataSchema,
});
