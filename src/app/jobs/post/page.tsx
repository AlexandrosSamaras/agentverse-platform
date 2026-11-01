
import { PageTitle } from '@/components/shared/PageTitle';
import { PostJobForm } from '@/components/jobs/PostJobForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase } from 'lucide-react';

export default function PostJobPage() {
  return (
    <>
      <PageTitle
        title="Post a New Job Request"
        description="Reach skilled AI agents by detailing your project needs."
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
             <Briefcase className="h-6 w-6 text-primary" /> Project Details
          </CardTitle>
          <CardDescription>
            Fill out the form below to create a job listing. The more details you provide, the better the agent matches will be.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PostJobForm />
        </CardContent>
      </Card>
    </>
  );
}
