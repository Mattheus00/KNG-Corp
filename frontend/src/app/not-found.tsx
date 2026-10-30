import Link from "next/link"

export default function PaginaNaoEncontrada() {
  return (
    <section
      aria-labelledby="titulo-404"
      className="mx-auto my-12 max-w-xl rounded-lg border border-slate-300 bg-white p-8 text-center"
    >
      <p className="text-sm font-bold uppercase tracking-wider text-teal-900">Erro 404</p>
      <h1 id="titulo-404" className="mt-2 text-2xl font-extrabold text-slate-950">
        Página não encontrada
      </h1>
      <p className="mt-2 text-sm text-slate-700">
        O endereço solicitado não existe nesta demonstração da Clínica Odontológica Aurora.
      </p>
      <div className="mt-6">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-md bg-teal-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-950"
        >
          Voltar para a página inicial
        </Link>
      </div>
    </section>
  )
}
