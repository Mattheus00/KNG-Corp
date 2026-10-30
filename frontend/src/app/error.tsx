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
      className="mx-auto my-12 max-w-xl rounded-lg border-2 border-rose-600 bg-rose-50 p-8 text-slate-950"
    >
      <h1 id="titulo-erro-recuperavel" className="text-xl font-extrabold text-slate-950">
        Não foi possível carregar esta visualização
      </h1>
      <p className="mt-2 text-sm text-slate-800">
        Ocorreu uma falha inesperada ao processar a solicitação. Nenhum dado sensível ou detalhe
        interno foi exposto.
      </p>
      <div className="mt-5">
        <button
          type="button"
          onClick={() => reset()}
          className="min-h-11 rounded-md bg-teal-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-950"
        >
          Tentar novamente
        </button>
      </div>
    </section>
  )
}
