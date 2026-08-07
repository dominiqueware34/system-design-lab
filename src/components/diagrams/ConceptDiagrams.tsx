import {
  Arrow,
  Caption,
  DiagramFrame,
  SoftCard,
} from "./DiagramPrimitives";

/** Cache sits in front of DB — read path */
export function CacheAsideDiagram() {
  return (
    <DiagramFrame title="When to use a Cache" width={480} height={200}>
      <Caption x={240} y={22} size={10} fill="#64748b" weight={500}>
        Client → App → Cache → (miss) → Database
      </Caption>
      <SoftCard x={24} y={50} w={70} h={56} fill="#0ea5e922" stroke="#0ea5e9" />
      <Caption x={59} y={82} size={10}>
        Client
      </Caption>

      <Arrow x1={98} y1={78} x2={128} y2={78} color="#38bdf8" />

      <SoftCard x={132} y={50} w={70} h={56} fill="#34d39922" stroke="#34d399" />
      <Caption x={167} y={82} size={10}>
        App
      </Caption>

      <Arrow x1={206} y1={78} x2={236} y2={78} color="#38bdf8" label="1. get" />

      <SoftCard x={240} y={44} w={88} h={68} fill="#fbbf2422" stroke="#fbbf24" />
      <Caption x={284} y={72} size={11}>
        Cache
      </Caption>
      <Caption x={284} y={88} size={8} fill="#a8a29e" weight={400}>
        Redis / Memcached
      </Caption>

      <Arrow x1={332} y1={78} x2={368} y2={78} color="#f87171" dashed label="2. miss" />

      <SoftCard x={372} y={50} w={84} h={56} fill="#fbbf2422" stroke="#f59e0b" />
      <Caption x={414} y={82} size={10}>
        Database
      </Caption>

      <Caption x={240} y={150} size={9} fill="#94a3b8" weight={400}>
        Keywords: hot reads · p99 latency · same query often · QPS spike
      </Caption>
      <Caption x={240} y={168} size={9} fill="#64748b" weight={400}>
        Cache returns fast hits; DB only on miss → then populate cache
      </Caption>
    </DiagramFrame>
  );
}

/** Load balancer in front of N app replicas */
export function LoadBalancerDiagram() {
  return (
    <DiagramFrame title="When to use a Load Balancer" width={480} height={210}>
      <SoftCard x={30} y={80} w={64} h={48} fill="#0ea5e922" stroke="#0ea5e9" />
      <Caption x={62} y={108} size={10}>
        Users
      </Caption>
      <Arrow x1={98} y1={104} x2={140} y2={104} color="#a78bfa" />
      <SoftCard x={144} y={72} w={90} h={64} fill="#a78bfa22" stroke="#a78bfa" />
      <Caption x={189} y={100} size={10}>
        Load Balancer
      </Caption>
      <Caption x={189} y={116} size={8} fill="#a8a29e" weight={400}>
        L4 / L7 · health checks
      </Caption>

      <Arrow x1={238} y1={88} x2={300} y2={50} color="#34d399" />
      <Arrow x1={238} y1={104} x2={300} y2={104} color="#34d399" />
      <Arrow x1={238} y1={120} x2={300} y2={158} color="#34d399" />

      <SoftCard x={304} y={28} w={100} h={40} fill="#34d39922" stroke="#34d399" />
      <Caption x={354} y={52} size={9}>
        App replica 1
      </Caption>
      <SoftCard x={304} y={84} w={100} h={40} fill="#34d39922" stroke="#34d399" />
      <Caption x={354} y={108} size={9}>
        App replica 2
      </Caption>
      <SoftCard x={304} y={140} w={100} h={40} fill="#34d39922" stroke="#34d399" />
      <Caption x={354} y={164} size={9}>
        App replica 3
      </Caption>

      <Caption x={240} y={198} size={9} fill="#94a3b8" weight={400}>
        Keywords: scale out · high traffic · multi-AZ · no single server
      </Caption>
    </DiagramFrame>
  );
}

