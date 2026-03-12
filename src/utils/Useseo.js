/**
 * useSEO.js — Hook pour mettre à jour dynamiquement
 * le <title> et les <meta> SEO à chaque changement de page.
 *
 * Usage :
 *   useSEO({ title: 'Nom du produit | BrandPack', description: '...' })
 */

import { useEffect } from 'react'

const SITE_NAME    = 'BrandPack'
const DEFAULT_DESC = 'Emballages personnalisés pour votre business en Algérie — boites, sacs, cartes, papier.'

export function useSEO({ title, description } = {}) {
  useEffect(() => {
    // ── Title ──────────────────────────────────────────
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Emballages personnalisés Algérie`
    document.title = fullTitle

    // ── Meta description ───────────────────────────────
    const desc = description || DEFAULT_DESC
    let metaDesc = document.querySelector('meta[name="description"]')
    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.setAttribute('name', 'description')
      document.head.appendChild(metaDesc)
    }
    metaDesc.setAttribute('content', desc)

    // ── Open Graph (partage Facebook/WhatsApp) ─────────
    setOG('og:title',       fullTitle)
    setOG('og:description', desc)
    setOG('og:site_name',   SITE_NAME)
    setOG('og:type',        'website')

    // Cleanup : remet le titre par défaut quand on quitte la page
    return () => {
      document.title = `${SITE_NAME} — Emballages personnalisés Algérie`
    }
  }, [title, description])
}

function setOG(property, content) {
  let tag = document.querySelector(`meta[property="${property}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('property', property)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}