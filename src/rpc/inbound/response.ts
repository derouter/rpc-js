import * as v from "valibot";

import * as FailJob from "./response/fail_job.js";

import * as ConsumerCompleteJob from "./response/consumer/complete_job.js";
import * as ConsumerCreateJob from "./response/consumer/create_job.js";
import * as ConsumerGetJob from "./response/consumer/get_job.js";
import * as ConsumerOpenJobConnection from "./response/consumer/open_job_connection.js";

import * as ProviderCompleteJob from "./response/provider/complete_job.js";
import * as ProviderProvide from "./response/provider/provide.js";

import * as QueryActiveOffers from "./response/query/active_offers.js";
import * as QueryActiveProviders from "./response/query/active_providers.js";
import * as QueryJobs from "./response/query/jobs.js";
import * as QueryOfferSnapshots from "./response/query/offer_snapshots.js";
import * as QueryProviders from "./response/query/providers.js";
import * as QuerySystem from "./response/query/system.js";

import * as SubscribeToActiveOffers from "./response/subscription/active_offers.js";
import * as SubscribeToActiveProviders from "./response/subscription/active_providers.js";
import * as CancelSubscription from "./response/subscription/cancel.js";
import * as SubscribeToJobs from "./response/subscription/jobs.js";

export const InboundResponseFrameSchema = v.variant("type", [
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

export type InboundResponseFrame = v.InferOutput<
  typeof InboundResponseFrameSchema
>;
