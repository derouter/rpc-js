import * as v from "valibot";

import * as ConsumerCompleteJob from "./request/consumer/ConsumerCompleteJob.js";
import * as ConsumerConfig from "./request/consumer/ConsumerConfig.js";
import * as ConsumerConfirmJobCompletion from "./request/consumer/ConsumerConfirmJobCompletion.js";
import * as ConsumerCreateJob from "./request/consumer/ConsumerCreateJob.js";
import * as ConsumerFailJob from "./request/consumer/ConsumerFailJob.js";
import * as ConsumerOpenConnection from "./request/consumer/ConsumerOpenConnection.js";
import * as ConsumerSyncJob from "./request/consumer/ConsumerSyncJob.js";

import * as ProviderCompleteJob from "./request/provider/ProviderCompleteJob.js";
import * as ProviderConfig from "./request/provider/ProviderConfig.js";
import * as ProviderCreateJob from "./request/provider/ProviderCreateJob.js";
import * as ProviderFailJob from "./request/provider/ProviderFailJob.js";

export const OutboundRequestFrameSchema = v.variant("type", [
  // Consumer.
  ConsumerCompleteJob.FrameSchema,
  ConsumerConfig.FrameSchema,
  ConsumerConfirmJobCompletion.FrameSchema,
  ConsumerCreateJob.FrameSchema,
  ConsumerFailJob.FrameSchema,
  ConsumerOpenConnection.FrameSchema,
  ConsumerSyncJob.FrameSchema,
  // Provider.
  ProviderCompleteJob.FrameSchema,
  ProviderConfig.FrameSchema,
  ProviderCreateJob.FrameSchema,
  ProviderFailJob.FrameSchema,
]);

export type OutboundRequestFrame = v.InferOutput<
  typeof OutboundRequestFrameSchema
>;
