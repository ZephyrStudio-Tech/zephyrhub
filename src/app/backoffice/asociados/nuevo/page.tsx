import { NewAssociateForm } from "./new-associate-form";

export default function NewAssociatePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Crear nuevo asociado</h1>
        <p className="text-slate-500 mt-1">Saca al partner el usuario de acceso y configura su perfil.</p>
      </div>

      <NewAssociateForm />
    </div>
  );
}
