import Image from "next/image";
import { login } from "./actions";
export default function LoginPage({
searchParams,
}: {
searchParams: { error?: string };
}) {
return (
<main className="min-h-screen flex items-center justify-center px-4">
<div className="card w-full max-w-sm p-10 shadow-2xl text-center">
<Image
src="/logo.png"
alt="Rizzy - Curly Hair Care"
width={280}
height={163}
className="mx-auto mb-4 h-auto w-auto max-h-24"
priority
/>
<p className="font-mono text-xs uppercase tracking-wider text-muted-700 mb-8">
Rizzy.VE
</p>
<form action={login} className="text-left space-y-3">
<div>
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">
Correo
</label>
<input
type="email"
name="email"
required
className="input-rz"
placeholder="tucorreo@gmail.com"
/>
</div>
<div>
<label className="block text-xs uppercase tracking-wide text-muted-700 font-mono mb-1">
Contraseña
</label>
<input
type="password"
name="password"
required
className="input-rz"
placeholder="••••••••"
/>
</div>
{searchParams?.error && (
<p className="text-coral-500 text-sm font-semibold">
Correo o contraseña incorrectos.
</p>
)}
<button type="submit" className="btn-primary w-full py-3 mt-2">
Entrar
</button>
</form>
</div>
</main>
);
}