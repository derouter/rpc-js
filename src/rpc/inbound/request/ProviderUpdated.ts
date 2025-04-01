import * as v from "valibot";

export const DataSchema = v.object({
  peer_id: v.string(),

  name: v.optional(v.nullable(v.string())),
  teaser: v.optional(v.nullable(v.string())),
  description: v.optional(v.nullable(v.string())),

  latest_heartbeat_at: v.pipe(
    v.number(),
    v.transform((x) => new Date(x * 1000))
  ),
});

/**
 * A new provider is discovered, or updated.
 */
export type ProviderUpdatedData = v.InferOutput<typeof DataSchema>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("ProviderUpdated"),
  id: v.number(),
  data: DataSchema,
});
