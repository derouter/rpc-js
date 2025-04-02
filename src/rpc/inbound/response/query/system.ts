import * as v from "valibot";

const OkSchema = v.object({
  tag: v.literal("Ok"),
  content: v.object({
    peer_id: v.string(),
  }),
});

const DataSchema = v.variant("tag", [OkSchema]);

export const FrameSchema = v.object({
  kind: v.literal("Response"),
  type: v.literal("QuerySystem"),
  id: v.number(),
  data: DataSchema,
});
