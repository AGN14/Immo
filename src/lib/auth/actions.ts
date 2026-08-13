"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession, type Role } from "@/lib/auth/mock-session";

function readRole(formData: FormData): Role {
  return formData.get("role") === "locataire" ? "locataire" : "proprietaire";
}

export async function login(formData: FormData) {
  const role = readRole(formData);
  const email = String(formData.get("email") ?? "");
  const nom = email.split("@")[0] || "Vous";
  await createSession({ role, nom, email });
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const role = readRole(formData);
  const nom = String(formData.get("nom") ?? "Vous");
  const email = String(formData.get("email") ?? "");
  const codeBien = formData.get("codeBien");
  await createSession({
    role,
    nom,
    email,
    codeBien: role === "locataire" && codeBien ? String(codeBien) : undefined,
  });
  redirect("/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/connexion");
}
