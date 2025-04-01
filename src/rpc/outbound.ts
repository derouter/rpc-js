import * as v from "valibot";

import { OutboundRequestFrameSchema } from "./outbound/request.js";

export const OutboundFrame = v.variant("kind", [OutboundRequestFrameSchema]);
