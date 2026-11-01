
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AvailableSkills, CommonTechStacks, AutonomyLevelValues, BudgetCategoryValues } from '@/types';
import type { AutofillJobDetailsOutput, AutonomyLevel, BudgetCategory } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { Edit3, Sparkles, Calendar as CalendarIcon, Cpu, Brain, Settings2, Loader2, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React, { useState } from 'react';
import { getAutofillJobSuggestions } from '@/app/jobs/post/actions'; 
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  naturalLanguageQuery: z.string().optional().describe("A natural language description to help auto-fill the form."),
  companyName: z.string().min(2, { message: "Company name must be at least 2 characters." }),
  projectTitle: z.string().min(5, { message: "Project title must be at least 5 characters." }),
  projectDescription: z.string().min(50, { message: "Project description must be at least 50 characters." }).max(2000),
  requiredSkills: z.array(z.string()).default([]),
  customSkillsInput: z.string().optional(),
  selectedCommonTechStacks: z.array(z.string()).optional(),
  customTechStackInput: z.string().optional().describe("Comma-separated list of custom technologies."),
  desiredAutonomyLevel: z.enum(AutonomyLevelValues).optional(),
  budgetCategory: z.enum(BudgetCategoryValues).optional(),
  budget: z.string().min(3, { message: "Budget information is required." }),
  duration: z.string().optional(),
  contactEmail: z.string().email({ message: "Please enter a valid contact email." }),
  agentBenefits: z.string().optional().describe("What the agent/agency will gain from this project (e.g., experience, portfolio piece, long-term collaboration)."),
  preferredOnboardingDate: z.date().optional(),
}).refine(data => 
    (data.requiredSkills && data.requiredSkills.length > 0) || 
    (data.customSkillsInput && data.customSkillsInput.trim() !== ''), 
  {
    message: "Please select at least one predefined skill or enter custom skills.",
    path: ["requiredSkills"], 
  }
);

type PostJobFormData = z.infer<typeof formSchema>;

