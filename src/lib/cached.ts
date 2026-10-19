import "server-only";
import { unstable_cache } from "next/cache";
import { dissect } from "./dissect";

// Contracts rarely change, but owners renounce and taxes move: re-dissect every 5 minutes.
export const cachedDissect = (address: string) =>
  unstable_cache(() => dissect(address), ["dissect-v2", address.toLowerCase()], { revalidate: 300 })();
