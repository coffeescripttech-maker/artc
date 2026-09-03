import { z } from "zod";

/** Destructive resets require the exact literal confirmation — a typing guard
 *  against accidental wipes from the UI or a mis-fired client call. */
export const resetSchema = z.object({
  confirm: z.literal("RESET"),
});