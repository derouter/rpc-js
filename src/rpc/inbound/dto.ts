import * as v from "valibot";
import { PeerIdInputSchema } from "../common.js";

export const OfferSnapshotSchema = v.object({
  /**
   * `{@link provider_peer_id}`, `{@link offer_id}` and `{@link protocol_id}`
   * may remain the same, but `{@link protocol_payload}` changes.
   * Snapshot ID is unique per whole 4-tuple.
   */
  snapshot_id: v.number(),

  active: v.boolean(),
  provider_peer_id: PeerIdInputSchema,
  protocol_id: v.string(),
  offer_id: v.string(),
  protocol_payload: v.any(),
});

export type OfferSnapshot = v.InferOutput<typeof OfferSnapshotSchema>;

export const OfferRemovedSchema = v.object({
  snapshot_id: v.number(),
  provider_peer_id: PeerIdInputSchema,
  protocol_id: v.string(),
  offer_id: v.string(),
});

export type OfferRemoved = v.InferOutput<typeof OfferRemovedSchema>;

const TimestampSchema = v.pipe(
  v.number(),
  v.transform((x) => new Date(x * 1000))
);

export const ProviderRecordSchema = v.object({
  peer_id: PeerIdInputSchema,
  name: v.optional(v.string()),
  teaser: v.optional(v.string()),
  description: v.optional(v.string()),
  updated_at: TimestampSchema,
  latest_heartbeat_at: TimestampSchema,
});

export type ProviderRecord = v.InferOutput<typeof ProviderRecordSchema>;

export const ProviderHeartbeatSchema = v.object({
  peer_id: PeerIdInputSchema,
  latest_heartbeat_at: TimestampSchema,
});

export type ProviderHeartbeat = v.InferOutput<typeof ProviderHeartbeatSchema>;

export const JobRecordSchema = v.object({
  job_rowid: v.number(),
  provider_peer_id: PeerIdInputSchema,
  consumer_peer_id: PeerIdInputSchema,
  offer_snapshot_rowid: v.number(),
  offer_protocol_id: v.string(),
  currency: v.number(),
  balance_delta: v.nullish(v.string()),
  public_payload: v.nullish(v.string()),
  private_payload: v.nullish(v.string()),
  reason: v.nullish(v.string()),
  reason_class: v.nullish(v.number()),
  created_at_local: TimestampSchema,
  created_at_sync: v.nullish(v.number()),
  completed_at_local: v.nullish(TimestampSchema),
  completed_at_sync: v.nullish(v.number()),
  signature_confirmed_at_local: v.nullish(TimestampSchema),
  confirmation_error: v.nullish(v.string()),
});

export type JobRecord = v.InferOutput<typeof JobRecordSchema>;
