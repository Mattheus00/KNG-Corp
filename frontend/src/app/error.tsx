"use client"

export default function ErroAplicacao({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <section
      role="alert"
      aria-labelledby="titulo-erro-recuperavel"
      className="mx-auto my-12 max-w-xl rounded-xl border border-rose-200 bg-rose-50 p-8 text-ink"
    >
      <h1 id="titulo-erro-recuperavel" className="text-xl font-semibold text-ink">
        Não foi possível carregar esta visualização
      </h1>
      <p className="mt-2 text-sm text-muted">
        Ocorreu uma falha inesperada ao processar a solicitação. Tente novamente para continuar.
      </p>
      <div className="mt-5">
        <button
          type="button"
          onClick={() => reset()}
          className="min-h-11 rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink"
        >
          Tentar novamente
        </button>
      </div>
    </section>
  )
}
