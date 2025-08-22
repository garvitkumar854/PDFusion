
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
    const [toCurrency, setToCurrency] = useState("EUR");
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
                // Using a proxy to avoid CORS issues if run on a different domain.
                const response = await fetch('https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml');
                if (!response.ok) throw new Error('Failed to fetch rates');
                
                const xmlText = await response.text();
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlText, "application/xml");
                
                const newRates: ExchangeRates = { EUR: 1 };
                const cubes = xmlDoc.getElementsByTagName('Cube');
                
                for (let i = 0; i < cubes.length; i++) {
                    const currency = cubes[i].getAttribute('currency');
                    const rate = cubes[i].getAttribute('rate');
                    if (currency && rate) {
                        newRates[currency] = parseFloat(rate);
                    }
                }
                setRates(newRates);
            } catch (err) {
                console.error(err);
                setError("Could not load exchange rates. Please try again later.");
                toast({ variant: 'destructive', title: 'Error', description: "Failed to load exchange rates."});
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
        const amountInEur = amount / currentRates[from];
        return amountInEur * currentRates[to];
    }, []);

    useEffect(() => {
        if (!rates) return;

        const amount = lastEdited === 'from' ? parseFloat(fromAmount) : parseFloat(toAmount);
        if (isNaN(amount)) {
            if (lastEdited === 'from') setToAmount("");
            else setFromAmount("");
            return;
        }

        const from = lastEdited === 'from' ? fromCurrency : toCurrency;
        const to = lastEdited === 'from' ? toCurrency : fromCurrency;

        const result = convert(amount, from, to, rates);
        
        if (result !== null) {
            if (lastEdited === 'from') {
                setToAmount(formatCurrency(result));
            } else {
                setFromAmount(formatCurrency(result));
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
        const tempCurrency = fromCurrency;
        setFromCurrency(toCurrency);
        setToCurrency(tempCurrency);
        
        // Trigger re-calculation based on what was last edited
        if (lastEdited === 'from') {
           setLastEdited('to');
           setToAmount(fromAmount);
        } else {
            setLastEdited('from');
            setFromAmount(toAmount);
        }
    };
    
    const exchangeRateText = useMemo(() => {
        if (!rates) return "Loading rates...";
        const fromRate = rates[fromCurrency];
        const toRate = rates[toCurrency];
        if (!fromRate || !toRate) return "Rate unavailable";

        const rate = (1 / fromRate) * toRate;
        const fromSymbol = currencyList.find(c => c.code === fromCurrency)?.symbol || fromCurrency;
        const toSymbol = currencyList.find(c => c.code === toCurrency)?.symbol || toCurrency;
        return `1 ${fromSymbol} = ${formatCurrency(rate)} ${toSymbol}`;

    }, [rates, fromCurrency, toCurrency]);

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
