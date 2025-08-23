

"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categories, Unit, Category, convert, formatNumber } from "@/lib/unit-data";
import { ArrowRightLeft } from "lucide-react";
import { Button } from "./ui/button";

type InputState = {
  value: string;
  unit: string;
};

const initialStates: Record<Category['id'], { from: InputState, to: InputState }> = {
  length: { from: { value: '1', unit: 'meters' }, to: { value: '', unit: 'feet' } },
  mass: { from: { value: '1', unit: 'kilograms' }, to: { value: '', unit: 'pounds' } },
  temperature: { from: { value: '0', unit: 'celsius' }, to: { value: '', unit: 'fahrenheit' } },
  time: { from: { value: '1', unit: 'seconds' }, to: { value: '', unit: 'minutes' } },
  volume: { from: { value: '1', unit: 'liters' }, to: { value: '', unit: 'gallons-us' } },
  speed: { from: { value: '1', unit: 'kph' }, to: { value: '', unit: 'miles-per-hour' } },
  area: { from: { value: '1', unit: 'sq-meters' }, to: { value: '', unit: 'sq-feet' } },
  data: { from: { value: '1024', unit: 'megabytes' }, to: { value: '', unit: 'gigabytes' } },
  'numeral-system': { from: { value: '10', unit: 'decimal' }, to: { value: '', unit: 'binary' } },
};

const CategorySelector = React.memo(({ activeCategory, onCategoryChange }: { activeCategory: Category['id'], onCategoryChange: (id: string) => void }) => {
  return (
    <Select value={activeCategory} onValueChange={onCategoryChange}>
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
  )
});
CategorySelector.displayName = 'CategorySelector';

const UnitSelector = React.memo(({ value, onChange, units }: { value: string, onChange: (unit: string) => void, units: Unit[] }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="w-full sm:w-[220px]"><SelectValue /></SelectTrigger>
    <SelectContent>
      {units.map(unit => (
        <SelectItem key={unit.id} value={unit.id}>
          {unit.name} ({unit.symbol})
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
));
UnitSelector.displayName = 'UnitSelector';


export function UnitConverter() {
  const [activeCategory, setActiveCategory] = useState<Category['id']>('length');
  const [from, setFrom] = useState<InputState>(initialStates.length.from);
  const [to, setTo] = useState<InputState>(initialStates.length.to);
  const [lastActive, setLastActive] = useState<'from' | 'to'>('from');

  const unitsForCategory = useMemo(() => {
    return categories.find(c => c.id === activeCategory)?.units || [];
  }, [activeCategory]);

  const performConversion = useCallback(() => {
    const currentUnits = categories.find(c => c.id === activeCategory)?.units;
    if (!currentUnits) return;

    const fromUnitExists = currentUnits.some(u => u.id === from.unit);
    const toUnitExists = currentUnits.some(u => u.id === to.unit);
    if (!fromUnitExists || !toUnitExists) return;

    if (lastActive === 'from') {
      const valueToConvert = from.value;
      if (!valueToConvert) {
        setTo(prev => ({ ...prev, value: '' }));
        return;
      }
      const result = convert(activeCategory, valueToConvert, from.unit, to.unit);
      setTo(prev => ({ ...prev, value: formatNumber(result) }));
    } else {
      const valueToConvert = to.value;
      if (!valueToConvert) {
        setFrom(prev => ({ ...prev, value: '' }));
        return;
      }
      const result = convert(activeCategory, valueToConvert, to.unit, from.unit);
      setFrom(prev => ({ ...prev, value: formatNumber(result) }));
    }
  }, [activeCategory, from.value, from.unit, to.value, to.unit, lastActive]);

  useEffect(() => {
    performConversion();
  }, [performConversion]);

  const handleValueChange = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<InputState>>,
    activeSetter: () => void
  ) => {
    if (activeCategory === 'numeral-system') {
      const selectedUnit = lastActive === 'from' ? from.unit : to.unit;
      let regex = /.*/;

      switch (selectedUnit) {
        case 'binary':
          regex = /^[01.]*$/;
          break;
        case 'octal':
          regex = /^[0-7.]*$/;
          break;
        case 'decimal':
          regex = /^-?\d*(\.\d*)?$/;
          break;
        case 'hexadecimal':
          regex = /^[0-9a-fA-F.]*$/i;
          break;
      }
      
      if (value !== "" && !regex.test(value)) return;
      if ((value.match(/\./g) || []).length > 1) return;

    } else {
      if (value !== "" && value !== "-" && !/^-?\d*(\.\d*)?$/.test(value)) return;
    }
    setter(prev => ({ ...prev, value: value }));
    activeSetter();
  };

  const handleUnitChange = (
    unit: string,
    setter: React.Dispatch<React.SetStateAction<InputState>>,
    activeSetter: () => void
  ) => {
    setter(prev => ({ ...prev, unit, value: '' }));
    activeSetter();
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
      setLastActive('from');
    }
  };

  const handleSwap = () => {
    const oldFrom = { ...from };
    const oldTo = { ...to };
    setFrom(oldTo);
    setTo(oldFrom);
    setLastActive(lastActive === 'from' ? 'to' : 'from');
  };

  const isNumeralSystem = activeCategory === 'numeral-system';

  return (
    <Card className="bg-transparent shadow-lg w-full">
      <CardHeader>
        <CategorySelector activeCategory={activeCategory} onCategoryChange={handleCategoryChange} />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="from-value">From</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input id="from-value" type="text" value={from.value} onChange={e => handleValueChange(e.target.value, setFrom, () => setLastActive('from'))} />
              <UnitSelector value={from.unit} onChange={unit => handleUnitChange(unit, setFrom, () => setLastActive('from'))} units={unitsForCategory} />
            </div>
          </div>

          <div className="flex justify-center">
            <Button variant="ghost" size="icon" onClick={handleSwap} className="rounded-full bg-muted hover:bg-primary/10 group">
              <ArrowRightLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-transform duration-300 group-hover:rotate-180" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="to-value">To</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input id="to-value" type="text" value={to.value} onChange={e => handleValueChange(e.target.value, setTo, () => setLastActive('to'))} />
              <UnitSelector value={to.unit} onChange={unit => handleUnitChange(unit, setTo, () => setLastActive('to'))} units={unitsForCategory} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
