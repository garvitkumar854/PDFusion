
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categories, Unit, Category, convert, formatNumber } from "@/lib/unit-data";
import { ArrowRightLeft, Delete } from "lucide-react";
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
    volume: { from: { value: '1', unit: 'liters' }, to: { value: '', unit: 'gallons-us' } },
    speed: { from: { value: '1', unit: 'kph' }, to: { value: '', unit: 'miles-per-hour' } },
    area: { from: { value: '1', unit: 'sq-meters' }, to: { value: '', unit: 'sq-feet' } },
};

const ConversionPanel = ({
  units,
  state,
  onChange,
  label,
  onFocus,
  isActive,
}: {
  units: Unit[];
  state: InputState;
  onChange: (value: string, unit?: string) => void;
  label: string;
  onFocus: () => void;
  isActive: boolean;
}) => {
  return (
    <div className="relative space-y-2">
      <div 
        className={cn(
          "absolute -inset-2 rounded-xl border-2 border-transparent transition-all",
          isActive && "!border-primary"
        )}
      />
      <Card className="bg-muted/50 p-4" onFocus={onFocus} tabIndex={-1}>
        <Label htmlFor={label} className="text-sm text-muted-foreground">{label}</Label>
        <div className="mt-1 flex flex-col gap-2">
          <Input
            id={label}
            type="text"
            inputMode="decimal"
            value={state.value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="0"
            className="h-14 text-2xl font-semibold bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
            readOnly
          />
          <Select value={state.unit} onValueChange={(unit) => onChange(state.value, unit)}>
            <SelectTrigger className="h-11 text-base border-muted-foreground/20">
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              {units.map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{unit.symbol}</span>
                    <span className="text-muted-foreground">{unit.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>
    </div>
  );
};


const Calculator = ({ onInput }: { onInput: (key: string) => void }) => {
    const buttons = [
        '7', '8', '9',
        '4', '5', '6',
        '1', '2', '3',
        '.', '0', 'Backspace',
    ];

    return (
        <Card className="bg-transparent shadow-lg w-full p-4">
            <div className="grid grid-cols-3 gap-2">
                <Button onClick={() => onInput('C')} className="col-span-3 h-16 text-xl font-bold" variant="destructive">C</Button>
                {buttons.map(btn => (
                    <Button 
                        key={btn} 
                        onClick={() => onInput(btn)} 
                        className="h-16 text-xl font-bold" 
                        variant="secondary"
                    >
                       {btn === 'Backspace' ? <Delete className="h-6 w-6"/> : btn}
                    </Button>
                ))}
            </div>
        </Card>
    );
}

export function UnitConverter() {
  const [activeCategory, setActiveCategory] = useState<Category['id']>('length');
  const [from, setFrom] = useState<InputState>(initialStates.length.from);
  const [to, setTo] = useState<InputState>(initialStates.length.to);
  const [activeInput, setActiveInput] = useState<'from' | 'to'>('from');

  const unitsForCategory = useMemo(() => {
    return categories.find(c => c.id === activeCategory)?.units || [];
  }, [activeCategory]);
  
  const performConversion = useCallback((value: string, fromUnitId: string, toUnitId: string, direction: 'from' | 'to') => {
      const currentUnits = categories.find(c => c.id === activeCategory)?.units;
      if (!currentUnits) return;

      const fromUnitExists = currentUnits.some(u => u.id === fromUnitId);
      const toUnitExists = currentUnits.some(u => u.id === toUnitId);

      if (!fromUnitExists || !toUnitExists) return;

      const numericValue = parseFloat(value);
      if (isNaN(numericValue) || !value) {
          const resetState = { value: '' };
          if(direction === 'from') setTo(prev => ({...prev, ...resetState}));
          else setFrom(prev => ({...prev, ...resetState}));
          return;
      }
      
      const result = convert(activeCategory, numericValue, fromUnitId, toUnitId);
      const formattedResult = formatNumber(result);

      if (direction === 'from') {
          setTo(prev => ({ ...prev, value: formattedResult }));
      } else {
          setFrom(prev => ({ ...prev, value: formattedResult }));
      }
  }, [activeCategory]);
  
  useEffect(() => {
    performConversion(from.value, from.unit, to.unit, 'from');
  }, [from.value, from.unit, to.unit, performConversion]);

  const handleFromChange = (value: string, unit?: string) => {
    const newFromUnit = unit || from.unit;
    setFrom({ value, unit: newFromUnit });
  };

  const handleToChange = (value: string, unit?: string) => {
    const newToUnit = unit || to.unit;
    setTo({ value, unit: newToUnit });
  };
  
  useEffect(() => {
    if (activeInput === 'to') {
        performConversion(to.value, to.unit, from.unit, 'to');
    }
  }, [to.value, to.unit, activeInput, from.unit, performConversion]);

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
        performConversion(initial.from.value, initial.from.unit, initial.to.unit, 'from');
    }
  };

  const handleSwap = () => {
    const oldFrom = { ...from };
    const oldTo = { ...to };
    setFrom(oldTo);
    setTo(oldFrom);
    performConversion(oldTo.value, oldTo.unit, oldFrom.unit, 'from');
  };

  const handleCalculatorInput = (key: string) => {
    const handler = activeInput === 'from' ? handleFromChange : handleToChange;
    const state = activeInput === 'from' ? from : to;

    if (key === 'C') {
        handler('');
    } else if (key === 'Backspace') {
        handler(state.value.slice(0, -1));
    } else if (key === '.' && state.value.includes('.')) {
        return; 
    } else {
        handler(state.value + key);
    }
  }

  return (
    <Card className="bg-transparent shadow-lg w-full">
        <CardHeader className="p-4 sm:p-6">
           <Label>Category</Label>
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
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
            <div className="grid lg:grid-cols-2 gap-8">
                <motion.div 
                    key={activeCategory}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col gap-4"
                >
                    <ConversionPanel units={unitsForCategory} state={from} onChange={handleFromChange} label="From" onFocus={() => setActiveInput('from')} isActive={activeInput === 'from'} />
                    
                    <div className="flex justify-center my-2">
                        <Button variant="ghost" size="icon" onClick={handleSwap} className="rounded-full bg-muted hover:bg-primary/10 group" aria-label="Swap units">
                            <ArrowRightLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-transform duration-300 group-hover:rotate-180" />
                        </Button>
                    </div>
                    
                    <ConversionPanel units={unitsForCategory} state={to} onChange={handleToChange} label="To" onFocus={() => setActiveInput('to')} isActive={activeInput === 'to'}/>
                </motion.div>

                <div>
                    <Calculator onInput={handleCalculatorInput} />
                </div>
            </div>
        </CardContent>
    </Card>
  );
}