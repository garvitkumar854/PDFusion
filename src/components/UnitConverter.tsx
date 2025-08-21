
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { categories, Unit, Category, convert, formatNumber } from "@/lib/unit-data";
import { ArrowRightLeft } from "lucide-react";
import { Button } from "./ui/button";
import { motion } from "framer-motion";

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
}: {
  units: Unit[];
  state: InputState;
  onChange: (value: string, unit?: string) => void;
  label: string;
}) => {
  return (
    <div className="flex-1 space-y-2">
      <Label htmlFor={label} className="text-sm text-muted-foreground">{label}</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Input
          id={label}
          type="number"
          value={state.value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          className="h-12 text-lg"
        />
        <Select value={state.unit} onValueChange={(unit) => onChange(state.value, unit)}>
          <SelectTrigger className="h-12 text-lg">
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
    </div>
  );
};


export function UnitConverter() {
  const [activeCategory, setActiveCategory] = useState<Category['id']>('length');
  const [from, setFrom] = useState<InputState>(initialStates.length.from);
  const [to, setTo] = useState<InputState>(initialStates.length.to);

  const unitsForCategory = useMemo(() => {
    return categories.find(c => c.id === activeCategory)?.units || [];
  }, [activeCategory]);
  
  const performConversion = useCallback((value: string, fromUnit: string, toUnit: string, direction: 'from' | 'to') => {
      const numericValue = parseFloat(value);
      const currentUnits = categories.find(c => c.id === activeCategory)?.units || [];
      const fromUnitExists = currentUnits.some(u => u.id === fromUnit);
      const toUnitExists = currentUnits.some(u => u.id === toUnit);

      if (isNaN(numericValue) || !value || !fromUnitExists || !toUnitExists) {
          const resetState = { value: '' };
          if(direction === 'from') setTo(prev => ({...prev, ...resetState}));
          else setFrom(prev => ({...prev, ...resetState}));
          return;
      }
      
      const result = convert(activeCategory, numericValue, fromUnit, toUnit);
      const formattedResult = formatNumber(result);

      if (direction === 'from') {
          setTo(prev => ({ ...prev, value: formattedResult }));
      } else {
          setFrom(prev => ({ ...prev, value: formattedResult }));
      }
  }, [activeCategory]);
  
  useEffect(() => {
    // Initial conversion or when units change
    performConversion(from.value, from.unit, to.unit, 'from');
  }, [from.value, from.unit, to.unit, performConversion]);

  const handleFromChange = (value: string, unit?: string) => {
    const newFromUnit = unit || from.unit;
    setFrom({ value, unit: newFromUnit });
    performConversion(value, newFromUnit, to.unit, 'from');
  };

  const handleToChange = (value: string, unit?: string) => {
    const newToUnit = unit || to.unit;
    setTo({ value, unit: newToUnit });
    performConversion(value, newToUnit, from.unit, 'to');
  };

  const handleCategoryChange = (categoryId: string) => {
    const newCategory = categoryId as Category['id'];
    const initial = initialStates[newCategory];
    
    // Set all state updates together to avoid intermediate renders with inconsistent state
    setActiveCategory(newCategory);
    setFrom(initial.from);
    setTo(initial.to);
    
    // Perform conversion in a subsequent effect or directly if logic is simple
    // This ensures state is fully updated before attempting conversion
    performConversion(initial.from.value, initial.from.unit, initial.to.unit, 'from');
  };

  const handleSwap = () => {
    const oldFrom = { ...from };
    const oldTo = { ...to };
    setFrom(oldTo);
    setTo(oldFrom);
    performConversion(oldTo.value, oldTo.unit, oldFrom.unit, 'from');
  };

  return (
    <Card className="bg-transparent shadow-lg w-full">
      <CardHeader className="p-4 sm:p-6">
        <Tabs value={activeCategory} onValueChange={handleCategoryChange}>
          <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 h-auto p-1">
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id} className="flex flex-col sm:flex-row gap-2 h-14 sm:h-auto sm:py-2">
                <category.icon className="h-5 w-5" />
                <span>{category.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <motion.div 
            key={activeCategory}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col lg:flex-row items-center gap-4"
        >
          <ConversionPanel units={unitsForCategory} state={from} onChange={handleFromChange} label="From" />
          
          <div className="flex-shrink-0 my-2 lg:my-0">
             <Button variant="ghost" size="icon" onClick={handleSwap} className="rounded-full bg-muted hover:bg-primary/10 group mt-6" aria-label="Swap units">
                <ArrowRightLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-transform duration-300 group-hover:rotate-180" />
            </Button>
          </div>
          
          <ConversionPanel units={unitsForCategory} state={to} onChange={handleToChange} label="To" />
        </motion.div>
      </CardContent>
    </Card>
  );
}
