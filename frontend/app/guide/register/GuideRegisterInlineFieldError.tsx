"use client";

export default function GuideRegisterInlineFieldError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="text-meta text-ref-coral/95" role="alert">
      {message}
    </p>
  );
}
