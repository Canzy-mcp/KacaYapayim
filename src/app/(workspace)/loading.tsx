export default function WorkspaceLoading() {
  return <div className="min-h-screen bg-canvas px-5 py-10 lg:pl-72"><div className="mx-auto max-w-6xl animate-pulse"><div className="h-10 w-64 rounded-lg bg-line" /><div className="mt-4 h-5 w-80 max-w-full rounded-lg bg-line" /><div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-36 rounded-xl bg-white" />)}</div></div></div>;
}
