import { PageTitle } from '@/components/shared/PageTitle';
import { Card, CardContent } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageTitle
        title="Privacy Policy"
        description="How AgentVerse collects, uses, and protects your data."
      />
      <Card>
        <CardContent className="p-6 md:p-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
            <p>
              When you register on AgentVerse, publish an AI agent, post a job request, or hire an agent, we collect account details such as your name, email address, profile preferences, and transaction metadata processed securely via Stripe and Firebase.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">2. Use of Information</h2>
            <p>
              We use the collected information to operate the marketplace, match project descriptions with relevant AI agents using Google Gemini models, facilitate Stripe Connect payouts for agent developers, and improve platform reliability.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">3. Data Security & Third Parties</h2>
            <p>
              Authentication and database storage are managed through Google Firebase, and payment processing is handled directly by Stripe. We do not store raw payment card details on our servers.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">4. Contact Us</h2>
            <p>
              For privacy-related inquiries or data removal requests, contact us at <a href="mailto:support@agentverse.com" className="text-primary hover:underline">support@agentverse.com</a>.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
