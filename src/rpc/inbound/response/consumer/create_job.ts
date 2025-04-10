import * as v from "valibot";
import { PeerIdInputSchema } from "../../../common.js";

const OkSchema = v.object({
  tag: v.literal("Ok"),
  content: v.object({
    provider_peer_id: PeerIdInputSchema,
    provider_job_id: v.string(),
  }),
});

const LocalOfferNotFoundSchema = v.object({
  tag: v.literal("LocalOfferNotFound"),
});

const ProviderUnreacheableSchema = v.object({
  tag: v.literal("ProviderUnreacheable"),
});

const ProviderInvalidResponseSchema = v.object({
  tag: v.literal("ProviderInvalidResponse"),
});

const ProviderOfferNotFoundSchema = v.object({
  tag: v.literal("ProviderOfferNotFound"),
});

const ProviderOfferPayloadMismatchSchema = v.object({
  tag: v.literal("ProviderOfferPayloadMismatch"),
});

const InvalidJobArgsSchema = v.object({
  tag: v.literal("InvalidJobArgs"),
  content: v.string(),
});

const ProviderBusySchema = v.object({
  tag: v.literal("ProviderBusy"),
});

const ErroneousDataSchema = v.variant("tag", [
  LocalOfferNotFoundSchema,
  ProviderUnreacheableSchema,
  ProviderInvalidResponseSchema,
  ProviderOfferNotFoundSchema,
  ProviderOfferPayloadMismatchSchema,
  InvalidJobArgsSchema,
  ProviderBusySchema,
]);

export class ConsumerCreateJobError extends Error {
  constructor(readonly data: v.InferOutput<typeof ErroneousDataSchema>) {
    super(JSON.stringify(data));
  }
}

const DataSchema = v.variant("tag", [
  OkSchema,
  LocalOfferNotFoundSchema,
  ProviderUnreacheableSchema,
  ProviderInvalidResponseSchema,
  ProviderOfferNotFoundSchema,
  ProviderOfferPayloadMismatchSchema,
  InvalidJobArgsSchema,
  ProviderBusySchema,
]);

export const FrameSchema = v.object({
  kind: v.literal("Response"),
  type: v.literal("ConsumerCreateJob"),
  id: v.number(),
  data: DataSchema,
});
