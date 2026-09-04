'use client';

export function EmptyState({ userName = 'UDAY' }) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <h1 className="text-2xl font-semibold text-foreground">
        Hello, <span className="text-blue-400">{userName}</span>
      </h1>
    </div>
  );
}
