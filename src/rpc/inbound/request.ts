import * as v from "valibot";

import * as OfferRemoved from "./request/OfferRemoved.js";
import * as OfferUpdated from "./request/OfferUpdated.js";
import * as ProviderOpenConnection from "./request/provider/ProviderOpenConnection.js";
import * as ProviderHeartbeat from "./request/ProviderHeartbeat.js";
import * as ProviderUpdated from "./request/ProviderUpdated.js";

export const InboundRequestFrameSchema = v.variant("type", [
  // Common.
  OfferRemoved.FrameSchema,
  OfferUpdated.FrameSchema,
  ProviderHeartbeat.FrameSchema,
  ProviderUpdated.FrameSchema,
  // Provider-specific.
  ProviderOpenConnection.FrameSchema,
]);

export type InboundRequestFrame = v.InferOutput<
  typeof InboundRequestFrameSchema
>;
