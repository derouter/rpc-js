import * as v from "valibot";

import * as EventJobUpdated from "./request/event/job_updated.js";
import * as EventOfferRemoved from "./request/event/offer_removed.js";
import * as EventOfferUpdated from "./request/event/offer_updated.js";
import * as EventProviderHeartbeat from "./request/event/provider_heartbeat.js";
import * as EventProviderUpdated from "./request/event/provider_updated.js";

import * as ProviderCreateJob from "./request/provider/create_job.js";
import * as ProviderOpenJobConnection from "./request/provider/open_job_connection.js";
import * as ProviderPrepareJobConnection from "./request/provider/prepare_job_connection.js";

export const InboundRequestFrameSchema = v.variant("type", [
  EventOfferRemoved.FrameSchema,
  EventOfferUpdated.FrameSchema,
  EventProviderHeartbeat.FrameSchema,
  EventProviderUpdated.FrameSchema,
  EventJobUpdated.FrameSchema,
  //
  ProviderCreateJob.FrameSchema,
  ProviderOpenJobConnection.FrameSchema,
  ProviderPrepareJobConnection.FrameSchema,
]);

export type InboundRequestFrame = v.InferOutput<
  typeof InboundRequestFrameSchema
>;
