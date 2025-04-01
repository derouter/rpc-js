import * as v from "valibot";

export const DataSchema = v.object({
  peer_id: v.string(),

  latest_heartbeat_at: v.pipe(
    v.number(),
    v.transform((x) => new Date(x * 1000))
  ),
});

export type ProviderHeartbeatData = v.InferOutput<typeof DataSchema>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("ProviderHeartbeat"),
  id: v.number(),
  data: DataSchema,
});
