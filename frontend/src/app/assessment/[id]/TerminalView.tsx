"use client";

import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

type Props = {
  lines: string[];
  className?: string;
};

export const TerminalView = ({ lines, className }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!containerRef.current || termRef.current) return;
    const terminal = new Terminal({
      convertEol: true,
      theme: {
        background: "#0f172a",
        foreground: "#e2e8f0",
      },
      fontSize: 12,
      fontFamily: "ui-monospace, Menlo, Consolas, monospace",
    });
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(containerRef.current);
    fitAddon.fit();
    termRef.current = terminal;
    fitRef.current = fitAddon;

    const resize = () => fitAddon.fit();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      terminal.dispose();
      termRef.current = null;
      fitRef.current = null;
    };
  }, []);

  useEffect(() => {
    const terminal = termRef.current;
    if (!terminal) return;
    terminal.clear();
    lines.slice(0, 40).reverse().forEach((line) => terminal.writeln(line));
    fitRef.current?.fit();
  }, [lines]);

  return <div ref={containerRef} className={className} />;
};

