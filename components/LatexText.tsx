import React from 'react';
import katex from 'katex';

interface LatexTextProps {
  text: string;
  className?: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Server-side parser for inline math ($...$) and block math ($$...$$) in plain text.
 * Escapes non-math segments to prevent XSS and avoids shipping KaTeX JS to browsers.
 */
export function parseLatexInText(text: string): string {
  if (!text || !text.includes('$')) return escapeHtml(text || '');

  const regex = /\$\$([^\$]+?)\$\$|\$([^\$\n]+?)\$/g;
  let lastIndex = 0;
  let result = '';
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result += escapeHtml(text.slice(lastIndex, match.index));
    }

    const fullMatch = match[0];
    const blockFormula = match[1];
    const inlineFormula = match[2];
    const formula = (blockFormula || inlineFormula)?.trim();

    if (!formula || /^[A-Z0-9_]{3,}$/.test(formula) || /^\d+$/.test(formula)) {
      result += escapeHtml(fullMatch);
    } else {
      try {
        result += katex.renderToString(formula, {
          output: 'html',
          throwOnError: false,
          strict: false,
          displayMode: !!blockFormula,
        });
      } catch {
        result += escapeHtml(fullMatch);
      }
    }

    lastIndex = match.index + fullMatch.length;
  }

  if (lastIndex < text.length) {
    result += escapeHtml(text.slice(lastIndex));
  }

  return result;
}

export default function LatexText({ text, className = '' }: LatexTextProps) {
  if (!text) return null;
  if (!text.includes('$')) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: parseLatexInText(text) }}
    />
  );
}
