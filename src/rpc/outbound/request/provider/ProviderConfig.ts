import * as v from "valibot";

export const ProviderConfigSchema = v.object({
  provider_id: v.string(),
  offers: v.record(
    v.string(),
    v.object({
      protocol: v.string(),
      protocol_payload: v.any(),
    })
  ),
});

// export type ProviderConfig<T> = {
//   provider_id: string;
//   offers: Record<
//     string,
//     {
//       protocol: string;
//       protocol_payload: T;
//     }
//   >;
// };
export type ProviderConfig = v.InferOutput<typeof ProviderConfigSchema>;

export const FrameSchema = v.object({
  kind: v.literal("Request"),
  type: v.literal("ProviderConfig"),
  id: v.number(),
  data: ProviderConfigSchema,
});
