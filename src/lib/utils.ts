import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Genera contraseña robusta: 2 MAYUS + 4 DIGITS + 2 SPECIAL (!@#$%) */
export function generateStaffPassword(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const specials = "!@#$%";

  let pass = "";
  for (let i = 0; i < 2; i++) pass += letters.charAt(Math.floor(Math.random() * letters.length));
  for (let i = 0; i < 4; i++) pass += digits.charAt(Math.floor(Math.random() * digits.length));
  for (let i = 0; i < 2; i++) pass += specials.charAt(Math.floor(Math.random() * specials.length));

  return pass;
}