/** Queue + worker + DLQ */
export function DlqDiagram() {
  return (
    <DiagramFrame title="Queues & Dead-Letter Queues (DLQ)" width={480} height={220}>
      <SoftCard x={20} y={70} w={70} h={50} fill="#34d39922" stroke="#34d399" />
      <Caption x={55} y={98} size={9}>
        Producer
      </Caption>
      <Arrow x1={94} y1={95} x2={130} y2={95} color="#f472b6" />

      <SoftCard x={134} y={62} w={90} h={66} fill="#f472b622" stroke="#f472b6" />
      <Caption x={179} y={90} size={10}>
        Main Queue
      </Caption>
      <Caption x={179} y={106} size={8} fill="#a8a29e" weight={400}>
        SQS / Rabbit / Kafka
      </Caption>

      <Arrow x1={228} y1={95} x2={268} y2={95} color="#34d399" label="consume" />

      <SoftCard x={272} y={62} w={80} h={66} fill="#34d39922" stroke="#34d399" />
      <Caption x={312} y={90} size={10}>
        Worker
      </Caption>
      <Caption x={312} y={106} size={8} fill="#a8a29e" weight={400}>
        process job
      </Caption>

      {/* poison path down to DLQ */}
      <Arrow x1={312} y1={132} x2={312} y2={168} color="#f87171" dashed />
      <SoftCard x={250} y={168} w={124} h={36} fill="#f8717122" stroke="#f87171" />
      <Caption x={312} y={190} size={9}>
        Dead-Letter Queue
      </Caption>

      <Caption x={120} y={190} size={8} fill="#f87171" weight={500} anchor="start">
        fail N times →
      </Caption>

      <Caption x={240} y={30} size={9} fill="#94a3b8" weight={400}>
        Keywords: async · retries · poison message · webhook · email send
      </Caption>
      <Caption x={240} y={46} size={8} fill="#64748b" weight={400}>
        DLQ holds bad jobs so they don&apos;t block the main queue forever
      </Caption>
    </DiagramFrame>
  );
}

/** Read replicas for scale */
export function ReadReplicaDiagram() {
  return (
    <DiagramFrame title="Read Replicas (scale reads)" width={480} height={200}>
      <SoftCard x={40} y={70} w={80} h={56} fill="#34d39922" stroke="#34d399" />
      <Caption x={80} y={102} size={10}>
        App
      </Caption>
      <Arrow x1={124} y1={88} x2={190} y2={60} color="#38bdf8" label="writes" />
      <Arrow x1={124} y1={110} x2={190} y2={140} color="#a3e635" label="reads" />

      <SoftCard x={194} y={36} w={100} h={52} fill="#fbbf2422" stroke="#fbbf24" />
      <Caption x={244} y={58} size={10}>
        Primary DB
      </Caption>
      <Caption x={244} y={74} size={8} fill="#a8a29e" weight={400}>
        writes only
      </Caption>

      <SoftCard x={194} y={118} w={100} h={44} fill="#fbbf2418" stroke="#ca8a04" />
      <Caption x={244} y={144} size={9}>
        Read replica ×N
      </Caption>

      <Arrow x1={298} y1={62} x2={298} y2={118} color="#94a3b8" dashed label="async repl" />

      <Caption x={240} y={182} size={9} fill="#94a3b8" weight={400}>
        Keywords: read-heavy · reporting · feed · search · 100:1 R/W
      </Caption>
    </DiagramFrame>
  );
}

