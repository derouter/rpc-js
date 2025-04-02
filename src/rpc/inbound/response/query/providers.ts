import * as v from "valibot";
import { ProviderRecordSchema } from "../../dto.js";

const OkSchema = v.object({
  tag: v.literal("Ok"),
  content: v.array(ProviderRecordSchema),
});

const InvalidPeerIdSchema = v.object({
  tag: v.literal("Length"),
});

const LengthSchema = v.object({
  tag: v.literal("Length"),
  content: v.string(),
});

const ErroneousDataSchema = v.variant("tag", [
  InvalidPeerIdSchema,
  LengthSchema,
]);

export class QueryProvidersError extends Error {
  constructor(readonly data: v.InferOutput<typeof ErroneousDataSchema>) {
    super(JSON.stringify(data));
  }
}

const DataSchema = v.variant("tag", [
  OkSchema,
  InvalidPeerIdSchema,
  LengthSchema,
]);

export const FrameSchema = v.object({
  kind: v.literal("Response"),
  type: v.literal("QueryProviders"),
  id: v.number(),
  data: DataSchema,
});
