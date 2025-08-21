
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Copy, RefreshCw, KeyRound, Mic, Pin } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";
import { Open_Sans } from 'next/font/google';

type PasswordType = "random" | "memorable" | "pin";

const openSans = Open_Sans({ subsets: ['latin'], weight: ['700'] });

const commonWords = [
  "ability", "able", "about", "above", "accept", "according", "account", "across", "action", "activity",
  "actually", "add", "address", "administration", "admit", "adult", "affect", "after", "again", "against",
  "agency", "agent", "agree", "agreement", "ahead", "allow", "almost", "alone", "along", "already", "also",
  "although", "always", "american", "among", "amount", "analysis", "and", "animal", "another", "answer",
  "any", "anyone", "anything", "appear", "apply", "approach", "area", "argue", "around", "arrive", "article",
  "artist", "ask", "assume", "attack", "attention", "attorney", "audience", "author", "authority", "available",
  "avoid", "away", "baby", "back", "bad", "bag", "ball", "bank", "bar", "base", "beautiful", "because", "become",
  "bed", "before", "begin", "behavior", "behind", "believe", "benefit", "best", "better", "between", "beyond",
  "big", "bill", "billion", "bit", "black", "blood", "blue", "board", "body", "book", "born", "both", "box",
  "boy", "break", "bring", "brother", "budget", "build", "building", "business", "but", "buy", "call", "camera",
  "campaign", "can", "cancer", "candidate", "capital", "car", "card", "care", "career", "carry", "case", "catch",
  "cause", "cell", "center", "central", "century", "certain", "certainly", "chair", "challenge", "chance",
  "change", "character", "charge", "check", "child", "choice", "choose", "church", "citizen", "city", "civil",
  "claim", "class", "clear", "clearly", "close", "coach", "cold", "collection", "college", "color", "come",
  "commercial", "common", "community", "company", "compare", "computer", "concern", "condition", "conference",
  "congress", "consider", "consumer", "contain", "continue", "control", "cost", "could", "country", "couple",
  "course", "court", "cover", "create", "crime", "cultural", "culture", "cup", "current", "customer", "dark",
  "data", "daughter", "day", "dead", "deal", "death", "debate", "decade", "decide", "decision", "deep", "defense",
  "degree", "democrat", "democratic", "describe", "design", "despite", "detail", "determine", "develop",
  "development", "die", "difference", "different", "difficult", "dinner", "direction", "director", "discover",
  "discuss", "discussion", "disease", "doctor", "dog", "door", "down", "draw", "dream", "drive", "drop", "drug",
  "during", "each", "early", "east", "easy", "eat", "economic", "economy", "edge", "education", "effect", "effort",
  "eight", "either", "election", "else", "employee", "end", "energy", "enjoy", "enough", "enter", "entire",
  "environment", "environmental", "especially", "establish", "even", "evening", "event", "ever", "every",
  "everybody", "everyone", "everything", "evidence", "exactly", "example", "executive", "exist", "expect",
  "experience", "expert", "explain", "eye", "face", "fact", "factor", "fail", "fall", "family", "far", "fast",
  "father", "fear", "federal", "feel", "feeling", "few", "field", "fight", "figure", "fill", "film", "final",
  "finally", "financial", "find", "finding", "fine", "finger", "finish", "fire", "firm", "first", "fish", "five",
  "floor", "fly", "focus", "follow", "food", "foot", "for", "force", "foreign", "forget", "form", "former",
  "forward", "four", "free", "friend", "from", "front", "full", "fund", "future", "game", "garden", "gas",
  "general", "generation", "get", "girl", "give", "glass", "goal", "good", "government", "great", "green",
  "ground", "group", "grow", "growth", "guess", "gun", "guy", "hair", "half", "hand", "hang", "happen", "happy",
  "hard", "have", "head", "health", "hear", "heart", "heat", "heavy", "help", "her", "here", "herself", "high",
  "him", "himself", "his", "history", "hit", "hold", "home", "hope", "hospital", "hot", "hotel", "hour", "house",
  "how", "however", "huge", "human", "hundred", "husband", "idea", "identify", "image", "imagine", "impact",
  "important", "improve", "include", "including", "increase", "indeed", "indicate", "individual", "industry",
  "information", "inside", "instead", "institution", "interest", "interesting", "international", "interview",
  "into", "investment", "involve", "issue", "item", "its", "itself", "job", "join", "just", "keep", "key", "kid",
  "kill", "kind", "kitchen", "know", "knowledge", "land", "language", "large", "last", "late", "later", "laugh",
  "law", "lawyer", "lay", "lead", "leader", "learn", "least", "leave", "left", "leg", "legal", "less", "let",
  "letter", "level", "lie", "life", "light", "like", "likely", "line", "list", "listen", "little", "live", "local",
  "long", "look", "lose", "loss", "lot", "love", "low", "machine", "magazine", "main", "maintain", "major",
  "majority", "make", "man", "manage", "management", "manager", "many", "market", "marriage", "material", "matter",
  "may", "maybe", "mean", "measure", "media", "medical", "meet", "meeting", "member", "memory", "mention",
  "message", "method", "middle", "might", "military", "million", "mind", "minute", "miss", "mission", "model",
  "modern", "moment", "money", "month", "more", "morning", "most", "mother", "mouth", "move", "movement",
  "movie", "mrs", "much", "music", "must", "myself", "name", "nation", "national", "natural", "nature", "near",
  "nearly", "necessary", "need", "network", "never", "new", "news", "newspaper", "next", "nice", "night", "nine",
  "north", "not", "note", "nothing", "notice", "now", "number", "occur", "off", "offer", "office", "officer",
  "official", "often", "oil", "old", "once", "one", "only", "onto", "open", "operation", "opportunity",
  "option", "order", "organization", "other", "others", "our", "out", "outside", "over", "own", "owner", "page",
  "pain", "painting", "paper", "parent", "part", "participant", "particular", "particularly", "partner", "party",
  "pass", "past", "patient", "pattern", "pay", "peace", "people", "per", "perform", "performance", "perhaps",
  "period", "person", "personal", "phone", "physical", "pick", "picture", "piece", "place", "plan", "plant",
  "play", "player", "point", "police", "policy", "political", "politics", "poor", "popular", "population",
  "position", "positive", "possible", "power", "practice", "prepare", "present", "president", "pressure",
  "pretty", "prevent", "price", "private", "probably", "problem", "process", "produce", "product", "production",
  "professional", "professor", "program", "project", "property", "protect", "prove", "provide", "public", "pull",
  "purpose", "push", "put", "quality", "question", "quickly", "quite", "race", "radio", "raise", "range", "rate",
  "rather", "reach", "read", "ready", "real", "reality", "realize", "really", "reason", "receive", "recent",
  "recently", "recognize", "record", "red", "reduce", "reflect", "region", "relate", "relationship", "religious",
  "remain", "remember", "remove", "report", "represent", "republican", "require", "research", "resource",
  "respond", "response", "responsibility", "rest", "result", "return", "reveal", "rich", "right", "rise", "risk",
  "road", "rock", "role", "room", "rule", "run", "safe", "same", "save", "say", "scene", "school", "science",
  "scientist", "score", "sea", "season", "seat", "second", "section", "security", "see", "seek", "seem", "sell",
  "send", "senior", "sense", "series", "serious", "serve", "service", "set", "seven", "several", "sex", "sexual",
  "shake", "share", "she", "shoot", "short", "shot", "should", "shoulder", "show", "side", "sign", "significant",
  "similar", "simple", "simply", "since", "sing", "single", "sister", "sit", "site", "situation", "six", "size",
  "skill", "skin", "small", "smile", "social", "society", "soldier", "some", "somebody", "someone", "something",
  "sometimes", "son", "song", "soon", "sort", "sound", "source", "south", "southern", "space", "speak",
  "special", "specific", "speech", "spend", "sport", "spring", "staff", "stage", "stand", "standard", "star",
  "start", "state", "statement", "station", "stay", "step", "still", "stock", "stop", "store", "story",
  "strategy", "street", "strong", "structure", "student", "study", "stuff", "style", "subject", "success",
  "successful", "such", "suddenly", "suffer", "suggest", "summer", "support", "sure", "surface", "system",
  "table", "take", "talk", "task", "tax", "teach", "teacher", "team", "technology", "television", "tell", "ten",
  "tend", "term", "test", "than", "thank", "that", "the", "their", "them", "themselves", "then", "theory",
  "there", "these", "they", "thing", "think", "third", "this", "those", "though", "thought", "thousand",
  "threat", "three", "through", "throughout", "throw", "thus", "time", "today", "together", "tonight", "too",
  "top", "total", "tough", "toward", "town", "trade", "traditional", "training", "travel", "treat", "treatment",
  "tree", "trial", "trip", "trouble", "true", "truth", "try", "turn", "two", "type", "under", "understand",
  "unit", "until", "upon", "use", "usually", "value", "various", "very", "victim", "view", "violence",
  "visit", "voice", "vote", "wait", "walk", "wall", "want", "war", "watch", "water", "way", "weapon", "wear",
  "week", "weigh", "well", "west", "western", "what", "whatever", "when", "where", "whether", "which", "while",
  "white", "who", "whole", "whom", "whose", "why", "wide", "wife", "will", "win", "wind", "window", "wish",
  "with", "within", "without", "woman", "wonder", "word", "work", "worker", "world", "worry", "would", "write",
  "writer", "wrong", "yard", "yeah", "year", "yes", "yet", "you", "young", "your", "yourself"
];

