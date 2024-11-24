import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { generateComic } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

const formSchema = z.object({
  url: z.string().url(),
  numParts: z.number().min(1).max(10).default(3),
  summaryPrompt: z.string().optional(),
  imagePrompt: z.string().optional(),
});

type FormSchema = z.infer<typeof formSchema>;

interface Props {
  onGenerate: (cacheId: string) => void;
}

export function ArticleToComicForm({ onGenerate }: Props) {
  const { toast } = useToast();
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "https://waitbutwhy.com/table/iphone-thought-experiment",
      numParts: 3,
      summaryPrompt:
        'You are a comic book artist and storyteller. Break down the given article into ${numParts} parts and create both a summary and an image generation prompt for each part. Ensure that each image generation prompt has enough information about the general setting of the story, ensuring consistency across the images. Decide for a style and incorporate in each image generation prompt. Generate JSON in this format: { "parts": [{ "summary": "string", "prompt": "string" }] }',
      imagePrompt: "Create a single comic panel style image: ${prompt}",
    },
  });

  const mutation = useMutation({
    mutationFn: generateComic,
    onSuccess: (data) => {
      onGenerate(data.cacheId);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate comic. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-purple-200">Article URL</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="bg-black/30 border-purple-500/30"
                  placeholder="Enter article URL..."
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="numParts"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-purple-200">Number of Parts</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  className="bg-black/30 border-purple-500/30"
                  min={1}
                  max={10}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Collapsible className="space-y-4">
          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors">
            <ChevronDown className="w-4 h-4" />
            Advanced Options
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4">
            <FormField
              control={form.control}
              name="summaryPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-purple-200">
                    Summary Generation Prompt
                  </FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      className="w-full min-h-[100px] bg-black/30 border-purple-500/30 rounded-md p-2 text-purple-200"
                      placeholder="Customize how summaries are generated. Use ${numParts} as variable."
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imagePrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-purple-200">
                    Image Generation Template
                  </FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      className="w-full min-h-[100px] bg-black/30 border-purple-500/30 rounded-md p-2 text-purple-200"
                      placeholder="Customize how image prompts are generated. Use ${prompt} as variable."
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CollapsibleContent>
        </Collapsible>

        <Button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Generating..." : "Generate Comic"}
        </Button>
      </form>
    </Form>
  );
}
