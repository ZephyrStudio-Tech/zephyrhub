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

  // Refresh session (token rotation) on every request
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Helper: redirect manteniendo las cookies de sesión (evita ERR_TOO_MANY_REDIRECTS)
  const redirectWithCookies = (pathname: string) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    const res = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => {
      res.cookies.set(c.name, c.value);
    });
    return res;
  };

  // Redirigir /admin y /admin/* a /backoffice (una sola área con sidebar por rol)
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const pathname = request.nextUrl.pathname.replace(/^\/admin/, "/backoffice") || "/backoffice";
    return redirectWithCookies(pathname);
  }

  if (!user && isProtectedPath(request.nextUrl.pathname)) {
    return redirectWithCookies("/login");
  }

  if (user && request.nextUrl.pathname === "/login") {
    const pathname = await getRedirectForUser(supabase, user.id);
    return redirectWithCookies(pathname);
  }

  if (user && isProtectedPath(request.nextUrl.pathname)) {
    const role = await getRole(supabase, user.id);
    if (!role) {
      return redirectWithCookies("/sin-perfil");
    }
    if (
      request.nextUrl.pathname.startsWith("/backoffice") &&
      !["consultor", "tecnico", "admin"].includes(role)
    ) {
      return redirectWithCookies("/portal");
    }
    if (
      request.nextUrl.pathname.startsWith("/portal") &&
      role !== "beneficiario" &&
      role !== "admin"
    ) {
      return redirectWithCookies("/backoffice");
    }
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

async function getRole(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  userId: string
) {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  return data?.role ?? null;
}

async function getRedirectForUser(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  userId: string
) {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  const role = data?.role;
  if (!role) return "/sin-perfil";
  if (role === "beneficiario") return "/portal";
  return "/backoffice";
}
