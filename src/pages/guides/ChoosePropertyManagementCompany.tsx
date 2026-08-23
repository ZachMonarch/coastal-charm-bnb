import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ShieldCheck, Wallet, Wrench, MessageSquare, Building2, Scale, BarChart3 } from "lucide-react";

const CANONICAL = "https://monarchpropertymmgt.online/blog/how-to-choose-property-management-company";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "How to Choose a Property Management Company: A Colorado Owner's Guide",
  description:
    "A practical guide for property owners on choosing a property management company — fee structures, communication standards, maintenance handling, compliance, reporting, and the questions to ask before you sign.",
  author: { "@type": "Organization", name: "Monarch Property Management" },
  publisher: {
    "@type": "Organization",
    name: "Monarch Property Management",
    url: "https://monarchpropertymmgt.online",
  },
  datePublished: "2026-06-22",
  dateModified: "2026-06-22",
  mainEntityOfPage: CANONICAL,
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What services do property management companies provide?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Full-service property managers handle tenant screening and leasing, rent collection, maintenance coordination, financial reporting, owner statements, compliance with state and local rental law, inspections, and end-of-year tax documentation.",
      },
    },
    {
      "@type": "Question",
      name: "How much does a property management company cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Typical residential management fees range from 8–12% of monthly rent, plus a leasing fee (often half to one month's rent) when a new tenant is placed. Watch for add-on fees for inspections, renewals, or maintenance markups.",
      },
    },
    {
      "@type": "Question",
      name: "How do I know if a property management company is reputable?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Check that they are licensed in your state, carry errors-and-omissions and general liability insurance, use a trust account for owner funds, publish clear management agreements, and can provide owner references and recent financial reporting samples.",
      },
    },
  ],
};