/** Naive RAG — matches user's infographic style */
export function NaiveRagDiagram() {
  return (
    <DiagramFrame title="Naive RAG (retrieval → LLM)" width={480} height={210}>
      <SoftCard x={20} y={70} w={64} h={48} fill="#0ea5e922" stroke="#0ea5e9" />
      <Caption x={52} y={98} size={9}>
        Query
      </Caption>
      <Arrow x1={88} y1={94} x2={120} y2={94} color="#22d3ee" />

      <SoftCard x={124} y={58} w={88} h={72} fill="#a3e63522" stroke="#a3e635" />
      <Caption x={168} y={84} size={10}>
        Vector DB
      </Caption>
      <Caption x={168} y={100} size={8} fill="#a8a29e" weight={400}>
        top-K chunks
      </Caption>

      <Arrow x1={216} y1={94} x2={260} y2={94} color="#22d3ee" label="context" />

      <SoftCard x={264} y={58} w={88} h={72} fill="#c084fc22" stroke="#c084fc" />
      <Caption x={308} y={84} size={10}>
        LLM
      </Caption>
      <Caption x={308} y={100} size={8} fill="#a8a29e" weight={400}>
        + prompt
      </Caption>

      <Arrow x1={356} y1={94} x2={396} y2={94} color="#22d3ee" />
      <SoftCard x={400} y={70} w={60} h={48} fill="#34d39922" stroke="#34d399" />
      <Caption x={430} y={98} size={9}>
        Answer
      </Caption>

      <Caption x={240} y={160} size={9} fill="#94a3b8" weight={400}>
        Keywords: docs Q&amp;A · knowledge base · ground the model · cite sources
      </Caption>
      <Caption x={240} y={178} size={8} fill="#64748b" weight={400}>
        Retrieve relevant chunks first, then generate — reduces hallucination
      </Caption>
    </DiagramFrame>
  );
}

/** Hybrid RAG */
export function HybridRagDiagram() {
  return (
    <DiagramFrame title="Hybrid RAG (keyword + vector)" width={480} height={220}>
      <SoftCard x={200} y={16} w={80} h={36} fill="#0ea5e922" stroke="#0ea5e9" />
      <Caption x={240} y={38} size={9}>
        User query
      </Caption>
      <Arrow x1={220} y1={52} x2={120} y2={90} color="#94a3b8" />
      <Arrow x1={260} y1={52} x2={360} y2={90} color="#94a3b8" />

      <SoftCard x={50} y={90} w={120} h={50} fill="#38bdf822" stroke="#38bdf8" />
      <Caption x={110} y={112} size={9}>
        Keyword / BM25
      </Caption>
      <Caption x={110} y={126} size={8} fill="#64748b" weight={400}>
        exact terms, IDs
      </Caption>

      <SoftCard x={310} y={90} w={120} h={50} fill="#a3e63522" stroke="#a3e635" />
      <Caption x={370} y={112} size={9}>
        Vector search
      </Caption>
      <Caption x={370} y={126} size={8} fill="#64748b" weight={400}>
        semantic meaning
      </Caption>

      <Arrow x1={110} y1={140} x2={200} y2={168} color="#c084fc" />
      <Arrow x1={370} y1={140} x2={280} y2={168} color="#c084fc" />

      <SoftCard x={180} y={168} w={120} h={40} fill="#c084fc22" stroke="#c084fc" />
      <Caption x={240} y={192} size={9}>
        Merge + rank → LLM
      </Caption>
    </DiagramFrame>
  );
}

/** CDN for static / media */
export function CdnDiagram() {
  return (
    <DiagramFrame title="When to use a CDN" width={480} height={190}>
      <SoftCard x={30} y={70} w={64} h={48} fill="#0ea5e922" stroke="#0ea5e9" />
      <Caption x={62} y={98} size={9}>
        User
      </Caption>
      <Arrow x1={98} y1={94} x2={150} y2={94} color="#a78bfa" />
      <SoftCard x={154} y={54} w={100} h={80} fill="#a78bfa22" stroke="#a78bfa" />
      <Caption x={204} y={88} size={10}>
        Edge CDN
      </Caption>
      <Caption x={204} y={104} size={8} fill="#a8a29e" weight={400}>
        near the user
      </Caption>
      <Arrow x1={258} y1={94} x2={320} y2={94} color="#fb923c" dashed label="miss" />
      <SoftCard x={324} y={62} w={120} h={64} fill="#fb923c22" stroke="#fb923c" />
      <Caption x={384} y={90} size={10}>
        Origin storage
      </Caption>
      <Caption x={384} y={106} size={8} fill="#a8a29e" weight={400}>
        S3 / objects
      </Caption>
      <Caption x={240} y={162} size={9} fill="#94a3b8" weight={400}>
        Keywords: images · video · global users · static assets · TTFB
      </Caption>
    </DiagramFrame>
  );
}

