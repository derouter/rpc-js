import * as v from "valibot";

import { OutboundRequestFrameSchema } from "./outbound/request.js";
import { OutboundResponseFrameSchema } from "./outbound/response.js";

export const OutboundFrame = v.variant("kind", [
  OutboundRequestFrameSchema,
  OutboundResponseFrameSchema,
]);
