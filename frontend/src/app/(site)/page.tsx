import type { Metadata } from "next"
import Link from "next/link"
import { MovimentoLanding } from "@/components/movimento-landing"
import { Icone, Marca, type NomeIcone } from "@/components/icone"

export const metadata: Metadata = {
  title: "SGC — Gestão completa para clínicas odontológicas",
  description: "Agenda, recepção, atendimento e indicadores em uma experiência conectada. Conheça o SGC: gratuito durante a fase de demonstração.",
  alternates: { canonical: "/" },
}

const FUNCIONALIDADES: { titulo: string; texto: string; icone: NomeIcone }[] = [
  { titulo: "Uma agenda, toda a equipe", texto: "Visualize a semana, filtre por profissional e reorganize os horários em um só lugar.", icone: "agenda" },
  { titulo: "Autonomia para o paciente", texto: "Da escolha do serviço à confirmação, um caminho simples para agendar a avaliação.", icone: "conta" },
  { titulo: "Recepção organizada", texto: "Acompanhe confirmações, registre chegadas e encontre os dados de cada paciente.", icone: "pessoas" },
  { titulo: "Foco no atendimento", texto: "O dentista acompanha sua agenda e sabe quem está pronto para ser atendido.", icone: "cuidado" },
  { titulo: "Clareza para decidir", texto: "Consulte ocupação, faltas e cancelamentos a partir dos registros da clínica.", icone: "grafico" },
  { titulo: "Cada pessoa, seu acesso", texto: "Organize a equipe com perfis de paciente, recepção, dentista e gestor.", icone: "escudo" },
]

export default function PaginaInicial() {
  const dadosEstruturados = { "@context": "https://schema.org", "@type": "WebApplication", name: "SGC", applicationCategory: "BusinessApplication", description: "Sistema demonstrativo de gestão para clínicas odontológicas. Sem cobrança nesta fase.", inLanguage: "pt-BR" }
  return (
    <div className="site-container">
      <MovimentoLanding />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dadosEstruturados) }} />
      <section className="landing-hero">
        <div>
          <p className="eyebrow">Sua clínica. Em sintonia.</p>
          <h1 className="hero-title">Gestão completa para <em>clínicas odontológicas</em></h1>
          <p className="hero-copy">Menos desencontros na rotina. Mais espaço para cuidar. Conecte agenda, pacientes e equipe em uma experiência simples.</p>
          <div className="hero-actions"><Link href="/c/aurora" className="button button-primary">Explorar demonstração <Icone nome="seta" width="17" height="17" /></Link><Link href="/cadastro" className="button button-secondary">Criar minha clínica</Link></div>
          <p className="hero-note"><Icone nome="check" width="15" height="15" /> Gratuito durante a fase de demonstração</p>
        </div>
        <figure className="product-preview" aria-label="Exemplo ilustrativo da agenda com dados fictícios">
          <div className="preview-top"><Marca /><span>Clínica Aurora · Demonstração</span></div>
          <div className="preview-body">
            <div className="preview-title"><div><strong>Uma rotina mais leve.</strong><p>Cada atendimento no seu tempo.</p></div><Icone nome="agenda" /></div>
            <div className="preview-days" aria-hidden="true">{["SEG", "TER", "QUA", "QUI", "SEX"].map((dia, i) => <span key={dia} className={i === 2 ? "selected" : ""}>{dia}<b>{19 + i}</b></span>)}</div>
            {[
              ["09:00", "Mariana Costa", "Avaliação odontológica", "Confirmado"],
              ["10:30", "Pedro Almeida", "Limpeza e prevenção", "Agendado"],
              ["14:00", "Camila Santos", "Avaliação odontológica", "Agendado"],
            ].map(([hora, nome, servico, estado], i) => <div className="preview-appointment" key={hora}><span className="preview-time">{hora}</span><div className={`preview-event ${i === 1 ? "alternate" : ""}`}><div><strong>{nome}</strong><small>{servico}</small></div><small>{estado}</small></div></div>)}
          </div>
          <figcaption className="preview-caption"><Icone nome="escudo" width="14" height="14" /> Prévia ilustrativa · Pacientes e horários fictícios</figcaption>
        </figure>
      </section>
      <div className="audience-strip"><strong>Um sistema para toda a jornada.</strong><span><Icone nome="conta" width="17" height="17" /> Paciente</span><span><Icone nome="agenda" width="17" height="17" /> Recepção</span><span><Icone nome="cuidado" width="17" height="17" /> Dentista</span><span><Icone nome="grafico" width="17" height="17" /> Gestor</span></div>
      <section id="funcionalidades" aria-labelledby="titulo-funcionalidades" className="landing-section">
        <div className="section-intro" data-reveal><div><p className="eyebrow">Tudo se conecta</p><h2 id="titulo-funcionalidades">Da primeira consulta<br />à visão do todo.</h2></div><p>Para clínicas com uma unidade e vários profissionais. Ferramentas que acompanham o ritmo de cada pessoa da equipe.</p></div>
        <ul className="feature-grid">{FUNCIONALIDADES.map((item, indice) => <li className="feature-item" data-reveal data-reveal-delay={(indice % 3) * 75} key={item.titulo}><Icone nome={item.icone} width="26" height="26" /><h3>{item.titulo}</h3><p>{item.texto}</p></li>)}</ul>
      </section>
      <section id="como-funciona" aria-labelledby="titulo-como-funciona" className="process-section" data-reveal>
        <p className="eyebrow">Comece pelo essencial</p><h2 id="titulo-como-funciona">Seu próximo capítulo começa aqui.</h2>
        <ol className="process-grid">{[
          ["01", "Crie seu espaço", "Dê um nome à clínica e escolha o endereço que identifica sua página."],
          ["02", "Organize a operação", "Configure serviços, profissionais e horários de atendimento."],
          ["03", "Conecte a jornada", "Explore agendamentos, recepção e atendimento com dados fictícios."],
        ].map(([numero, titulo, texto]) => <li key={numero}><span className="process-number">{numero}</span><h3>{titulo}</h3><p>{texto}</p></li>)}</ol>
      </section>
      <section id="perguntas" aria-labelledby="titulo-perguntas" className="landing-section faq-section">
        <div className="faq-intro" data-reveal><p className="eyebrow">Antes de começar</p><h2 id="titulo-perguntas">Simples desde a<br />primeira conversa.</h2></div>
        <div className="faq-list" data-reveal data-reveal-delay="100">
          <details open><summary>Como funciona a demonstração?</summary><p>Explore a clínica fictícia Aurora ou crie sua própria clínica de exemplo. Os dados ficam na memória do servidor, isolados por sessão, e podem ser descartados ao expirar a sessão ou reiniciar o servidor. Use apenas dados fictícios.</p></details>
          <details><summary>Preciso pagar ou cadastrar um cartão?</summary><p>Não. O uso é gratuito durante a fase de demonstração, sem cartão, checkout ou cobrança. Não há atendimento odontológico real.</p></details>
          <details><summary>Posso criar mais de uma clínica?</summary><p>Sim. A sessão aceita até três clínicas, incluindo a Aurora, com uma unidade por clínica. Elas ficam isoladas entre si. Restaurar os dados recria apenas a Aurora e descarta as clínicas criadas na sessão.</p></details>
        </div>
      </section>
      <section className="demo-cta" data-reveal><div><h2>Conheça uma nova forma de organizar o cuidado.</h2><p>Entre na Aurora e explore a jornada completa, do paciente à gestão.</p></div><Link href="/c/aurora" className="button button-primary">Ver demonstração <Icone nome="seta" width="17" height="17" /></Link></section>
    </div>
  )
}