/** Multi-AZ redundancy */
export function MultiAzDiagram() {
  return (
    <DiagramFrame title="Redundancy: Multi-AZ" width={480} height={200}>
      <SoftCard x={40} y={40} w={180} h={120} fill="#1e293b" stroke="#334155" />
      <Caption x={130} y={60} size={9} fill="#64748b">
        Availability Zone A
      </Caption>
      <SoftCard x={60} y={76} w={60} h={36} fill="#34d39922" stroke="#34d399" />
      <Caption x={90} y={98} size={8}>
        App
      </Caption>
      <SoftCard x={140} y={76} w={60} h={36} fill="#fbbf2422" stroke="#fbbf24" />
      <Caption x={170} y={98} size={8}>
        DB primary
      </Caption>

      <SoftCard x={260} y={40} w={180} h={120} fill="#1e293b" stroke="#334155" />
      <Caption x={350} y={60} size={9} fill="#64748b">
        Availability Zone B
      </Caption>
      <SoftCard x={280} y={76} w={60} h={36} fill="#34d39922" stroke="#34d399" />
      <Caption x={310} y={98} size={8}>
        App
      </Caption>
      <SoftCard x={360} y={76} w={60} h={36} fill="#fbbf2418" stroke="#ca8a04" />
      <Caption x={390} y={98} size={8}>
        Standby
      </Caption>

      <Arrow x1={204} y1={94} x2={276} y2={94} color="#f87171" dashed label="failover" />

      <Caption x={240} y={182} size={9} fill="#94a3b8" weight={400}>
        Keywords: HA · 99.9% · AZ outage · no SPOF · disaster
      </Caption>
    </DiagramFrame>
  );
}

/** Async offload: API → queue → worker */
export function QueueWorkerDiagram() {
  return (
    <DiagramFrame title="When to use a Message Queue" width={480} height={200}>
      <SoftCard x={20} y={60} w={70} h={50} fill="#0ea5e922" stroke="#0ea5e9" />
      <Caption x={55} y={88} size={9}>
        Client
      </Caption>
      <Arrow x1={94} y1={85} x2={128} y2={85} color="#34d399" />
      <SoftCard x={132} y={60} w={70} h={50} fill="#34d39922" stroke="#34d399" />
      <Caption x={167} y={88} size={9}>
        API
      </Caption>
      <Arrow x1={206} y1={85} x2={250} y2={85} color="#f472b6" label="enqueue" />
      <SoftCard x={254} y={52} w={90} h={66} fill="#f472b622" stroke="#f472b6" />
      <Caption x={299} y={80} size={10}>
        Queue
      </Caption>
      <Caption x={299} y={96} size={8} fill="#a8a29e" weight={400}>
        buffer + retry
      </Caption>
      <Arrow x1={348} y1={85} x2={390} y2={85} color="#34d399" />
      <SoftCard x={394} y={60} w={70} h={50} fill="#34d39922" stroke="#34d399" />
      <Caption x={429} y={88} size={9}>
        Worker
      </Caption>
      <Caption x={240} y={150} size={9} fill="#94a3b8" weight={400}>
        Keywords: async · email · video encode · webhook · spike traffic · decouple
      </Caption>
      <Caption x={240} y={168} size={8} fill="#64748b" weight={400}>
        API returns fast; slow work runs later. Queue absorbs load spikes.
      </Caption>
    </DiagramFrame>
  );
}

