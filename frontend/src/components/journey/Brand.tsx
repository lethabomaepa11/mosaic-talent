"use client";

import Link from "next/link";
import Image from "next/image";
import { useAppearanceState } from "@/providers/appearance-provider";
import { useJourneyStyles } from "./styles";

export const Brand = ({ compact = false }: { compact?: boolean }) => {
  const { styles } = useJourneyStyles();
  const { mode } = useAppearanceState();
  const source = compact ? "/logo.svg" : mode === "light" ? "/text-logo-light.svg" : "/text-logo.svg";

  return <Link href="/" className={styles.brand} aria-label="mosaic.talent home">
    <Image src={source} alt="mosaic.talent" width={compact ? 32 : 144} height={compact ? 32 : 23}
      className={compact ? styles.brandCompactImage : styles.brandImage} fetchPriority="high"/>
  </Link>;
};
