
import { z } from 'zod';

/**
 * Defines the schema for the input of the currency exchange rate flow.
 * It expects an object with a 'baseCurrency' property, which is a string.
 */
export const GetRatesInputSchema = z.object({
  baseCurrency: z.string().describe('The base currency to fetch exchange rates for (e.g., "USD").'),
});
export type GetRatesInput = z.infer<typeof GetRatesInputSchema>;

/**
 * Defines the schema for the output of the currency exchange rate flow.
 * It expects an object with a 'rates' property, which is a record of string keys to number values.
 */
export const GetRatesOutputSchema = z.object({
  rates: z.record(z.number()).describe('A map of currency codes to their exchange rates.'),
});
export type GetRatesOutput = z.infer<typeof GetRatesOutputSchema>;
