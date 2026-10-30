"use client"

import { useEffect } from "react"

/** Realce progressivo: o conteúdo continua visível sem JavaScript ou animações. */
export function MovimentoLanding() {
  useEffect(() => {
    const preferencia = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (!("IntersectionObserver" in window) || !("animate" in Element.prototype)) return

    const animacoes = new Set<Animation>()
    const observador = new IntersectionObserver((entradas) => {
      for (const entrada of entradas) {
        if (!entrada.isIntersecting) continue
        observador.unobserve(entrada.target)
        if (preferencia.matches) continue
        const elemento = entrada.target as HTMLElement
        const animacao = elemento.animate(
          [{ opacity: 0, transform: "translateY(18px)" }, { opacity: 1, transform: "translateY(0)" }],
          { duration: 550, delay: Number(elemento.dataset.revealDelay ?? 0), easing: "cubic-bezier(.2,.7,.2,1)", fill: "backwards" },
        )
        animacoes.add(animacao)
        animacao.onfinish = () => animacoes.delete(animacao)
      }
    }, { threshold: 0.1 })

    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((elemento) => {
      // A primeira dobra aparece imediatamente, sem atrasar seu conteúdo principal.
      if (elemento.getBoundingClientRect().top >= window.innerHeight) observador.observe(elemento)
    })

    function atualizarPreferencia() {
      if (preferencia.matches) {
        animacoes.forEach((animacao) => animacao.cancel())
        animacoes.clear()
      }
    }
    preferencia.addEventListener("change", atualizarPreferencia)
    return () => {
      observador.disconnect()
      preferencia.removeEventListener("change", atualizarPreferencia)
      animacoes.forEach((animacao) => animacao.cancel())
    }
  }, [])

  return null
}
