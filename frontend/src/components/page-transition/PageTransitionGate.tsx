"use client";

import { useEffect, useMemo, useState } from "react";
import { useStyles } from "./styles";

const OPENING_DURATION_MS = 1200;

const wasHardReload = () => {
  if (typeof performance === "undefined") {
    return false;
  }

  const entries = performance.getEntriesByType("navigation");
  if (entries.length > 0) {
    const nav = entries[0] as PerformanceNavigationTiming;
    return nav.type === "reload";
  }

  const legacy = performance as Performance & {
    navigation?: { type?: number };
  };
  return legacy.navigation?.type === 1;
};

export const PageTransitionGate = () => {
  const { styles, cx } = useStyles();
  const [isOpening, setIsOpening] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (wasHardReload()) {
      const startTimer = window.setTimeout(() => {
        setIsOpening(true);
      }, 0);
      const stopTimer = window.setTimeout(() => {
        setIsOpening(false);
      }, OPENING_DURATION_MS);

      return () => {
        window.clearTimeout(startTimer);
        window.clearTimeout(stopTimer);
      };
    }

    return undefined;
  }, []);

  useEffect(() => {
    const handleLeaving = () => {
      setIsLeaving(true);
      const overlay = document.getElementById("global-transition-overlay");
      if (overlay) {
        overlay.setAttribute("data-leaving", "true");
        overlay.style.opacity = "1";
      }
    };

    window.addEventListener("beforeunload", handleLeaving);
    window.addEventListener("pagehide", handleLeaving);

    return () => {
      window.removeEventListener("beforeunload", handleLeaving);
      window.removeEventListener("pagehide", handleLeaving);
    };
  }, []);

  const visible = useMemo(() => isOpening || isLeaving, [isOpening, isLeaving]);
  const rootClassName = useMemo(() => {
    const list = [styles.root];
    if (visible) {
      list.push(styles.visible);
    }
    if (isOpening) {
      list.push(styles.opening);
    }
    if (isLeaving) {
      list.push(styles.closing);
    }

    return list.join(" ");
  }, [isLeaving, isOpening, styles.closing, styles.opening, styles.root, styles.visible, visible]);

  return (
    <div className={styles.globalAnimations}>
      <div
        id="global-transition-overlay"
        aria-hidden
        className={rootClassName}
      >
        <div className={cx(styles.ring)} />
        <div className={cx(styles.ring, styles.ringSecondary)} />
        <div className={cx(styles.ring, styles.ringTertiary)} />

        <div className={cx(styles.shard, styles.shardA)} />
        <div className={cx(styles.shard, styles.shardB)} />
        <div className={cx(styles.shard, styles.shardC)} />

        <div className={styles.centerLabel}>Mosaic Talent</div>
      </div>
    </div>
  );
};
