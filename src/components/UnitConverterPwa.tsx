
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categories, Unit, Category, convert, formatNumber } from "@/lib/unit-data";
import { ArrowRightLeft, Delete, Sigma } from "lucide-react";
import { Button } from "./ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type InputState = {
    value: string;
    unit: string;
};

const initialStates: Record<Category['id'], { from: InputState, to: InputState }> = {
    length: { from: { value: '1', unit: 'meters' }, to: { value: '', unit: 'feet' } },
    mass: { from: { value: '1', unit: 'kilograms' }, to: { value: '', unit: 'pounds' } },
    temperature: { from: { value: '0', unit: 'celsius' }, to: { value: '', unit: 'fahrenheit' } },
    volume: { from: { value: '1', unit: 'liters' }, to: { value: 'gallons-us' } },
    speed: { from: { value: '1', unit: 'kph' }, to: { value: '', unit: 'miles-per-hour' } },
    area: { from: { value: '1', unit: 'sq-meters' }, to: { value: '', unit: 'sq-feet' } },
};

const Calculator = ({ onInput, showPlusMinus }: { onInput: (key: string) => void, showPlusMinus?: boolean }) => {
    const buttons = [
        'C', 'Swap', 'Backspace',
        '7', '8', '9',
        '4', '5', '6',
        '1', '2', '3',
    ];

    const finalRow = showPlusMinus
      ? ['+/-', '0', '.']
      : ['0', '.'];
      
    const getButtonClass = (btn: string) => {
        switch(btn) {
            case 'C': return "bg-destructive/80 hover:bg-destructive text-destructive-foreground row-span-2";
            case 'Backspace': return "bg-secondary row-span-2";
            case 'Swap': return "col-span-2";
            case '0': return "col-span-2";
            default: return "bg-secondary";
        }
    }
    
    const getButtonIcon = (btn: string) => {
        switch(btn) {
            case 'Backspace': return <Delete className="h-7 w-7"/>;
            case 'Swap': return <ArrowRightLeft className="h-7 w-7"/>;
            case '+/-': return <Sigma className="h-7 w-7"/>;
            default: return btn;
        }
    }

    return (
        <Card className="bg-transparent shadow-none border-none p-2 h-full">
            <div className="grid grid-cols-4 grid-rows-5 gap-2 h-full">
                <Button onClick={() => onInput('C')} className="h-full text-2xl font-bold row-span-2" variant="destructive">C</Button>
                <Button onClick={() => onInput('Backspace')} className="h-full row-span-2" variant="secondary"><Delete className="h-8 w-8"/></Button>
                
                <div className="col-span-3 row-span-3 grid grid-cols-3 grid-rows-3 gap-2">
                    {['7','8','9','4','5','6','1','2','3'].map(btn => (
                        <Button key={btn} onClick={() => onInput(btn)} className="h-full w-full text-2xl font-bold" variant="secondary">{btn}</Button>
                    ))}
                </div>

                <div className={cn("col-span-3 grid grid-rows-1 gap-2", showPlusMinus ? "grid-cols-3" : "grid-cols-[2fr_1fr]")}>
                   {finalRow.map(btn => (
                      <Button 
                        key={btn}
                        onClick={() => onInput(btn)} 
                        className={cn("h-full text-2xl font-bold", btn === '0' && !showPlusMinus && 'col-span-2')} 
                        variant="secondary"
                      >
                         {getButtonIcon(btn)}
                      </Button>
                   ))}
                </div>
                 <Button onClick={() => onInput('Swap')} className="h-full" variant="default"><ArrowRightLeft className="h-8 w-8"/></Button>
            </div>
        </Card>
    );
}

