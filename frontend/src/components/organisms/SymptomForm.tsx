import { useState } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export interface SymptomFormValues {
  symptom: string;
  sido: string;
  sigungu: string;
}

interface SymptomFormProps {
  isLoading: boolean;
  onSubmit: (values: SymptomFormValues) => void;
}

export function SymptomForm({
  isLoading,
  onSubmit,
}: SymptomFormProps) {
  const [symptom, setSymptom] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit({ symptom, sido: "", sigungu: "" });
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-2 text-xl font-black text-slate-950">
        어떤 증상인가요?
        <Textarea
          value={symptom}
          onChange={(e) => setSymptom(e.target.value)}
          placeholder="예: 며칠째 기침이 심하고 열이 살짝 나요"
          rows={3}
          required
        />
      </label>

      <Button
        data-tour="submit-button"
        type="submit"
        size="lg"
        className="min-h-14 rounded-2xl text-xl font-black"
        disabled={isLoading || !symptom.trim()}
      >
        {isLoading ? "진료 방향 판단 중..." : "증상으로 병원 안내받기"}
      </Button>
    </form>
  );
}