/** Rate limiter at the edge */
export function RateLimiterDiagram() {
  return (
    <DiagramFrame title="When to use a Rate Limiter" width={480} height={190}>
      <SoftCard x={30} y={60} w={64} h={48} fill="#0ea5e922" stroke="#0ea5e9" />
      <Caption x={62} y={88} size={9}>
        Client
      </Caption>
      <Arrow x1={98} y1={84} x2={140} y2={84} color="#a78bfa" />
      <SoftCard x={144} y={48} w={100} h={72} fill="#a78bfa22" stroke="#a78bfa" />
      <Caption x={194} y={76} size={10}>
        Rate limiter
      </Caption>
      <Caption x={194} y={92} size={8} fill="#a8a29e" weight={400}>
        token bucket / window
      </Caption>
      <Arrow x1={248} y1={70} x2={300} y2={50} color="#34d399" label="allow" />
      <Arrow x1={248} y1={100} x2={300} y2={130} color="#f87171" dashed label="429" />
      <SoftCard x={304} y={28} w={90} h={44} fill="#34d39922" stroke="#34d399" />
      <Caption x={349} y={54} size={9}>
        API
      </Caption>
      <SoftCard x={304} y={112} w={90} h={44} fill="#f8717122" stroke="#f87171" />
      <Caption x={349} y={138} size={9}>
        Rejected
      </Caption>
      <Caption x={240} y={175} size={9} fill="#94a3b8" weight={400}>
        Keywords: abuse · quota · per-user limit · DDoS · fair use · 429
      </Caption>
    </DiagramFrame>
  );
}

/** Sharding / partition */
export function ShardingDiagram() {
  return (
    <DiagramFrame title="When to Shard a Database" width={480} height={210}>
      <SoftCard x={30} y={70} w={70} h={50} fill="#34d39922" stroke="#34d399" />
      <Caption x={65} y={98} size={9}>
        App
      </Caption>
      <Arrow x1={104} y1={95} x2={150} y2={95} color="#fbbf24" label="hash(key)" />
      <SoftCard x={154} y={40} w={80} h={40} fill="#fbbf2422" stroke="#fbbf24" />
      <Caption x={194} y={64} size={9}>
        Shard 0
      </Caption>
      <SoftCard x={154} y={90} w={80} h={40} fill="#fbbf2422" stroke="#fbbf24" />
      <Caption x={194} y={114} size={9}>
        Shard 1
      </Caption>
      <SoftCard x={154} y={140} w={80} h={40} fill="#fbbf2422" stroke="#fbbf24" />
      <Caption x={194} y={164} size={9}>
        Shard 2
      </Caption>
      <Caption x={320} y={70} size={9} fill="#94a3b8" weight={400} anchor="start">
        Partition by user_id / tenant
      </Caption>
      <Caption x={320} y={90} size={9} fill="#94a3b8" weight={400} anchor="start">
        Consistent hashing → less rebalance
      </Caption>
      <Caption x={320} y={110} size={9} fill="#94a3b8" weight={400} anchor="start">
        Avoid hot keys (celebrity)
      </Caption>
      <Caption x={240} y={198} size={9} fill="#94a3b8" weight={400}>
        Keywords: too big for one DB · 1B rows · multi-tenant · shard key
      </Caption>
    </DiagramFrame>
  );
}

/** Agent tool loop */
export function AgentToolLoopDiagram() {
  return (
    <DiagramFrame title="Agent tool loop (tool → LLM feedback)" width={480} height={210}>
      <SoftCard x={180} y={20} w={120} h={44} fill="#c084fc22" stroke="#c084fc" />
      <Caption x={240} y={46} size={10}>
        LLM / Agent
      </Caption>
      <Arrow x1={200} y1={64} x2={100} y2={120} color="#22d3ee" label="call tool" />
      <Arrow x1={280} y1={64} x2={380} y2={120} color="#22d3ee" label="call tool" />
      <SoftCard x={40} y={120} w={100} h={48} fill="#22d3ee22" stroke="#22d3ee" />
      <Caption x={90} y={148} size={9}>
        Web search
      </Caption>
      <SoftCard x={340} y={120} w={100} h={48} fill="#22d3ee22" stroke="#22d3ee" />
      <Caption x={390} y={148} size={9}>
        RAG / API
      </Caption>
      <Arrow x1={100} y1={120} x2={200} y2={64} color="#a3e635" dashed label="result" />
      <Arrow x1={380} y1={120} x2={280} y2={64} color="#a3e635" dashed label="result" />
      <Caption x={240} y={190} size={9} fill="#94a3b8" weight={400}>
        Keywords: multi-step · ReAct · tool use · research · then answer
      </Caption>
    </DiagramFrame>
  );
}

