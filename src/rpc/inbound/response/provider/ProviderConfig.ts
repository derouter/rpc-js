import * as v from "valibot";

const OkSchema = v.object({
  tag: v.literal("Ok"),
});

const IdAlreadyUsedErrorSchema = v.object({
  tag: v.literal("IdAlreadyUsed"),
});

const AlreadyConfiguredErrorSchema = v.object({
  tag: v.literal("AlreadyConfigured"),
});

const DuplicateOfferErrorSchema = v.object({
  tag: v.literal("DuplicateOffer"),
  content: v.object({
    protocol_id: v.string(),
    offer_id: v.string(),
  }),
});

const ConfigResponseDataSchema = v.variant("tag", [
  OkSchema,
  IdAlreadyUsedErrorSchema,
  AlreadyConfiguredErrorSchema,
  DuplicateOfferErrorSchema,
]);

export class ProviderConfigError extends Error {
  constructor(
    readonly tag: v.InferOutput<typeof ConfigResponseDataSchema>["tag"],
    message?: string
  ) {
    super(message);
  }
}

export const FrameSchema = v.object({
  kind: v.literal("Response"),
  type: v.literal("ProviderConfig"),
  id: v.number(),
  data: ConfigResponseDataSchema,
});
