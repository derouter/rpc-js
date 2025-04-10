import * as v from "valibot";

const OkSchema = v.object({
  tag: v.literal("Ok"),
  content: v.object({ connection_id: v.number() }),
});

const LocalJobNotFoundSchema = v.object({
  tag: v.literal("LocalJobNotFound"),
});

const ProviderUnreacheableSchema = v.object({
  tag: v.literal("ProviderUnreacheable"),
});

const ProviderJobNotFoundSchema = v.object({
  tag: v.literal("ProviderJobNotFound"),
});

const ProviderJobExpiredSchema = v.object({
  tag: v.literal("ProviderJobExpired"),
});

const ProviderBusySchema = v.object({
  tag: v.literal("ProviderBusy"),
});

const OtherRemoteErrorSchema = v.object({
  tag: v.literal("OtherRemoteError"),
  content: v.string(),
});

const OtherLocalErrorSchema = v.object({
  tag: v.literal("OtherLocalError"),
  content: v.string(),
});

const ErroneousDataSchema = v.variant("tag", [
  LocalJobNotFoundSchema,
  ProviderUnreacheableSchema,
  ProviderJobNotFoundSchema,
  ProviderJobExpiredSchema,
  ProviderBusySchema,
  OtherRemoteErrorSchema,
  OtherLocalErrorSchema,
]);

export class ConsumerOpenJobConnectionError extends Error {
  constructor(readonly data: v.InferOutput<typeof ErroneousDataSchema>) {
    super(JSON.stringify(data));
  }
}

const DataSchema = v.variant("tag", [
  OkSchema,
  LocalJobNotFoundSchema,
  ProviderUnreacheableSchema,
  ProviderJobNotFoundSchema,
  ProviderJobExpiredSchema,
  ProviderBusySchema,
  OtherRemoteErrorSchema,
  OtherLocalErrorSchema,
]);

export const FrameSchema = v.object({
  kind: v.literal("Response"),
  type: v.literal("ConsumerOpenJobConnection"),
  id: v.number(),
  data: DataSchema,
});
