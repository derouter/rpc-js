import * as v from "valibot";

import { InboundRequestFrameSchema } from "./inbound/request.js";
import { InboundResponseFrameSchema } from "./inbound/response.js";

export const InboundFrameSchema = v.variant("kind", [
  InboundRequestFrameSchema,
  InboundResponseFrameSchema,
]);