// Secure random number generator
function getRandomNumber(max: number) {
  const randomValues = new Uint32Array(1);
  crypto.getRandomValues(randomValues);
  return randomValues[0] % max;
}

export function PasswordGenerator() {
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [passwordType, setPasswordType] = useState<PasswordType>("random");

  // Options for random
  const [passwordLength, setPasswordLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);

  // Options for memorable
  const [wordCount, setWordCount] = useState(4);
  const [capitalize, setCapitalize] = useState(true);
  const [useSeparator, setUseSeparator] = useState(true);

  // Options for PIN
  const [pinLength, setPinLength] = useState(4);


  const { toast } = useToast();

  const generatePassword = useCallback(() => {
    let newPassword = "";
    
    if (passwordType === 'random') {
        const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
        const numberChars = "0123456789";
        const symbolChars = "!@#$%^&*()_+~`|}{[]:;?><,./-=";
        let charPool = "";
        if (includeUppercase) charPool += uppercaseChars;
        if (includeLowercase) charPool += lowercaseChars;
        if (includeNumbers) charPool += numberChars;
        if (includeSymbols) charPool += symbolChars;

        if (charPool === "") {
          toast({ variant: "destructive", title: "No character types selected" });
          return;
        }

        for (let i = 0; i < passwordLength; i++) {
            const randomIndex = getRandomNumber(charPool.length);
            newPassword += charPool[randomIndex];
        }
    } else if (passwordType === 'memorable') {
        const words = [];
        for (let i = 0; i < wordCount; i++) {
            const randomIndex = getRandomNumber(commonWords.length);
            let word = commonWords[randomIndex];
            if (capitalize) {
              word = word.charAt(0).toUpperCase() + word.slice(1);
            }
            words.push(word);
        }
        newPassword = words.join(useSeparator ? '-' : '');
    } else if (passwordType === 'pin') {
        const numberChars = "0123456789";
        for (let i = 0; i < pinLength; i++) {
            const randomIndex = getRandomNumber(numberChars.length);
            newPassword += numberChars[randomIndex];
        }
    }
    
    setPassword(newPassword);
    setCopied(false);
  }, [
    passwordType, passwordLength, includeUppercase, includeLowercase, includeNumbers, includeSymbols, 
    wordCount, capitalize, useSeparator, 
    pinLength, 
    toast
  ]);
  
  useEffect(() => {
    generatePassword();
  }, [generatePassword]);


  const copyToClipboard = () => {
    if (password) {
      navigator.clipboard.writeText(password);
      setCopied(true);
      toast({
        variant: 'success',
        title: "Password Copied!",
        description: "Your new password is safe in your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getLengthConfig = () => {
      switch (passwordType) {
          case 'random': return { value: passwordLength, setter: setPasswordLength, min: 4, max: 100, step: 1 };
          case 'memorable': return { value: wordCount, setter: setWordCount, min: 3, max: 15, step: 1 };
          case 'pin': return { value: pinLength, setter: setPinLength, min: 3, max: 12, step: 1 };
      }
  }

  const lengthConfig = getLengthConfig();

  const passwordTypeOptions = [
    { value: 'random' as PasswordType, label: 'Random', icon: <KeyRound className="w-4 h-4"/> },
    { value: 'memorable' as PasswordType, label: 'Memorable', icon: <Mic className="w-4 h-4"/> },
    { value: 'pin' as PasswordType, label: 'PIN', icon: <Pin className="w-4 h-4"/> },
  ]
  
  const [activeTab, setActiveTab] = useState(passwordType);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const [activeTabRect, setActiveTabRect] = useState<{ width: number, left: number } | null>(null);

  useEffect(() => {
    setActiveTab(passwordType);
  }, [passwordType]);

  useEffect(() => {
    function calculateRect() {
      const activeTabIndex = passwordTypeOptions.findIndex(opt => opt.value === activeTab);
      const activeTabElement = tabsRef.current[activeTabIndex];
      if (activeTabElement) {
        setActiveTabRect({
          width: activeTabElement.clientWidth,
          left: activeTabElement.offsetLeft
        });
      }
    }
    calculateRect();
    window.addEventListener('resize', calculateRect);
    return () => window.removeEventListener('resize', calculateRect);
  }, [activeTab]);
  
  const isNumber = (char: string) => !isNaN(parseInt(char, 10));
  const isSymbol = (char: string) => "!@#$%^&*()_+~`|}{[]:;?><,./-=".includes(char);


  return (
    <div className="space-y-6">
        <Card className="bg-transparent shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">Your New Password</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative">
                    <div
                        className="pr-24 text-lg h-12 w-full flex items-center rounded-md border border-input bg-background px-3 py-2"
                    >
                        <div className={cn("flex items-center flex-wrap h-full font-mono", openSans.className)}>
                            {password.split('').map((char, index) => (
                                <span
                                    key={index}
                                    className={cn(
                                        'font-bold',
                                        isNumber(char) && 'text-blue-500 dark:text-blue-400',
                                        isSymbol(char) && 'text-red-500 dark:text-red-400'
                                    )}
                                >
                                    {char}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="absolute top-1/2 right-2 -translate-y-1/2 flex gap-1">
                        <Button variant="ghost" size="icon" onClick={generatePassword} title="Generate new password">
                            <RefreshCw className="w-5 h-5"/>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={copyToClipboard} title="Copy to clipboard">
                            <AnimatePresence mode="wait">
                                {copied ? (
                                    <motion.div key="check" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                                        <Check className="w-5 h-5 text-green-500"/>
                                    </motion.div>
                                ) : (
                                    <motion.div key="copy" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                                        <Copy className="w-5 h-5"/>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
        
        <Card className="bg-transparent shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">Customization Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div>
                    <Label className="font-semibold text-base mb-2 block">Password Type</Label>
                     <Tabs
                        value={passwordType}
                        onValueChange={(v) => setPasswordType(v as PasswordType)}
                    >
                        <TabsList className="relative grid w-full grid-cols-3 bg-[#F4F4F5] dark:bg-muted p-1 rounded-lg h-11">
                        {passwordTypeOptions.map((opt, i) => (
                          <TabsTrigger
                            key={opt.value}
                            value={opt.value}
                            ref={(el) => (tabsRef.current[i] = el)}
                            className={cn(
                              "relative z-10 flex items-center justify-center gap-1.5 p-2 rounded-md cursor-pointer transition-colors text-xs sm:text-sm data-[state=inactive]:bg-transparent",
                              passwordType !== opt.value && "text-muted-foreground hover:text-primary "
                            )}
                          >
                            {opt.icon}
                            <span>{opt.label}</span>
                          </TabsTrigger>
                        ))}
                         {activeTabRect && (
                            <motion.div
                                layoutId="active-tab-indicator"
                                className="absolute bg-background rounded-md shadow-sm h-[calc(100%-0.5rem)] p-1.5"
                                style={{
                                    width: activeTabRect.width,
                                    left: activeTabRect.left,
                                }}
                                transition={{ type: "tween", ease: "easeOut", duration: 0.2 }}
                            />
                         )}
                        </TabsList>
                    </Tabs>
                </div>

                <div className="pt-4 border-t">
                     <Label className="font-semibold text-base">
                        {passwordType === 'memorable' ? 'Word Count' : 'Length'}: <span className="font-bold text-primary">{lengthConfig.value}</span>
                    </Label>
                    <Slider 
                        value={[lengthConfig.value]} 
                        onValueChange={([val]) => lengthConfig.setter(val)} 
                        min={lengthConfig.min} 
                        max={lengthConfig.max} 
                        step={lengthConfig.step}
                        className="mt-2"
                    />
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={passwordType}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                    {passwordType === 'random' && (
                        <div className="pt-4 border-t space-y-4">
                            <h3 className="font-semibold text-base">Additional Options</h3>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="uppercase" className="cursor-pointer text-sm">Uppercase (A-Z)</Label>
                                    <Switch id="uppercase" checked={includeUppercase} onCheckedChange={setIncludeUppercase} />
                                </div>
                                 <div className="flex items-center justify-between">
                                    <Label htmlFor="lowercase" className="cursor-pointer text-sm">Lowercase (a-z)</Label>
                                    <Switch id="lowercase" checked={includeLowercase} onCheckedChange={setIncludeLowercase} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="numbers" className="cursor-pointer text-sm">Numbers (0-9)</Label>
                                    <Switch id="numbers" checked={includeNumbers} onCheckedChange={setIncludeNumbers} />
                                </div>
                                 <div className="flex items-center justify-between">
                                    <Label htmlFor="symbols" className="cursor-pointer text-sm">Symbols (!@#)</Label>
                                    <Switch id="symbols" checked={includeSymbols} onCheckedChange={setIncludeSymbols} />
                                </div>
                            </div>
                        </div>
                    )}
                     {passwordType === 'memorable' && (
                        <div className="pt-4 border-t space-y-4">
                            <h3 className="font-semibold text-base">Additional Options</h3>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="capitalize" className="cursor-pointer text-sm">Capitalize Words</Label>
                                    <Switch id="capitalize" checked={capitalize} onCheckedChange={setCapitalize} />
                                </div>
                                 <div className="flex items-center justify-between">
                                    <Label htmlFor="separator" className="cursor-pointer text-sm">Use a Separator</Label>
                                    <Switch id="separator" checked={useSeparator} onCheckedChange={setUseSeparator} />
                                </div>
                            </div>
                        </div>
                    )}
                    </motion.div>
                </AnimatePresence>
            </CardContent>
        </Card>
    </div>
  );
}
