'use client';

import { useState } from 'react';
import Link from 'next/link';
import AnimatedArrow from '@/components/AnimatedArrow';
import { Button } from '@/components/ui/button';

export default function AboutCTAButton() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Button
      asChild
      size="lg"
      className="btn-animated-gradient font-bold text-base shadow-md hover:shadow-lg transition-all group w-full sm:w-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href="/#services">
        Start Exploring Now
        <AnimatedArrow isHovered={isHovered} />
      </Link>
    </Button>
  );
}
