'use client';

import React, { useMemo } from 'react';
import katex from 'katex';

interface LatexTextProps {
  text: string;
  className?: string;
}

/**
 * Parses inline math ($...$) and block math ($$...$$) in plain text
 * using KaTeX and outputs HTML markup.
 */
export function parseLatexInText(text: string): string {
  if (!text || !text.includes('$')) return text;

  return text.replace(/\$\$([^\$]+?)\$\$|\$([^\$\n]+?)\$/g, (match, blockFormula, inlineFormula) => {
    const formula = (blockFormula || inlineFormula)?.trim();
    if (!formula) return match;

    // Filter out bash variables (like $JAVA_HOME, $PATH) and standalone numbers ($100)
    if (/^[A-Z0-9_]{3,}$/.test(formula) || /^\d+$/.test(formula)) {
      return match;
    }

    try {
      return katex.renderToString(formula, {
        throwOnError: false,
        displayMode: !!blockFormula,
      });
    } catch {
      return match;
    }
  });
}

export default function LatexText({ text, className = '' }: LatexTextProps) {
  const rendered = useMemo(() => {
    return parseLatexInText(text);
  }, [text]);

  if (!text) return null;
  if (!text.includes('$')) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
}
