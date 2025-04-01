import * as v from "valibot";

const OkSchema = v.object({
  tag: v.literal("Ok"),
  content: v.object({ connection_id: v.number() }),
});

const ProviderUnreacheableErrorSchema = v.object({
  tag: v.literal("ProviderUnreacheable"),
});

const ProviderOfferNotFoundErrorSchema = v.object({
  tag: v.literal("ProviderOfferNotFound"),
});

const OtherRemoteErrorSchema = v.object({
  tag: v.literal("OtherRemoteError"),
  content: v.string(),
});

const OtherLocalErrorSchema = v.object({
  tag: v.literal("OtherLocalError"),
  content: v.string(),
});

const ErrorSchema = v.variant("tag", [
  ProviderUnreacheableErrorSchema,
  ProviderOfferNotFoundErrorSchema,
  OtherRemoteErrorSchema,
  OtherLocalErrorSchema,
]);

export class ConsumerOpenConnectionError extends Error {
  constructor(
    readonly tag: v.InferOutput<typeof ErrorSchema>["tag"],
    message?: string
  ) {
    super(message);
  }
}

const DataSchema = v.variant("tag", [
  OkSchema,
  ProviderUnreacheableErrorSchema,
  ProviderOfferNotFoundErrorSchema,
  OtherRemoteErrorSchema,
  OtherLocalErrorSchema,
]);

export const FrameSchema = v.object({
  kind: v.literal("Response"),
  type: v.literal("ConsumerOpenConnection"),
  id: v.number(),
  data: DataSchema,
});
