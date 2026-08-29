
'use server';
/**
 * @fileOverview A server-side flow for fetching currency exchange rates.
 *
 * - getRates - A function to fetch the latest exchange rates for a given base currency.
 */

import {ai} from '@/ai/genkit';
import {GetRatesInput, GetRatesInputSchema, GetRatesOutputSchema} from './currency-types';

/**
 * An asynchronous function to get exchange rates for a specified base currency.
 * It uses a Genkit flow that internally calls a tool to fetch data from an external API.
 *
 * @param input An object containing the base currency code (e.g., "USD").
 * @returns A promise that resolves to an object containing the exchange rates.
 */
export async function getRates(input: GetRatesInput) {
  return getRatesFlow(input);
}

const getExchangeRateTool = ai.defineTool(
  {
    name: 'getExchangeRate',
    description: 'Get the latest exchange rates for a given currency from an external API.',
    inputSchema: GetRatesInputSchema,
    outputSchema: GetRatesOutputSchema,
  },
  async (input) => {
    // baseCurrency comes straight from the client, so validate it before it is
    // interpolated into a URL.
    const baseCurrency = input.baseCurrency.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(baseCurrency)) {
      throw new Error('Base currency must be a 3 letter ISO code (e.g. "USD").');
    }

    const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`, {
      // Rates only change once a day; reuse the response server-side instead of
      // hitting the upstream API on every page load.
      next: { revalidate: 3600 },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates from the API.');
    }
    const data = await response.json();
    if (data.result === 'error') {
        throw new Error(data['error-type'] || 'An unknown API error occurred.');
    }
    return { rates: data.rates };
  }
);


const getRatesFlow = ai.defineFlow(
  {
    name: 'getRatesFlow',
    inputSchema: GetRatesInputSchema,
    outputSchema: GetRatesOutputSchema,
  },
  async (input) => {
    return getExchangeRateTool(input);
  }
);
