import * as v from "valibot";

import * as ConsumerCompleteJob from "./request/consumer/complete_job.js";
import * as ConsumerConfirmJobCompletion from "./request/consumer/confirm_job_completion.js";
import * as ConsumerCreateJob from "./request/consumer/create_job.js";
import * as ConsumerFailJob from "./request/consumer/fail_job.js";
import * as ConsumerOpenConnection from "./request/consumer/open_connection.js";
import * as ConsumerSyncJob from "./request/consumer/sync_job.js";

import * as ProviderCompleteJob from "./request/provider/complete_job.js";
import * as ProviderCreateJob from "./request/provider/create_job.js";
import * as ProviderFailJob from "./request/provider/fail_job.js";
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
  ConsumerCompleteJob.FrameSchema,
  ConsumerConfirmJobCompletion.FrameSchema,
  ConsumerCreateJob.FrameSchema,
  ConsumerFailJob.FrameSchema,
  ConsumerOpenConnection.FrameSchema,
  ConsumerSyncJob.FrameSchema,
  //
  ProviderCompleteJob.FrameSchema,
  ProviderCreateJob.FrameSchema,
  ProviderFailJob.FrameSchema,
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
