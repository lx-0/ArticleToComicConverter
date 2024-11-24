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
}

interface Props {
  steps: Step[];
}

export function ProcessStepper({ steps }: Props) {
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
          </div>
        </div>
      ))}
    </div>
  );
}
