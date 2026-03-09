import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // IMPORTANTE: Esto refresca la cookie de sesión de Supabase
  const { data: { user } } = await supabase.auth.getUser();

  // Redirigir /admin y /admin/* a /backoffice (los layouts decidirán por rol)
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = request.nextUrl.pathname.replace(/^\/admin/, "/backoffice") || "/backoffice";
    const res = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => res.cookies.set(c.name, c.value));
    return res;
  }

  // Si intenta acceder a una ruta privada sin estar logueado, al login.
  if (!user && isProtectedPath(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Si ya está logueado e intenta ir al login, lo mandamos al index protegido (el layout decidirá su destino final)
  if (user && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/portal"; // Ruta por defecto segura, los layouts harán la redirección final si es admin o consultor
    const res = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => res.cookies.set(c.name, c.value));
    return res;
  }

  return response;
}

function isProtectedPath(pathname: string) {
  return (
    pathname.startsWith("/portal") ||
    pathname.startsWith("/backoffice") ||
    pathname.startsWith("/admin")
  );
}
