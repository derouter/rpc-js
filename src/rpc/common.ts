import { base58btc } from "multiformats/bases/base58";
import * as v from "valibot";

export const PeerIdInputSchema = v.pipe(
  v.custom((input) => input instanceof Uint8Array),
  v.transform((input) => base58btc.encode(input as Uint8Array))
);

export const PeerIdOutputSchema = v.pipe(
  v.string(),
  v.transform((input) => base58btc.decode(input))
);
