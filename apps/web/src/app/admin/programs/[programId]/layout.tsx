export default function ProgramWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-arc-slate-50 p-6">
      {children}
    </div>
  );
}