export function UnitConverterPwa() {
  const [activeCategory, setActiveCategory] = useState<Category['id']>('length');
  const [from, setFrom] = useState<InputState>(initialStates.length.from);
  const [to, setTo] = useState<InputState>(initialStates.length.to);
  const [activeInput, setActiveInput] = useState<'from' | 'to'>('from');

  const unitsForCategory = useMemo(() => {
    return categories.find(c => c.id === activeCategory)?.units || [];
  }, [activeCategory]);
  
  const performConversion = useCallback(() => {
    const value = activeInput === 'from' ? from.value : to.value;
    const fromUnit = activeInput === 'from' ? from.unit : to.unit;
    const toUnit = activeInput === 'from' ? to.unit : from.unit;

    const currentUnits = categories.find(c => c.id === activeCategory)?.units;
    if (!currentUnits) return;

    const fromUnitExists = currentUnits.some(u => u.id === fromUnit);
    const toUnitExists = currentUnits.some(u => u.id === toUnit);

    if (!fromUnitExists || !toUnitExists) return;

    const numericValue = parseFloat(value);
    if (isNaN(numericValue) || !value) {
      if (activeInput === 'from') setTo(prev => ({...prev, value: ''}));
      else setFrom(prev => ({...prev, value: ''}));
      return;
    }
    
    const result = convert(activeCategory, numericValue, fromUnit, toUnit);
    const formattedResult = formatNumber(result);

    if (activeInput === 'from') {
        setTo(prev => ({ ...prev, value: formattedResult }));
    } else {
        setFrom(prev => ({ ...prev, value: formattedResult }));
    }
  }, [activeCategory, from.value, from.unit, to.value, to.unit, activeInput]);
  
  useEffect(() => {
    performConversion();
  }, [performConversion]);

  const handleFromUnitChange = (unit: string) => {
    setFrom(prev => ({...prev, unit}));
  }

  const handleToUnitChange = (unit: string) => {
    setTo(prev => ({...prev, unit}));
  }

  const handleCategoryChange = (categoryId: string) => {
    const newCategory = categoryId as Category['id'];
    const initial = initialStates[newCategory];

    const currentUnits = categories.find(c => c.id === newCategory)?.units;
    if (!currentUnits) return;

    const fromUnitExists = currentUnits.some(u => u.id === initial.from.unit);
    const toUnitExists = currentUnits.some(u => u.id === initial.to.unit);
    
    if (fromUnitExists && toUnitExists) {
        setActiveCategory(newCategory);
        setFrom(initial.from);
        setTo(initial.to);
        setActiveInput('from');
    }
  };

  const handleSwap = () => {
    const oldFrom = { ...from };
    const oldTo = { ...to };
    setFrom(oldTo);
    setTo(oldFrom);
    setActiveInput(activeInput === 'from' ? 'to' : 'from');
  };

  const handleCalculatorInput = (key: string) => {
    const handler = activeInput === 'from' ? setFrom : setTo;
    const state = activeInput === 'from' ? from : to;

    if (key === 'Swap') {
      handleSwap();
      return;
    }

    if (key === 'C') {
        handler(prev => ({ ...prev, value: '0' }));
    } else if (key === 'Backspace') {
        handler(prev => ({...prev, value: prev.value.length > 1 ? prev.value.slice(0, -1) : '0'}));
    } else if (key === '+/-') {
        handler(prev => ({...prev, value: String(parseFloat(prev.value) * -1) }));
    } else if (key === '.' && state.value.includes('.')) {
        return; 
    } else {
        handler(prev => ({...prev, value: (prev.value === '0' && key !== '.') ? key : prev.value + key}));
    }
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
        <div className="p-2">
           <Select value={activeCategory} onValueChange={handleCategoryChange}>
             <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="Select category" />
             </SelectTrigger>
             <SelectContent>
                {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                           <category.icon className="h-5 w-5" />
                           <span>{category.name}</span>
                        </div>
                    </SelectItem>
                ))}
             </SelectContent>
           </Select>
        </div>
        
        <div className="flex-grow flex flex-col p-2 gap-2">
            <div 
                className={cn(
                    "relative p-4 rounded-lg bg-muted/50 border-2 transition-all",
                    activeInput === 'from' ? 'border-primary' : 'border-transparent'
                )}
                onClick={() => setActiveInput('from')}
            >
                <div className="flex justify-between items-center">
                   <div className="text-3xl font-bold">{from.value || '0'}</div>
                   <Select value={from.unit} onValueChange={handleFromUnitChange}>
                        <SelectTrigger className="w-auto border-0 bg-transparent text-lg font-semibold">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {unitsForCategory.map(unit => <SelectItem key={unit.id} value={unit.id}>{unit.symbol}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div 
                className={cn(
                    "relative p-4 rounded-lg bg-muted/50 border-2 transition-all",
                    activeInput === 'to' ? 'border-primary' : 'border-transparent'
                )}
                onClick={() => setActiveInput('to')}
            >
                 <div className="flex justify-between items-center">
                    <div className="text-3xl font-bold">{to.value || '0'}</div>
                     <Select value={to.unit} onValueChange={handleToUnitChange}>
                        <SelectTrigger className="w-auto border-0 bg-transparent text-lg font-semibold">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {unitsForCategory.map(unit => <SelectItem key={unit.id} value={unit.id}>{unit.symbol}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>

        <div className="h-[50vh]">
            <Calculator onInput={handleCalculatorInput} showPlusMinus={activeCategory === 'temperature'} />
        </div>
    </div>
  );
}
