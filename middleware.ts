import { next } from "@vercel/edge"

// Protege o site inteiro com uma senha única (HTTP Basic Auth).
// A senha real vem da variável de ambiente SITE_PASSWORD, configurada no
// painel do Vercel (Settings > Environment Variables) ou via:
//   vercel env add SITE_PASSWORD production
// O valor abaixo só é usado se a variável de ambiente não estiver configurada.
const SENHA_PADRAO = "troque-esta-senha"

export const config = {
  matcher: "/((?!_vercel|favicon).*)",
}

export default function middleware(request: Request) {
  const senhaCorreta = process.env.SITE_PASSWORD || SENHA_PADRAO
  const auth = request.headers.get("authorization")

  if (auth) {
    const [, encoded] = auth.split(" ")
    try {
      const decoded = atob(encoded)
      const idx = decoded.indexOf(":")
      const senhaEnviada = idx >= 0 ? decoded.slice(idx + 1) : ""
      if (senhaEnviada === senhaCorreta) {
        return next()
      }
    } catch {
      // credenciais mal formadas, cai para o 401 abaixo
    }
  }

  return new Response("Acesso restrito. Informe a senha para continuar.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Monitor de Margem"' },
  })
}
