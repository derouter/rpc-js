import * as v from "valibot";

import * as Ack from "./response/ack.js";
import * as ProviderCreateJob from "./response/provider/create_job.js";
import * as ProviderPrepareJobConnection from "./response/provider/prepare_job_connection.js";

export const OutboundResponseFrameSchema = v.variant("type", [
  Ack.FrameSchema,
  ProviderCreateJob.FrameSchema,
  ProviderPrepareJobConnection.FrameSchema,
]);

export type OutboundResponseFrame = v.InferOutput<
  typeof OutboundResponseFrameSchema
>;
