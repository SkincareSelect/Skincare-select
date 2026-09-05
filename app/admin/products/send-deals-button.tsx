"use client";

import { useState, useTransition } from "react";
import { sendDealsEmail } from "./deals-actions";

export default function SendDealsButton() {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string>("");
  const [ok, setOk] = useState<boolean | null>(null);

  function handleClick() {
    setFeedback("");
    startTransition(async () => {
      const result = await sendDealsEmail();
      setOk(result.ok);
      setFeedback(result.message);
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
      <button className="btn btn-primary" onClick={handleClick} disabled={isPending}>
        {isPending ? "Sending..." : "Send deals email"}
      </button>
      {feedback && (
        <small style={{ color: ok ? "#166534" : "#be123c", maxWidth: 320, textAlign: "right" }}>
          {feedback}
        </small>
      )}
    </div>
  );
}
