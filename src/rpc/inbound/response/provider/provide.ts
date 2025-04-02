import * as v from "valibot";

const OkSchema = v.object({
  tag: v.literal("Ok"),
});

const DuplicateOfferSchema = v.object({
  tag: v.literal("DuplicateOffer"),
  content: v.object({
    protocol_id: v.string(),
    offer_id: v.string(),
  }),
});

const ErroneousDataSchema = v.variant("tag", [DuplicateOfferSchema]);

export class ProviderProvideError extends Error {
  constructor(readonly data: v.InferOutput<typeof ErroneousDataSchema>) {
    super(JSON.stringify(data));
  }
}

const DataSchema = v.variant("tag", [OkSchema, DuplicateOfferSchema]);

export const FrameSchema = v.object({
  kind: v.literal("Response"),
  type: v.literal("ProviderProvide"),
  id: v.number(),
  data: DataSchema,
});
