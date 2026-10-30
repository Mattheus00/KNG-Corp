"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { acaoCadastrarClinica } from "@/app/acoes"

export function FormularioClinica() {
  const [mensagem, setMensagem] = useState("")
  const [pendente, iniciar] = useTransition()

  function aoEnviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const dados = new FormData(evento.currentTarget)
    setMensagem("")
    iniciar(async () => {
      const resposta = await acaoCadastrarClinica({
        nome: String(dados.get("nome") ?? ""),
        slug: String(dados.get("slug") ?? ""),
        responsavelNome: String(dados.get("responsavelNome") ?? ""),
        responsavelEmail: String(dados.get("responsavelEmail") ?? ""),
      })
      if (!resposta.ok) setMensagem(resposta.mensagem)
    })
  }

  return (
    <form onSubmit={aoEnviar} className="space-y-5">
      <div>
        <label htmlFor="nome" className="text-sm font-semibold text-ink">
          Nome da clínica
        </label>
        <input
          id="nome"
          name="nome"
          required
          minLength={3}
          maxLength={80}
          className="mt-1 w-full min-h-11 rounded-xl border border-input px-3 text-sm"
        />
      </div>
      <div>
        <label htmlFor="slug" className="text-sm font-semibold text-ink">
          Endereço da clínica
        </label>
        <input
          id="slug"
          name="slug"
          required
          minLength={3}
          maxLength={40}
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          placeholder="clinica-norte"
          className="mt-1 w-full min-h-11 rounded-xl border border-input px-3 text-sm"
        />
        <p className="mt-1 text-xs text-muted">Letras minúsculas, números e hífen. Vira /c/seu-endereco.</p>
      </div>
      <div>
        <label htmlFor="responsavelNome" className="text-sm font-semibold text-ink">
          Seu nome
        </label>
        <input
          id="responsavelNome"
          name="responsavelNome"
          required
          minLength={3}
          maxLength={120}
          className="mt-1 w-full min-h-11 rounded-xl border border-input px-3 text-sm"
        />
      </div>
      <div>
        <label htmlFor="responsavelEmail" className="text-sm font-semibold text-ink">
          Seu e-mail
        </label>
        <input
          id="responsavelEmail"
          name="responsavelEmail"
          type="email"
          required
          maxLength={160}
          className="mt-1 w-full min-h-11 rounded-xl border border-input px-3 text-sm"
        />
      </div>
      <p className="text-xs text-muted">Use dados fictícios. Consulte a <Link className="underline" href="/privacidade">Política de Privacidade</Link> e os <Link className="underline" href="/termos">Termos de Serviço</Link>.</p>
      {mensagem && (
        <p role="alert" className="text-sm font-semibold text-[#B81237]">
          {mensagem}
        </p>
      )}
      <button
        type="submit"
        disabled={pendente}
        className="button button-primary w-full disabled:opacity-60"
      >
        {pendente ? "Criando…" : "Criar clínica"}
      </button>
    </form>
  )
}
