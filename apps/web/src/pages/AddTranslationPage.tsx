import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/stores";

const schema = z.object({
  name: z.string().trim().min(1, "Word is required"),
  context: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function AddTranslationPage() {
  const { listSlug = "", wordSlug = "" } = useParams();
  const navigate = useNavigate();
  const word = useAppStore((state) => state.vocabulary.get(wordSlug));
  const addWord = useAppStore((state) => state.addWord);
  const assignTranslationToWord = useAppStore(
    (state) => state.assignTranslationToWord,
  );
  const [withContext, setWithContext] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", context: "" },
  });

  if (!word) {
    return <Navigate to={`/lists/${listSlug}`} replace />;
  }

  const onSubmit = form.handleSubmit((values) => {
    const translationSlug = addWord({
      name: values.name,
      language: "polish",
      notes: withContext ? (values.context ?? "").trim() : "",
    });
    if (!translationSlug) {
      toast.error("A word with that name already exists");
      return;
    }
    assignTranslationToWord(word.slug, translationSlug);
    toast.success("Translation added");
    navigate(-1);
  });

  return (
    <div className="space-y-4 px-2">
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <h2 className="font-semibold">Add Word</h2>
        <Button type="button" size="icon" onClick={onSubmit} aria-label="Save">
          <Check />
        </Button>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="translation">Word in original language</Label>
          <Input
            id="translation"
            {...form.register("name")}
            placeholder="Word in original language"
          />
          {form.formState.errors.name ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.name.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-3 rounded-xl bg-card/60 p-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="with-context">With Context</Label>
            <Switch
              id="with-context"
              checked={withContext}
              onCheckedChange={setWithContext}
            />
          </div>
          {withContext ? (
            <Textarea
              {...form.register("context")}
              placeholder="Context in target language"
            />
          ) : null}
        </div>
      </form>
    </div>
  );
}
