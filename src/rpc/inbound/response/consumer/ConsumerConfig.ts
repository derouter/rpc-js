import * as v from "valibot";

import { DataSchema as OfferUpdatedDataSchema } from "../../request/OfferUpdated.js";
import { DataSchema as ProviderUpdatedDataSchema } from "../../request/ProviderUpdated.js";

export const FrameSchema = v.object({
  kind: v.literal("Response"),
  type: v.literal("ConsumerConfig"),
  id: v.number(),
  data: v.object({
    providers: v.array(ProviderUpdatedDataSchema),
    offers: v.array(OfferUpdatedDataSchema),
  }),
});
