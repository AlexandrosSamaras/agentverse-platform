
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Wand2 } from "lucide-react";

// Schema now only includes projectDescription
const formSchema = z.object({
  projectDescription: z.string().min(50, { message: "Project description must be at least 50 characters." }).max(2000, {message: "Project description must be less than 2000 characters."}),
});

type RecommendationFormData = z.infer<typeof formSchema>;

interface RecommendationFormProps {
  onSubmit: (projectDescription: string) => Promise<void>; // onSubmit now takes only projectDescription
  isLoading: boolean;
}

export function RecommendationForm({ onSubmit, isLoading }: RecommendationFormProps) {
  const form = useForm<RecommendationFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectDescription: "",
    },
  });

  const handleSubmit = (values: RecommendationFormData) => {
    onSubmit(values.projectDescription); // Pass only the description
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="projectDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg">Tell Us About Your Project</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your project in detail. What are your goals? What kind of tasks will the AI agent perform? The more detail you provide, the better our AI can match you with suitable agents."
                  rows={8}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Our AI will analyze your description to suggest the best agents. (Min 50 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isLoading} size="lg" className="w-full sm:w-auto">
          <Wand2 className="mr-2 h-5 w-5" />
          {isLoading ? "Analyzing & Recommending..." : "Get AI Recommendations"}
        </Button>
      </form>
    </Form>
  );
}
