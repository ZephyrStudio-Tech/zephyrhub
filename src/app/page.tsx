import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">
        ZephyrOS
      </h1>
      <p className="text-gray-500 mb-8">
        Sistema operativo ZephyrStudio - Kit Digital
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-lg bg-brand-500 px-4 py-2 text-white font-medium hover:bg-brand-600"
        >
          Iniciar sesión
        </Link>
      </div>
    </main>
  );
}
