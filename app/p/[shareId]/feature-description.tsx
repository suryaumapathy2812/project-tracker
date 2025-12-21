"use client";

import Tiptap from "@/components/ui/tiptap";

interface FeatureDescriptionProps {
  content: string;
}

export function FeatureDescription({ content }: FeatureDescriptionProps) {
  return (
    <div>
      <Tiptap
        content={content}
        editable={false}
        className="border-0 bg-transparent p-0 [&>div]:p-0 [&_.tiptap]:text-stone-600 dark:[&_.tiptap]:text-stone-400"
      />
    </div>
  );
}
