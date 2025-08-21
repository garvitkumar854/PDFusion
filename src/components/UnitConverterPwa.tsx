
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

const Calculator = ({ onInput, showPlusMinus }: { onInput: (key: string) => void; showPlusMinus: boolean }) => {
    const ButtonLayout = ({ children, className, ...props }: React.ComponentProps<typeof Button>) => (
        <Button 
            className={cn("h-full w-full text-2xl font-bold rounded-2xl shadow-sm", className)} 
            variant="secondary"
            {...props}
        >
            {children}
        </Button>
    );

    return (
        <div className="grid grid-cols-4 grid-rows-5 gap-2 h-full">
            {/* Row 1 */}
            <ButtonLayout onClick={() => onInput('7')}>7</ButtonLayout>
            <ButtonLayout onClick={() => onInput('8')}>8</ButtonLayout>
            <ButtonLayout onClick={() => onInput('9')}>9</ButtonLayout>
            
            {/* Row 2 */}
            <ButtonLayout onClick={() => onInput('4')}>4</ButtonLayout>
            <ButtonLayout onClick={() => onInput('5')}>5</ButtonLayout>
            <ButtonLayout onClick={() => onInput('6')}>6</ButtonLayout>
            
            {/* Row 3 */}
            <ButtonLayout onClick={() => onInput('1')}>1</ButtonLayout>
            <ButtonLayout onClick={() => onInput('2')}>2</ButtonLayout>
            <ButtonLayout onClick={() => onInput('3')}>3</ButtonLayout>
            
             {/* Row 4 */}
            <ButtonLayout onClick={() => onInput('0')} className="col-span-2">0</ButtonLayout>
            <ButtonLayout onClick={() => onInput('.')}>.</ButtonLayout>
            
            {/* Row 5 */}
            <ButtonLayout onClick={() => onInput('Swap')} className="col-span-3"><ArrowRightLeft className="h-7 w-7"/></ButtonLayout>

            {/* Action Column */}
            {showPlusMinus ? (
                <>
                  <ButtonLayout onClick={() => onInput('C')} className="bg-red-500/80 hover:bg-red-500 text-white row-start-1">AC</ButtonLayout>
                  <ButtonLayout onClick={() => onInput('Backspace')} className="row-start-2"><Delete className="h-7 w-7"/></ButtonLayout>
                  <ButtonLayout onClick={() => onInput('+/-')} className="row-start-3">+/-</ButtonLayout>
                </>
            ) : (
                <>
                    <ButtonLayout onClick={() => onInput('C')} className="bg-red-500/80 hover:bg-red-500 text-white row-span-2">AC</ButtonLayout>
                    <ButtonLayout onClick={() => onInput('Backspace')} className="row-span-3"><Delete className="h-7 w-7"/></ButtonLayout>
                </>
            )}
        </div>
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
            <div 
                className={cn(
                    "relative p-4 rounded-lg bg-muted/50 border-2 transition-all",
                    activeInput === 'from' ? 'border-primary shadow-md' : 'border-transparent'
                )}
                onClick={() => setActiveInput('from')}
            >
                <div className="flex justify-between items-center">
                   <div className="text-3xl font-bold truncate">{from.value || '0'}</div>
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
                    activeInput === 'to' ? 'border-primary shadow-md' : 'border-transparent'
                )}
                onClick={() => setActiveInput('to')}
            >
                 <div className="flex justify-between items-center">
                    <div className="text-3xl font-bold truncate">{to.value || '0'}</div>
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

        <div className="flex-grow p-2">
            <Calculator onInput={handleCalculatorInput} showPlusMinus={activeCategory === 'temperature'} />
        </div>
    </div>
  );
}
