
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, Loader2, AlertTriangle, ArrowRightLeft } from "lucide-react";
import { currencyList, Currency } from "@/lib/currency-data";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { getRates } from "@/ai/flows/currency-flow";
import type { GetRatesInput } from "@/ai/flows/currency-types";


type ExchangeRates = {
    [key: string]: number;
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
    }).format(value);
};

const CurrencySelector = React.memo(({ value, onChange, disabled }: { value: string; onChange: (value: string) => void; disabled?: boolean }) => {
    const [open, setOpen] = useState(false);
    const selectedCurrency = currencyList.find(c => c.code === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-12 text-base"
                    disabled={disabled}
                >
                    <div className="flex items-center gap-2">
                        {selectedCurrency?.flag}
                        {selectedCurrency ? `${selectedCurrency.code} - ${selectedCurrency.name}` : "Select currency"}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command>
                    <CommandInput placeholder="Search currency..." />
                    <CommandList>
                        <CommandEmpty>No currency found.</CommandEmpty>
                        <CommandGroup>
                            {currencyList.map((currency) => (
                                <CommandItem
                                    key={currency.code}
                                    value={`${currency.code} ${currency.name}`}
                                    onSelect={() => {
                                        onChange(currency.code);
                                        setOpen(false);
                                    }}
                                >
                                    <Check className={cn("mr-2 h-4 w-4", value === currency.code ? "opacity-100" : "opacity-0")} />
                                    <div className="flex items-center gap-2">
                                        {currency.flag}
                                        <span>{currency.code} - {currency.name}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
});
CurrencySelector.displayName = 'CurrencySelector';

export function CurrencyConverter() {
    const [rates, setRates] = useState<ExchangeRates | null>(null);
    const [fromCurrency, setFromCurrency] = useState("USD");
    const [toCurrency, setToCurrency] = useState("INR");
    const [fromAmount, setFromAmount] = useState("1");
    const [toAmount, setToAmount] = useState("");
    const [lastEdited, setLastEdited] = useState<'from' | 'to'>('from');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const fetchRates = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const input: GetRatesInput = { baseCurrency: "USD" };
                const result = await getRates(input);
                if (!result.rates) {
                    throw new Error("Could not retrieve exchange rates from the AI.");
                }
                setRates(result.rates);
            } catch (err: any) {
                console.error(err);
                setError("Could not load exchange rates. Please try again later.");
                toast({ variant: 'destructive', title: 'Error', description: err.message || "Failed to load exchange rates."});
            } finally {
                setIsLoading(false);
            }
        };

        fetchRates();
    }, [toast]);

    const convert = useCallback((amount: number, from: string, to: string, currentRates: ExchangeRates): number | null => {
        if (!currentRates || !currentRates[from] || !currentRates[to]) {
            return null;
        }
        const amountInUsd = amount / currentRates[from];
        return amountInUsd * currentRates[to];
    }, []);

    useEffect(() => {
        if (!rates) return;

        const amountStr = lastEdited === 'from' ? fromAmount : toAmount;
        const amount = parseFloat(amountStr);

        if (isNaN(amount) || amountStr === "") {
            if (lastEdited === 'from') setToAmount("");
            else setFromAmount("");
            return;
        }
        
        const sourceCurrency = lastEdited === 'from' ? fromCurrency : toCurrency;
        const targetCurrency = lastEdited === 'from' ? toCurrency : fromCurrency;

        const result = convert(amount, sourceCurrency, targetCurrency, rates);
        
        if (result !== null) {
            const formattedResult = formatCurrency(result);
            if (lastEdited === 'from') {
                setToAmount(formattedResult);
            } else {
                setFromAmount(formattedResult);
            }
        } else {
             if (lastEdited === 'from') setToAmount("");
             else setFromAmount("");
        }

    }, [fromAmount, toAmount, fromCurrency, toCurrency, rates, lastEdited, convert]);

    const handleFromAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFromAmount(e.target.value);
        setLastEdited('from');
    };

    const handleToAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setToAmount(e.target.value);
        setLastEdited('to');
    };
    
    const handleSwap = () => {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
        setLastEdited(prev => prev === 'from' ? 'to' : 'from');
    };
    
    const exchangeRateText = useMemo(() => {
        if (!rates || isLoading) return "Loading rates...";
        
        const fromRate = rates[fromCurrency];
        const toRate = rates[toCurrency];

        if (!fromRate || !toRate) return "Rate unavailable";

        const rate = (1 / fromRate) * toRate;
        const fromSymbol = currencyList.find(c => c.code === fromCurrency)?.symbol || fromCurrency;
        const toSymbol = currencyList.find(c => c.code === toCurrency)?.symbol || toCurrency;
        
        return `1 ${fromSymbol} = ${formatCurrency(rate)} ${toSymbol}`;

    }, [rates, fromCurrency, toCurrency, isLoading]);

    return (
        <Card className="bg-transparent shadow-lg w-full">
            <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">Currency Converter</CardTitle>
                <CardDescription>Get live exchange rates for hundreds of currencies.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : error ? (
                     <div className="flex flex-col justify-center items-center h-48 text-destructive gap-2">
                        <AlertTriangle className="w-8 h-8" />
                        <p>{error}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fromAmount" className="font-semibold">From</Label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Input id="fromAmount" type="number" value={fromAmount} onChange={handleFromAmountChange} className="h-12 text-lg" />
                                <CurrencySelector value={fromCurrency} onChange={setFromCurrency} />
                            </div>
                        </div>

                         <div className="flex justify-center items-center gap-4">
                            <div className="flex-grow border-t"></div>
                            <Button variant="ghost" size="icon" onClick={handleSwap} className="rounded-full bg-muted hover:bg-primary/10 group">
                                <ArrowRightLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-transform duration-300 group-hover:rotate-180" />
                            </Button>
                            <div className="flex-grow border-t"></div>
                         </div>
                         
                         <div className="space-y-2">
                            <Label htmlFor="toAmount" className="font-semibold">To</Label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Input id="toAmount" type="number" value={toAmount} onChange={handleToAmountChange} className="h-12 text-lg" />
                                <CurrencySelector value={toCurrency} onChange={setToCurrency} />
                            </div>
                        </div>
                        
                        <div className="text-center pt-4 text-muted-foreground font-semibold">
                            <p>{exchangeRateText}</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
