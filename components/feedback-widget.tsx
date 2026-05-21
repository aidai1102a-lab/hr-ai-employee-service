"use client";

import { Star, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FeedbackWidget({ messageId }: { messageId?: string }) {
  async function submit(rating: number, stars?: number) {
    if (!messageId) return;
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messageId, rating, stars })
    });
  }

  return (
    <div className="flex items-center gap-1">
      <Button size="icon" variant="ghost" aria-label="有帮助" onClick={() => submit(1)}>
        <ThumbsUp className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" aria-label="无帮助" onClick={() => submit(-1)}>
        <ThumbsDown className="h-4 w-4" />
      </Button>
      {[1, 2, 3, 4, 5].map((value) => (
        <Button key={value} size="icon" variant="ghost" aria-label={`${value}星`} onClick={() => submit(value >= 4 ? 1 : -1, value)}>
          <Star className="h-4 w-4" />
        </Button>
      ))}
    </div>
  );
}
