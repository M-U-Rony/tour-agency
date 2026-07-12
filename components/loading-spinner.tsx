export default function LoadingSpinner({ fullScreen = false }: { fullScreen?: boolean }) {
  const spinner = (
    <div
      className="h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-t-transparent"
      role="status"
      aria-label="Loading"
    />
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4fbf8]">
        {spinner}
      </div>
    );
  }

  return spinner;
}
