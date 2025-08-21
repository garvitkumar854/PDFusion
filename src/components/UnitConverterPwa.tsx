
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categories, Category, convert, formatNumber } from "@/lib/unit-data";
import { ArrowRightLeft, Delete } from "lucide-react";
import { Button } from "./ui/button";
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

const CalculatorButton = ({ children, className, ...props }: React.ComponentProps<typeof Button>) => (
    <Button 
        className={cn("h-full w-full text-2xl font-bold rounded-xl shadow-sm", className)} 
        variant="secondary"
        {...props}
    >
        {children}
    </Button>
);


const Calculator = ({ onInput, activeCategory }: { onInput: (key: string) => void; activeCategory: Category['id'] }) => {
    const isTemp = activeCategory === 'temperature';
    const baseButtons = [
        { key: '7', label: '7', pos: 'col-start-1 row-start-1' },
        { key: '8', label: '8', pos: 'col-start-2 row-start-1' },
        { key: '9', label: '9', pos: 'col-start-3 row-start-1' },

        { key: '4', label: '4', pos: 'col-start-1 row-start-2' },
        { key: '5', label: '5', pos: 'col-start-2 row-start-2' },
        { key: '6', label: '6', pos: 'col-start-3 row-start-2' },

        { key: '1', label: '1', pos: 'col-start-1 row-start-3' },
        { key: '2', label: '2', pos: 'col-start-2 row-start-3' },
        { key: '3', label: '3', pos: 'col-start-3 row-start-3' },

        { key: 'Swap', label: <ArrowRightLeft className="h-7 w-7"/>, pos: 'col-start-1 row-start-4', className: 'text-primary' },
        { key: '0', label: '0', pos: 'col-start-2 row-start-4' },
        { key: '.', label: '.', pos: 'col-start-3 row-start-4' },
    ];

    return (
        <div className="grid grid-cols-4 grid-rows-4 gap-2 h-full">
            {/* Base buttons */}
            {baseButtons.map(btn => (
                 <CalculatorButton key={btn.key} onClick={() => onInput(btn.key)} className={cn(btn.pos, btn.className)}>
                    {btn.label}
                 </CalculatorButton>
            ))}

            {/* Action Column */}
            {isTemp ? (
                <>
                    <CalculatorButton onClick={() => onInput('C')} className="bg-red-500/80 hover:bg-red-500 text-white col-start-4 row-start-1 row-span-2">AC</CalculatorButton>
                    <CalculatorButton onClick={() => onInput('Backspace')} className="col-start-4 row-start-3"><Delete className="h-7 w-7"/></CalculatorButton>
                    <CalculatorButton onClick={() => onInput('+/-')} className="col-start-4 row-start-4">+/-</CalculatorButton>
                </>
            ) : (
                <>
                    <CalculatorButton onClick={() => onInput('C')} className="bg-red-500/80 hover:bg-red-500 text-white col-start-4 row-start-1 row-span-2">AC</CalculatorButton>
                    <CalculatorButton onClick={() => onInput('Backspace')} className="col-start-4 row-start-3 row-span-2"><Delete className="h-7 w-7"/></CalculatorButton>
                </>
            )}
        </div>
    );
}

const DisplayPanel = ({ value, unit, units, onUnitChange, isActive, onClick }: { value: string, unit: string, units: any[], onUnitChange: (unit:string) => void, isActive: boolean, onClick: () => void}) => {
    const displayValue = value || '0';
    const [fontSize, setFontSize] = useState('3rem');

    useEffect(() => {
        const len = displayValue.length;
        if (len > 12) setFontSize('1.8rem');
        else if (len > 9) setFontSize('2rem');
        else if (len > 7) setFontSize('2.5rem');
        else setFontSize('3rem');
    }, [displayValue]);
    
    return (
        <div 
            className={cn(
                "relative p-4 rounded-lg bg-muted/50 border-2 transition-all h-24 flex flex-col justify-center",
                isActive ? 'border-primary shadow-md' : 'border-transparent'
            )}
            onClick={onClick}
        >
            <div className="flex justify-between items-center">
               <div style={{ fontSize }} className="font-bold truncate transition-all duration-200">{displayValue}</div>
               <Select value={unit} onValueChange={onUnitChange}>
                    <SelectTrigger className="w-auto border-0 bg-transparent text-lg font-semibold pr-0">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {units.map(u => 
                          <SelectItem key={u.id} value={u.id}>
                              <div className="flex items-center gap-2">
                                <span>{u.name} ({u.symbol})</span>
                              </div>
                          </SelectItem>
                        )}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};


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
    setActiveInput('from');
  }

  const handleToUnitChange = (unit: string) => {
    setTo(prev => ({...prev, unit}));
    setActiveInput('to');
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
    <div className="flex flex-col h-full bg-background">
        <div className="p-2 shrink-0">
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
        
        <div className="flex flex-col p-2 gap-2 shrink-0">
            <DisplayPanel 
                value={from.value} 
                unit={from.unit} 
                units={unitsForCategory}
                onUnitChange={handleFromUnitChange}
                isActive={activeInput === 'from'}
                onClick={() => setActiveInput('from')}
            />
            <DisplayPanel 
                value={to.value} 
                unit={to.unit} 
                units={unitsForCategory}
                onUnitChange={handleToUnitChange}
                isActive={activeInput === 'to'}
                onClick={() => setActiveInput('to')}
            />
        </div>

        <div className="flex-grow p-2">
            <Calculator onInput={handleCalculatorInput} activeCategory={activeCategory} />
        </div>
    </div>
  );
}
