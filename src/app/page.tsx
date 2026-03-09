import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
      <h1 className="text-4xl font-bold text-foreground mb-2">
        ZephyrOS
      </h1>
      <p className="text-muted mb-8">
        Sistema operativo ZephyrStudio - Kit Digital 2026
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-lg bg-accent px-4 py-2 text-background font-medium hover:opacity-90"
        >
          Iniciar sesión
        </Link>
      </div>
    </main>
  );
}
