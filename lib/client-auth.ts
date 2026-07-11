type RouterPush = { push: (href: string) => void };

export async function clientSignOut(router: RouterPush) {
  await fetch("/api/auth/signout", { method: "POST", credentials: "include" });
  window.location.href = "/signin";
}
