// Simple helper component to keep code clean
function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
        {label}
      </span>
      <span className="text-base font-medium text-zinc-900 dark:text-zinc-200">
        {value}
      </span>
    </div>
  );
}

export default DetailItem;