export function PostJobForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autofillError, setAutofillError] = useState<string | null>(null);

  const form = useForm<PostJobFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      naturalLanguageQuery: "",
      companyName: "",
      projectTitle: "",
      projectDescription: "",
      requiredSkills: [],
      customSkillsInput: "",
      selectedCommonTechStacks: [],
      customTechStackInput: "",
      desiredAutonomyLevel: undefined,
      budgetCategory: undefined,
      budget: "",
      duration: "",
      contactEmail: "",
      agentBenefits: "",
      preferredOnboardingDate: undefined,
    },
  });

  const handleAutofill = async () => {
    const query = form.getValues("naturalLanguageQuery");
    if (!query || query.trim() === "") {
      setAutofillError("Please enter a project description to auto-fill from.");
      toast({
        variant: "destructive",
        title: "Autofill Error",
        description: "Project description for autofill cannot be empty.",
      });
      return;
    }
    setIsAutofilling(true);
    setAutofillError(null);
    try {
      const result = await getAutofillJobSuggestions(query);
      if ('error' in result) {
        setAutofillError(result.error);
        toast({
          variant: "destructive",
          title: "Autofill Failed",
          description: result.error,
        });
      } else {
        const suggestions = result as AutofillJobDetailsOutput;
        if (suggestions.suggestedProjectTitle) {
          form.setValue("projectTitle", suggestions.suggestedProjectTitle);
        }
        if (suggestions.refinedProjectDescription) {
          form.setValue("projectDescription", suggestions.refinedProjectDescription);
        }
        if (suggestions.suggestedSkills && suggestions.suggestedSkills.length > 0) {
          const validSuggestedSkills = suggestions.suggestedSkills.filter(skill => AvailableSkills.includes(skill));
          form.setValue("requiredSkills", validSuggestedSkills);
          
          const customSuggestedSkills = suggestions.suggestedSkills.filter(skill => !AvailableSkills.includes(skill));
          if (customSuggestedSkills.length > 0) {
            const currentCustom = form.getValues("customSkillsInput") || "";
            const newCustom = Array.from(new Set([...currentCustom.split(',').map(s=>s.trim()).filter(Boolean), ...customSuggestedSkills])).join(', ');
            form.setValue("customSkillsInput", newCustom);
          }
        }
        toast({
          title: "Details Suggested",
          description: "Form fields have been updated with AI suggestions. Please review and complete the rest of the form.",
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred during autofill.";
      setAutofillError(message);
      toast({
        variant: "destructive",
        title: "Autofill Error",
        description: message,
      });
    } finally {
      setIsAutofilling(false);
    }
  };

  async function onSubmit(values: PostJobFormData) {
    const predefinedSkills = values.requiredSkills || [];
    const customSkills = values.customSkillsInput
      ? values.customSkillsInput.split(',').map(skill => skill.trim()).filter(skill => skill !== '')
      : [];
    
    const allRequiredSkills = Array.from(new Set([...predefinedSkills, ...customSkills]));

    if (allRequiredSkills.length === 0) {
      form.setError("requiredSkills", { 
        type: "manual", 
        message: "Please provide at least one skill (either select from the list or add custom ones)." 
      });
      return;
    }

    const commonTech = values.selectedCommonTechStacks || [];
    const customTech = values.customTechStackInput
      ? values.customTechStackInput.split(',').map(tech => tech.trim()).filter(tech => tech !== '')
      : [];
    const allProjectTechStack = Array.from(new Set([...commonTech, ...customTech]));

    const jobDataToPost: Record<string, any> = {
      companyName: values.companyName,
      companyLogoUrl: 'https://placehold.co/60x60.png',
      dataAiHintCompanyLogo: 'company logo',
      projectTitle: values.projectTitle,
      projectDescription: values.projectDescription,
      requiredSkills: allRequiredSkills,
      budget: values.budget,
      budgetCategory: values.budgetCategory || 'To Be Discussed',
      contactEmail: values.contactEmail,
      status: 'Open',
      postedDate: new Date().toISOString(),
    };

    if (allProjectTechStack.length > 0) {
      jobDataToPost.projectTechStack = allProjectTechStack;
    }
    if (values.desiredAutonomyLevel) {
      jobDataToPost.desiredAutonomyLevel = values.desiredAutonomyLevel;
    }
    if (values.duration) {
      jobDataToPost.duration = values.duration;
    }
    if (values.agentBenefits) {
      jobDataToPost.agentBenefits = values.agentBenefits;
    }
    if (values.preferredOnboardingDate) {
      jobDataToPost.preferredOnboardingDate = format(values.preferredOnboardingDate, "yyyy-MM-dd");
    }

    setIsSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, "jobs"), jobDataToPost);
      toast({
        title: "Job Request Published!",
        description: "Your project is now live on the AgentVerse job board.",
      });
      form.reset();
      router.push(`/jobs/${docRef.id}`);
    } catch (error) {
      console.error("Error saving job request:", error);
      toast({
        title: "Job Request Recorded",
        description: "Your job request has been recorded locally.",
      });
      router.push("/jobs");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="naturalLanguageQuery"
          render={({ field }) => (
            <FormItem className="p-4 border rounded-md bg-muted/30">
              <FormLabel className="text-lg flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Describe Your Project (Optional AI Assist)
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us about your project in your own words. For example: 'I need an AI agent to handle customer support for my online bookstore. It should answer FAQs, track orders, and escalate complex issues to a human agent. We use Shopify.'"
                  rows={5}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Provide a description, and our AI can help suggest a title, refine the description, and pick relevant skills for the form below.
              </FormDescription>
              <Button 
                type="button" 
                onClick={handleAutofill} 
                disabled={isAutofilling}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                {isAutofilling ? (
                  <>
                    <span className="animate-spin mr-2 h-4 w-4 border-2 border-transparent border-t-primary rounded-full"></span>
                    Suggesting...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" /> Suggest Details with AI
                  </>
                )}
              </Button>
              {autofillError && <FormMessage>{autofillError}</FormMessage>}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="Your Company Inc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="projectTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., AI Chatbot for Customer Support" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="projectDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the project in detail, including objectives, scope, and expected deliverables..."
                  rows={6}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Provide as much detail as possible. (Min 50 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="agentBenefits"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
                Benefits for the Agent/Agency (Optional)
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe what the AI agent or agency will gain from this project. e.g., Unique experience, valuable portfolio piece, potential for long-term partnership, access to specific data/technology etc."
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Help attract top AI talent by highlighting the unique advantages of this opportunity.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requiredSkills"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Required Skills</FormLabel>
                <FormDescription>
                  Select common skills from the list. Add more specific or custom skills in the field below. Each custom skill (comma-separated) will become a distinct tag.
                </FormDescription>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {AvailableSkills.map((skill) => (
                <FormField
                  key={skill}
                  control={form.control}
                  name="requiredSkills"
                  render={({ field }) => {
                    return (
                      <FormItem
                        className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 shadow-sm hover:bg-muted/50 transition-colors"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(skill)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...(field.value || []), skill])
                                : field.onChange(
                                    (field.value || []).filter(
                                      (value) => value !== skill
                                    )
                                  );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer flex-1 text-sm">
                          {skill}
                        </FormLabel>
                      </FormItem>
                    );
                  }}
                />
              ))}
              </div>
              <FormMessage /> {/* This will show the .refine() error message */}
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="customSkillsInput"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custom or Additional Skills (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., DialogFlow, Advanced SEO Auditing, Custom NLP Models" {...field} />
              </FormControl>
              <FormDescription>
                Enter any skills not listed above, separated by commas. Each item will become a tag.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="selectedCommonTechStacks"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base flex items-center gap-1.5">
                  <Cpu className="h-5 w-5 text-primary" />
                  Project Tech Stack (Optional)
                </FormLabel>
                <FormDescription>
                  Select common technologies from the list. Add any other specific tech in the field below (comma-separated).
                </FormDescription>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {CommonTechStacks.map((tech) => (
                <FormField
                  key={tech}
                  control={form.control}
                  name="selectedCommonTechStacks"
                  render={({ field }) => {
                    return (
                      <FormItem
                        className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 shadow-sm hover:bg-muted/50 transition-colors"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(tech)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...(field.value || []), tech])
                                : field.onChange(
                                    (field.value || []).filter(
                                      (value) => value !== tech
                                    )
                                  );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer flex-1 text-sm">
                          {tech}
                        </FormLabel>
                      </FormItem>
                    );
                  }}
                />
              ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customTechStackInput"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custom or Additional Tech Stack (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Next.js 14, Genkit, Custom NLP library" {...field} />
              </FormControl>
              <FormDescription>
                Enter any tech stack items not listed above, separated by commas. Each item will become a tag.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="desiredAutonomyLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5">
                <Settings2 className="h-5 w-5 text-primary" />
                Desired Level of Agent Autonomy
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select the desired autonomy level..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {AutonomyLevelValues.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                How independently should the AI agent operate?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />


        <div className="grid md:grid-cols-3 gap-6 items-start">
            <FormField
              control={form.control}
              name="budgetCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-primary" />
                    Budget Range
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select budget tier..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BudgetCategoryValues.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Specific Budget / Rate</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., $1000 - $2000, or $75/hour" {...field} />
                </FormControl>
                <FormDescription>Enter estimated budget or rate.</FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Project Duration (Optional)</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., 2-4 weeks, Ongoing" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        
        <FormField
          control={form.control}
          name="preferredOnboardingDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Preferred Onboarding Date (Optional)</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full md:w-[280px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < new Date(new Date().setDate(new Date().getDate() - 1)) 
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                When would you ideally like the agent to start?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

         <FormField
          control={form.control}
          name="contactEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="your.email@company.com" {...field} />
              </FormControl>
              <FormDescription>This email will be used for agents to contact you.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isAutofilling || isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Publishing Job Request...
            </>
          ) : (
            <>
              <Edit3 className="mr-2 h-5 w-5" />
              Post Job Request
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
