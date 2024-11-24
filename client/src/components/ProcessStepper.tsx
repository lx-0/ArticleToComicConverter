import {
  Check,
  Loader2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";

interface Step {
  step: string;
  status: "pending" | "in-progress" | "complete" | "error";
  result?: string;
  content?: {
    type: "text" | "image";
    data: string;
  };
}

interface Props {
  steps: Step[];
  isFromCache?: boolean;
}

export function ProcessStepper({ steps, isFromCache }: Props) {
  // If loaded from cache, only show a single completed step
  if (isFromCache) {
    return (
      <div className="space-y-4">
        <div className="flex items-start p-4 rounded-lg bg-black/30">
          <div className="mr-4">
            <Check className="w-5 h-5 text-green-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-purple-200">Comic Retrieved from Cache</h3>
            <p className="mt-1 text-sm text-gray-400">
              Previous generation results loaded successfully
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Original stepper implementation for new generations
  const completedSteps = steps.filter(step => step.status === "complete").length;
  const progress = (completedSteps / steps.length) * 100;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-purple-200">
          <span>{completedSteps} of {steps.length} steps completed</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="bg-black/30 h-2" />
      </div>
      {steps.map((step, index) => (
        <Collapsible key={index}>
          <CollapsibleTrigger className="w-full text-left">
            <div className={`flex items-start p-4 rounded-lg transition-colors ${
              step.status === "in-progress"
                ? "bg-purple-900/20 border border-purple-500/30"
                : "bg-black/30"
            }`}>
              <div className="mr-4">
                {step.status === "complete" && (
                  <Check className="w-5 h-5 text-green-500" />
                )}
                {step.status === "in-progress" && (
                  <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
                )}
                {step.status === "error" && (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                {step.status === "pending" && (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-purple-200">{step.step}</h3>
                  {step.content && (
                    <ChevronRight className="w-4 h-4 text-purple-400 transform transition-transform ml-auto" />
                  )}
                </div>
                {step.result && (
                  <p className="mt-1 text-sm text-gray-400">{step.result}</p>
                )}
                {step.content && (
                  <CollapsibleContent className="mt-4">
                    {step.content.type === "text" && (
                      <div className="bg-black/20 p-3 rounded-md text-sm font-mono text-purple-200">
                        {typeof step.content.data === 'string' ? (
                          step.content.data
                        ) : (
                          <pre>{JSON.stringify(step.content.data, null, 2)}</pre>
                        )}
                      </div>
                    )}
                    {step.content.type === "image" && (
                      <div className="mt-2">
                        <img 
                          src={step.content.data} 
                          alt="Step result"
                          className="rounded-md max-h-48 object-cover"
                        />
                      </div>
                    )}
                  </CollapsibleContent>
                )}
              </div>
            </div>
          </CollapsibleTrigger>
        </Collapsible>
      ))}
    </div>
  );
}
