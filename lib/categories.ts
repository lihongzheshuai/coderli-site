export function getCategoryLink(parent: string, child?: string): string {
  if (parent === 'CSP/NOIP') {
    return child ? `/categories/CSP/NOIP/${encodeURIComponent(child)}/` : `/categories/CSP/NOIP/`;
  }
  return child ? `/categories/${encodeURIComponent(parent)}/${encodeURIComponent(child)}/` : `/categories/${encodeURIComponent(parent)}/`;
}
