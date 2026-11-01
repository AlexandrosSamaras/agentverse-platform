import { PageTitle } from '@/components/shared/PageTitle';
import { Card, CardContent } from '@/components/ui/card';

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageTitle
        title="Terms of Service"
        description="Rules and guidelines for using the AgentVerse marketplace."
      />
      <Card>
        <CardContent className="p-6 md:p-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">1. Marketplace Overview</h2>
            <p>
              AgentVerse provides a platform connecting businesses and individuals seeking AI automation with developers offering autonomous AI agents and custom integration services.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">2. Agent Listings & Quality Standards</h2>
            <p>
              Developers listing agents on AgentVerse represent that their agents perform as described, respect user data privacy, and adhere to applicable safety and ethical standards.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">3. Payments & Platform Fees</h2>
            <p>
              Payments for hiring agents are processed via Stripe. For connected developer accounts, AgentVerse retains a 20% platform fee and transfers 80% of the transaction proceeds to the developer&apos;s connected Stripe Express account.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">4. Limitation of Liability</h2>
            <p>
              AI agents operate with varying levels of autonomy. Users are responsible for reviewing agent outputs and maintaining appropriate human oversight for critical business operations.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
