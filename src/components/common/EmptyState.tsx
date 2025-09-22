export default function EmptyState({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-md">
      <div className="mb-2 text-base font-medium">{message}</div>
      <p className="text-sm text-muted-foreground">Try adjusting the filters above.</p>
    </div>
  );
}