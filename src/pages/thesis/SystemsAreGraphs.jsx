import { Link } from 'react-router-dom'
import Seo from '../../components/seo/Seo.jsx'

/*
 * /thesis/systems-are-graphs (P3-06 · FR-055)  ·  frontend-engineer
 * A content-gap explainer: graph-native engineering as John's thesis. Targets branded + content-gap
 * search ("systems are graphs", "GraphRAG", "knowledge graph engineering") via article SEO, and
 * links into the operable consoles so it's never an orphan/dead-end. Tokens only; no numeric claims.
 */
export default function SystemsAreGraphs() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-24 sm:px-8">
      <Seo
        title="Systems are graphs"
        description="Codebases, knowledge bases, and multi-agent systems are graphs before they are anything else — and the work changes the moment you operate the graph instead of reading the files. John Wellard (JW3B / AgileGypsy) on graph-native engineering and GraphRAG."
        type="article"
      />
      <p className="font-mono text-[11px] uppercase tracking-label text-cyan">Thesis</p>
      <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-content-primary">Systems are graphs.</h1>
      <p className="mt-5 text-lg text-content-secondary">
        Every system worth reasoning about is a graph before it is anything else. A codebase is a
        dependency and call graph. A knowledge base is a graph of claims and the evidence that backs
        them. A multi-agent system is a graph of roles and the messages between them. The moment you
        see the graph, the work changes — you stop reading files and start querying relationships.
      </p>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold text-content-primary">Retrieval is a graph walk</h2>
        <p className="mt-3 text-content-secondary">
          Flat search asks “what looks similar?” A graph asks “what is this connected to?” GraphRAG
          answers by walking edges — claim → evidence → source — so the answer arrives with its
          provenance attached instead of a confident guess. The quality comes from the structure, not
          the size of the index.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-content-primary">Operate the graph, don’t read it</h2>
        <p className="mt-3 text-content-secondary">
          You cannot hold a large system in your head, and you shouldn’t try. You query it: which nodes
          does this change touch, what path connects these two facts, what breaks if this edge moves.
          That is why the surfaces here are consoles, not slideshows — the graph is the source of
          truth, and the work is traversing it in front of you.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-content-primary">Why it matters for what you’re hiring</h2>
        <p className="mt-3 text-content-secondary">
          The systems John ships are built this way: a knowledge graph as the source of truth, agents
          that traverse it, and an auditor that cites the path it took. Graph-native isn’t a
          decoration — it’s what makes the output checkable.
        </p>
      </section>

      <nav aria-label="Continue" className="mt-12 flex flex-wrap gap-5 border-t border-hairline pt-6">
        <Link to="/audit" className="font-mono text-[12px] uppercase tracking-label text-cyan hover:text-content-primary">
          See it operate → the audit console
        </Link>
        <Link to="/thesis/zero-trust-validator" className="font-mono text-[12px] uppercase tracking-label text-content-secondary hover:text-content-primary">
          Next: zero-trust validation →
        </Link>
        <Link to="/" className="font-mono text-[12px] uppercase tracking-label text-content-secondary hover:text-content-primary">
          ← Back to the console
        </Link>
      </nav>
    </article>
  )
}
