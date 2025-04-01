import * as v from "valibot";

const OkSchema = v.object({
  tag: v.literal("Ok"),
});

const InvalidConsumerPeerIdSchema = v.object({
  tag: v.literal("InvalidConsumerPeerId"),
  content: v.object({
    message: v.string(),
  }),
});

const InvalidJobIdSchema = v.object({
  tag: v.literal("InvalidJobId"),
});

const NotCompletedYetSchema = v.object({
  tag: v.literal("NotCompletedYet"),
});

const AlreadyFailedSchema = v.object({
  tag: v.literal("AlreadyFailed"),
});

const AlreadyConfirmedSchema = v.object({
  tag: v.literal("AlreadyConfirmed"),
});

const ProviderUnreacheableSchema = v.object({
  tag: v.literal("ProviderUnreacheable"),
});

const ProviderErrorSchema = v.object({
  tag: v.literal("ProviderError"),
  content: v.object({
    message: v.string(),
  }),
});

const ErrorSchema = v.variant("tag", [
  InvalidConsumerPeerIdSchema,
  InvalidJobIdSchema,
  NotCompletedYetSchema,
  AlreadyFailedSchema,
  ProviderUnreacheableSchema,
  ProviderErrorSchema,
]);

export class ConsumerConfirmJobCompletionError extends Error {
  constructor(
    readonly tag: v.InferOutput<typeof ErrorSchema>["tag"],
    message?: string
  ) {
    super(message);
  }
}

const DataSchema = v.variant("tag", [
  OkSchema,
  InvalidConsumerPeerIdSchema,
  InvalidJobIdSchema,
  NotCompletedYetSchema,
  AlreadyFailedSchema,
  AlreadyConfirmedSchema,
  ProviderUnreacheableSchema,
  ProviderErrorSchema,
]);

export const FrameSchema = v.object({
  kind: v.literal("Response"),
  type: v.literal("ConsumerConfirmJobCompletion"),
  id: v.number(),
  data: DataSchema,
});
