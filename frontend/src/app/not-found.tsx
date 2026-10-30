import Link from "next/link"

export default function PaginaNaoEncontrada() {
  return (
    <section
      aria-labelledby="titulo-404"
      className="mx-auto my-12 max-w-xl rounded-xl border border-line bg-white p-8 text-center"
    >
      <p className="text-sm font-semibold uppercase tracking-wider text-brand">Erro 404</p>
      <h1 id="titulo-404" className="mt-2 text-2xl font-semibold text-ink">
        Página não encontrada
      </h1>
      <p className="mt-2 text-sm text-muted">
        O endereço solicitado não existe nesta demonstração da Clínica Odontológica Aurora.
      </p>
      <div className="mt-6">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink"
        >
          Voltar para a página inicial
        </Link>
      </div>
    </section>
  )
}
