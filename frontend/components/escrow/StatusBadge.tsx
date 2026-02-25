export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className="px-3 py-1 text-small rounded-sm bg-success/10 text-success">
      {status}
    </span>
  );
}
