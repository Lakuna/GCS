# Architecture Philosophies

This document records the architectural principles we are intentionally adopting
as we evolve the Gauntlet Championship Series (GCS) codebase. It is a living
document: each principle is added _before_ or _alongside_ the first change that
applies it, so the philosophy and the code that demonstrates it land together.

When you (human or AI) make a change, find the relevant philosophy below and
follow it. If a change needs a new principle, add it here in the same pull
request.

---

## 1. Hexagonal architecture: domain + ports/adapters + use cases

> _Adopted alongside the Block-of-3 sweep-scoring fix
> (`chris/fix-sweep-calculations`)._

The app today mixes three concerns in single files — most visibly in the season
page (`src/app/seasons/[slug]/page.tsx`), which fetches rows with Drizzle,
computes league standings, and renders JSX all in one place. Business rules that
live inside a 300-line React Server Component are hard to find, impossible to
unit test, and easy to break.

We are migrating, one vertical slice at a time, to a **hexagonal (ports &
adapters)** structure:

```
src/
  core/                     # The application core. Knows nothing about React,
    <feature>/              # Next.js, Drizzle, Neon, Riot, etc.
      domain/               #   Pure business rules + domain types. No I/O.
      ports/                #   Interfaces the core needs from the outside world.
      usecases/             #   Orchestration: load via a port, apply the domain,
                            #   return a result. Dependencies are injected.
  adapters/                 # Implementations of ports for the real world.
    db/                     #   e.g. Drizzle/Neon-backed repositories.
```

### The rules

1. **The domain is pure.** Functions in `core/<feature>/domain` take and return
   plain data, perform no I/O, and import nothing from `db`, `adapters`, React,
   or Next.js. They are deterministic and trivially unit-testable.

2. **The domain owns its own types.** The core must _not_ depend on Drizzle's
   `$inferSelect` row shapes. That ties business rules to the database schema —
   an adapter concern leaking into the core. Define small domain types (e.g.
   `TeamStandingInput`) and let adapters map persistence rows onto them.

3. **Ports are interfaces, defined by the core.** A port describes _what the core
   needs_ (e.g. "give me the teams and match results for a season"), in the
   core's own vocabulary. The core depends on the interface, never on a concrete
   class.

4. **Adapters implement ports; they may depend on infrastructure.** A
   `DrizzleStandingsRepository` is allowed to import `db`, run queries, and map
   rows to domain types. Dependencies point _inward_: adapters know about the
   core, the core never knows about adapters.

5. **Use cases orchestrate and receive their dependencies via injection (DI).**
   A use case is a function whose first job is to accept the ports it needs as
   arguments. Production code wires in the real adapter; tests wire in a fake.
   This is what makes the core testable without a database.

   ```ts
   // usecases/getRegularSeasonStandings.ts
   export default async function getRegularSeasonStandings(
     seasonId: number,
     { repository }: { repository: StandingsRepository } // <- injected
   ): Promise<PoolStanding[]> { ... }
   ```

6. **The framework is an adapter too.** React Server Components and route
   handlers are the _driving_ (inbound) adapters. Their job shrinks to: gather
   input, call a use case with the real dependencies wired in, render the
   result. They should not contain business rules.

### Why DI instead of importing `db` directly?

Importing the singleton `db` inside a use case would hard-wire it to Neon and
make it untestable without a live database. By depending on a `StandingsRepository`
_interface_ and receiving an implementation as an argument, the same use case
runs against real Postgres in production and against an in-memory fake in unit
tests — no mocking framework required.

### Migration approach: strangler, one slice at a time

We do **not** rewrite the app. We migrate **vertical slices**: when we touch a
feature, we extract its business rules into `core`, define the port it needs,
write the adapter, and reduce the React component to a thin caller. Untouched
code keeps working exactly as before. Over time the core grows and the
framework layer thins out.

The **standings / match-scoring** slice is the first one (see the sweep-bug
fix). Expect `src/util/*` domain-ish helpers (`getMatchWinner`, `getMatchScore`,
`getFormatGameCount`, …) to migrate into `core` as the slices that use them are
touched.
