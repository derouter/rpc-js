import * as v from "valibot";

import * as ConsumerCompleteJob from "./response/consumer/ConsumerCompleteJob.js";
import * as ConsumerConfig from "./response/consumer/ConsumerConfig.js";
import * as ConsumerConfirmJobCompletion from "./response/consumer/ConsumerConfirmJobCompletion.js";
import * as ConsumerCreateJob from "./response/consumer/ConsumerCreateJob.js";
import * as ConsumerFailJob from "./response/consumer/ConsumerFailJob.js";
import * as ConsumerOpenConnection from "./response/consumer/ConsumerOpenConnection.js";
import * as ConsumerSyncJob from "./response/consumer/ConsumerSyncJob.js";

import * as ProviderCompleteJob from "./response/provider/ProviderCompleteJob.js";
import * as ProviderConfig from "./response/provider/ProviderConfig.js";
import * as ProviderCreateJob from "./response/provider/ProviderCreateJob.js";
import * as ProviderFailJob from "./response/provider/ProviderFailJob.js";

export const InboundResponseFrameSchema = v.variant("type", [
  // Consumer-specific.
  ConsumerCompleteJob.FrameSchema,
  ConsumerConfig.FrameSchema,
  ConsumerConfirmJobCompletion.FrameSchema,
  ConsumerCreateJob.FrameSchema,
  ConsumerFailJob.FrameSchema,
  ConsumerOpenConnection.FrameSchema,
  ConsumerSyncJob.FrameSchema,
  // Provider-specific.
  ProviderCompleteJob.FrameSchema,
  ProviderConfig.FrameSchema,
  ProviderCreateJob.FrameSchema,
  ProviderFailJob.FrameSchema,
]);

export type InboundResponseFrame = v.InferOutput<
  typeof InboundResponseFrameSchema
>;