export default function ChoosePropertyManagementCompany() {
  return (
    <>
      <Helmet>
        <title>How to Choose a Property Management Company | Monarch</title>
        <meta
          name="description"
          content="A Colorado owner's guide to choosing a property management company — fee structures, communication, maintenance handling, compliance, and the questions to ask before you sign."
        />
        <link rel="canonical" href={CANONICAL} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content="How to Choose a Property Management Company" />
        <meta
          property="og:description"
          content="Selection criteria for property owners: fees, communication, maintenance, reporting, and compliance — backed by 20+ years of Colorado experience."
        />
        <meta property="og:url" content={CANONICAL} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqLd)}</script>
      </Helmet>

      <div className="container mx-auto max-w-3xl px-4 py-12">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">/</span>
          <span>Blog</span>
          <span className="mx-2">/</span>
          <span className="text-foreground">Choosing a Property Management Company</span>
        </nav>

        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            How to Choose a Property Management Company
          </h1>
          <p className="text-lg text-muted-foreground">
            A practical, owner-first guide grounded in 20+ years of Colorado property
            management — what to compare, what to ignore, and the questions that
            separate a great manager from a costly one.
          </p>
        </header>

        <article className="prose prose-neutral dark:prose-invert max-w-none space-y-10">
          <section>
            <h2 className="text-2xl font-semibold mb-3">Why the right manager matters</h2>
            <p>
              The property management company you choose decides how quickly your
              units lease, how well your tenants are treated, and how much of your
              rent actually reaches you. A weak manager quietly erodes returns
              through vacancy, deferred maintenance, fee creep, and compliance risk.
              A strong manager protects the asset and gives you back your time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">What services do property management companies provide?</h2>
            <div className="grid sm:grid-cols-2 gap-4 not-prose">
              {[
                { icon: Building2, title: "Leasing & marketing", body: "Listing, showings, screening, lease execution." },
                { icon: Wallet, title: "Rent collection & accounting", body: "Rent, late fees, owner draws, monthly statements." },
                { icon: Wrench, title: "Maintenance coordination", body: "Vetted vendors, 24/7 emergency response, preventative care." },
                { icon: Scale, title: "Compliance", body: "Fair housing, security deposit law, Colorado warranty of habitability." },
                { icon: BarChart3, title: "Reporting", body: "Owner portal, year-end 1099s, performance reviews." },
                { icon: ShieldCheck, title: "Risk management", body: "Inspections, insurance coordination, eviction handling." },
              ].map(({ icon: Icon, title, body }) => (
                <Card key={title} className="border-l-4 border-primary/60">
                  <CardContent className="pt-6">
                    <Icon className="h-5 w-5 text-primary mb-2" aria-hidden="true" />
                    <h3 className="font-semibold mb-1">{title}</h3>
                    <p className="text-sm text-muted-foreground">{body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Fee structure — read past the headline rate</h2>
            <p>
              Most companies quote a monthly management fee of 8–12% of collected
              rent. That number on its own tells you almost nothing. Ask for the
              full schedule and compare line by line:
            </p>
            <ul>
              <li><strong>Leasing fee</strong> — typically 50–100% of one month's rent per new tenant placement.</li>
              <li><strong>Renewal fee</strong> — should be modest ($150–$300) or waived.</li>
              <li><strong>Maintenance markup</strong> — some firms add 10–20% on every invoice. Monarch passes vendor invoices through at cost.</li>
              <li><strong>Vacancy fee, inspection fee, setup fee</strong> — common surprises. Get them in writing.</li>
              <li><strong>Trust accounting</strong> — owner funds must sit in a separate trust account, not the manager's operating account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Communication protocols</h2>
            <p>
              The single biggest predictor of owner satisfaction is responsiveness.
              Before you sign, pin down:
            </p>
            <ul>
              <li>Response-time commitments for owners, tenants, and emergencies (Monarch: same business day for owners, 4 hours for tenant emergencies).</li>
              <li>Named point of contact vs. shared inbox.</li>
              <li>Owner portal access — can you see leases, statements, work orders, and inspection photos any time?</li>
              <li>How decisions over a spending threshold (usually $300–$500) are approved.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. Maintenance handling</h2>
            <p>
              Maintenance is where margins are won or lost. Ask:
            </p>
            <ul>
              <li>Do you use in-house technicians, a vetted vendor network, or whoever is cheapest?</li>
              <li>How are emergencies triaged after hours?</li>
              <li>Do you perform preventative inspections (HVAC, roof, plumbing) on a schedule?</li>
              <li>Can I see a sample maintenance report?</li>
            </ul>
            <p>
              A manager that documents work with timestamped photos and invoices
              protects both your asset and your tax position.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Tenant screening standards</h2>
            <p>
              The cost of a bad tenant — eviction, damages, lost rent — typically
              exceeds 6–12 months of management fees. A serious manager will share
              their screening criteria in writing: credit minimum, income-to-rent
              ratio (usually 3x), rental history, criminal background, and
              fair-housing compliant decisioning.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Local expertise and licensing</h2>
            <p>
              Colorado has specific rules around security deposits (one-month cap
              typical, 30–60 day return window), warranty of habitability, and bed
              bug disclosure. Your manager should be Colorado-licensed, carry E&amp;O
              insurance, and have a working knowledge of city-level rules in your
              market (Denver, Aurora, Colorado Springs, Castle Rock all differ).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Reporting and transparency</h2>
            <p>
              You should receive a monthly owner statement with rent, expenses,
              vendor invoices, and net distribution — plus a year-end summary and
              1099s. Ask to see a sample statement and an owner-portal demo before
              you commit.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">A 10-question shortlist for your first call</h2>
            <ol className="space-y-2">
              {[
                "What is your full fee schedule, including leasing, renewal, and maintenance markups?",
                "How long is your average vacancy between tenants in my submarket?",
                "What are your written tenant screening criteria?",
                "What is your emergency response time, and who answers after hours?",
                "Do you use in-house maintenance or vetted vendors? Any markup?",
                "Can I see a sample monthly owner statement and inspection report?",
                "How do you handle late rent and the eviction process in Colorado?",
                "What insurance do you carry, and are owner funds in a trust account?",
                "What is your tenant retention rate over the last 12 months?",
                "What does it take to cancel the management agreement?",
              ].map((q) => (
                <li key={q} className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{q}</span>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Why owners choose Monarch</h2>
            <p>
              Monarch Property Management has spent 20+ years managing residential
              and small-commercial properties across Colorado's Front Range. We
              publish our full fee schedule, pass vendor invoices through at cost,
              respond to owner messages the same business day, and back every
              report with photos and documentation through your owner portal.
            </p>
            <div className="not-prose flex flex-wrap gap-3 mt-6">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Talk to a Monarch manager
              </Link>
              <Link
                to="/services/property-management"
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-5 py-2.5 text-sm font-medium hover:bg-accent"
              >
                <MessageSquare className="h-4 w-4 mr-2" aria-hidden="true" />
                See our services
              </Link>
            </div>
          </section>
        </article>
      </main>
    </>
  );
}
