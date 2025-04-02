import * as v from "valibot";

import * as EventJobUpdated from "./request/event/job_updated.js";
import * as EventOfferRemoved from "./request/event/offer_removed.js";
import * as EventOfferUpdated from "./request/event/offer_updated.js";
import * as EventProviderHeartbeat from "./request/event/provider_heartbeat.js";
import * as EventProviderUpdated from "./request/event/provider_updated.js";

import * as ProviderOpenConnection from "./request/provider/open_connection.js";

export const InboundRequestFrameSchema = v.variant("type", [
  EventOfferRemoved.FrameSchema,
  EventOfferUpdated.FrameSchema,
  EventProviderHeartbeat.FrameSchema,
  EventProviderUpdated.FrameSchema,
  EventJobUpdated.FrameSchema,
  //
  ProviderOpenConnection.FrameSchema,
]);

export type InboundRequestFrame = v.InferOutput<
  typeof InboundRequestFrameSchema
>;
