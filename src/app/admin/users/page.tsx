import { prisma } from "@/lib/prisma";
import ApiButton from "@/components/ApiButton";
import StatusBadge from "@/components/StatusBadge";
import StaffForm from "@/components/StaffForm";

export const dynamic = "force-dynamic";

export default async function Users() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div>
      <div className="mb-5"><p className="eyebrow">Akun dan hak akses</p><h1 className="mt-1 text-2xl font-extrabold">Kelola Pengguna</h1><p className="mt-1 text-sm text-slate-500">Kelola akun penyewa dan petugas sarana prasarana.</p></div>
      <section className="card !p-0">
        <div className="table-wrap">
          <table className="table-base">
            <thead><tr>{["Nama", "Email", "Telepon", "Peran", "Status", "Aksi"].map(title => <th key={title}>{title}</th>)}</tr></thead>
            <tbody>{users.map(user => <tr key={user.id}>
              <td><b>{user.name}</b></td><td>{user.email}</td><td>{user.phone ?? "—"}</td><td><StatusBadge status={user.role} /></td>
              <td><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{user.isActive ? "Aktif" : "Nonaktif"}</span></td>
              <td><div className="flex flex-wrap gap-1">
                <ApiButton url={`/api/users/${user.id}`} body={{ role: user.role === "PETUGAS" ? "PENYEWA" : "PETUGAS" }} text={user.role === "PETUGAS" ? "Jadikan Penyewa" : "Jadikan Petugas"} />
                <ApiButton url={`/api/users/${user.id}`} body={{ isActive: !user.isActive }} text={user.isActive ? "Nonaktifkan" : "Aktifkan"} danger={user.isActive} ask={user.isActive ? "Nonaktifkan akun ini?" : undefined} />
              </div></td>
            </tr>)}
            {!users.length && <tr><td colSpan={6} className="py-8 text-center text-sm text-slate-500">Belum ada pengguna terdaftar.</td></tr>}</tbody>
          </table>
        </div>
      </section>
      <StaffForm />
    </div>
  );
}
