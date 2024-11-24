import {
  Check,
  Loader2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

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
  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div
          key={index}
          className={`flex items-start p-4 rounded-lg transition-colors ${
            step.status === "in-progress"
              ? "bg-purple-900/20 border border-purple-500/30"
              : "bg-black/30"
          }`}
        >
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
            <h3 className="font-medium text-purple-200">{step.step}</h3>
            {step.result && (
              <p className="mt-1 text-sm text-gray-400">{step.result}</p>
            )}
            {step.content && (
              <div className="mt-4">
                {step.content.type === "text" && (
                  <div className="bg-black/20 p-3 rounded-md text-sm font-mono text-purple-200">
                    {step.content.data}
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
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
