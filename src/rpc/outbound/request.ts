import * as v from "valibot";

import * as FailJob from "./request/fail_job.js";

import * as ConsumerCompleteJob from "./request/consumer/complete_job.js";
import * as ConsumerCreateJob from "./request/consumer/create_job.js";
import * as ConsumerGetJob from "./request/consumer/get_job.js";
import * as ConsumerOpenJobConnection from "./request/consumer/open_job_connection.js";

import * as ProviderCompleteJob from "./request/provider/complete_job.js";
import * as ProviderProvide from "./request/provider/provide.js";

import * as QueryActiveOffers from "./request/query/active_offers.js";
import * as QueryActiveProviders from "./request/query/active_providers.js";
import * as QueryJobs from "./request/query/jobs.js";
import * as QueryOfferSnapshots from "./request/query/offer_snapshots.js";
import * as QueryProviders from "./request/query/providers.js";
import * as QuerySystem from "./request/query/system.js";

import * as SubscribeToActiveOffers from "./request/subscription/active_offers.js";
import * as SubscribeToActiveProviders from "./request/subscription/active_providers.js";
import * as CancelSubscription from "./request/subscription/cancel.js";
import * as SubscribeToJobs from "./request/subscription/jobs.js";

export const OutboundRequestFrameSchema = v.variant("type", [
  FailJob.FrameSchema,
  //
  ConsumerCompleteJob.FrameSchema,
  ConsumerCreateJob.FrameSchema,
  ConsumerGetJob.FrameSchema,
  ConsumerOpenJobConnection.FrameSchema,
  //
  ProviderCompleteJob.FrameSchema,
  ProviderProvide.FrameSchema,
  //
  QueryActiveOffers.FrameSchema,
  QueryActiveProviders.FrameSchema,
  QueryJobs.FrameSchema,
  QueryOfferSnapshots.FrameSchema,
  QueryProviders.FrameSchema,
  QuerySystem.FrameSchema,
  //
  SubscribeToActiveOffers.FrameSchema,
  SubscribeToActiveProviders.FrameSchema,
  CancelSubscription.FrameSchema,
  SubscribeToJobs.FrameSchema,
]);

export type OutboundRequestFrame = v.InferOutput<
  typeof OutboundRequestFrameSchema
>;
