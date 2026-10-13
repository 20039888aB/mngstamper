import { useEffect } from 'react'

/**
 * Client-side SEO helper for this single-page app. Sets the document title and
 * meta description per route so JS-rendering crawlers (Google, social link
 * previewers that execute JS) see page-specific metadata as the user navigates.
 *
 * Titles are composed as `Page — Universal Rubber Stamp` (home shows just the
 * brand title). Missing descriptions leave the index.html default untouched.
 */

const BRAND = 'Universal Rubber Stamp'

function setMetaDescription(content: string) {
  let tag = document.querySelector('meta[name="description"]')
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', 'description')
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

export function useDocumentMeta(page?: string, description?: string): void {
  useEffect(() => {
    const previousTitle = document.title
    document.title = page ? `${page} — ${BRAND}` : BRAND
    if (description) setMetaDescription(description)
    return () => {
      document.title = previousTitle
    }
  }, [page, description])
}
