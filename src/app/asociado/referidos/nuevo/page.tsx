import { NewReferralForm } from "./referral-form";

export default function NewReferralPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Enviar nuevo referido</h1>
        <p className="text-slate-500 mt-1">Envíanos un contacto y nosotros nos encargaremos de tramitar su Kit Digital.</p>
      </div>

      <NewReferralForm />
    </div>
  );
}