/** Web search tool */
export function WebSearchDiagram() {
  return (
    <DiagramFrame title="When to use Web Search" width={480} height={180}>
      <SoftCard x={40} y={50} w={80} h={50} fill="#c084fc22" stroke="#c084fc" />
      <Caption x={80} y={78} size={9}>
        Agent
      </Caption>
      <Arrow x1={124} y1={75} x2={180} y2={75} color="#22d3ee" />
      <SoftCard x={184} y={42} w={110} h={66} fill="#22d3ee22" stroke="#22d3ee" />
      <Caption x={239} y={70} size={10}>
        Web search
      </Caption>
      <Caption x={239} y={86} size={8} fill="#a8a29e" weight={400}>
        live internet
      </Caption>
      <Arrow x1={298} y1={75} x2={350} y2={75} color="#a3e635" label="snippets" />
      <SoftCard x={354} y={50} w={90} h={50} fill="#c084fc22" stroke="#c084fc" />
      <Caption x={399} y={78} size={9}>
        LLM
      </Caption>
      <Caption x={240} y={140} size={9} fill="#94a3b8" weight={400}>
        Keywords: current events · news · prices · &quot;today&quot; · outside knowledge cutoff
      </Caption>
      <Caption x={240} y={158} size={8} fill="#64748b" weight={400}>
        RAG = your docs. Web search = public live web.
      </Caption>
    </DiagramFrame>
  );
}

/** Evals */
export function EvalsDiagram() {
  return (
    <DiagramFrame title="Span vs E2E evals" width={480} height={200}>
      <SoftCard x={30} y={40} w={200} h={100} fill="#facc1522" stroke="#facc15" />
      <Caption x={130} y={64} size={10}>
        Span / step eval
      </Caption>
      <Caption x={130} y={84} size={8} fill="#a8a29e" weight={400}>
        Did this tool call look right?
      </Caption>
      <Caption x={130} y={100} size={8} fill="#a8a29e" weight={400}>
        Retrieval precision@k
      </Caption>
      <Caption x={130} y={116} size={8} fill="#a8a29e" weight={400}>
        Faithfulness of one step
      </Caption>

      <SoftCard x={250} y={40} w={200} h={100} fill="#facc1522" stroke="#eab308" />
      <Caption x={350} y={64} size={10}>
        E2E task eval
      </Caption>
      <Caption x={350} y={84} size={8} fill="#a8a29e" weight={400}>
        Did the whole job succeed?
      </Caption>
      <Caption x={350} y={100} size={8} fill="#a8a29e" weight={400}>
        Golden set pass rate
      </Caption>
      <Caption x={350} y={116} size={8} fill="#a8a29e" weight={400}>
        Deploy gate / regression
      </Caption>

      <Caption x={240} y={170} size={9} fill="#94a3b8" weight={400}>
        Keywords: quality regressed · measure · LLM-as-judge · golden set · offline eval
      </Caption>
    </DiagramFrame>
  );
}

export const DIAGRAM_MAP = {
  cache: CacheAsideDiagram,
  load_balancer: LoadBalancerDiagram,
  dlq: DlqDiagram,
  read_replica: ReadReplicaDiagram,
  naive_rag: NaiveRagDiagram,
  hybrid_rag: HybridRagDiagram,
  cdn: CdnDiagram,
  multi_az: MultiAzDiagram,
  queue_worker: QueueWorkerDiagram,
  rate_limiter: RateLimiterDiagram,
  sharding: ShardingDiagram,
  agent_tool_loop: AgentToolLoopDiagram,
  web_search: WebSearchDiagram,
  evals: EvalsDiagram,
} as const;

export type DiagramId = keyof typeof DIAGRAM_MAP;
