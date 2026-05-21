import TambahMarketingForm from './TambahForm'
import { checkRole } from '@/utils/rbac'

export default async function TambahMarketingPage() {
  await checkRole(['admin', 'principal'])

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Tambah Staf Marketing</h2>
        <p className="text-sm text-zinc-500 font-medium">
          Daftarkan agen marketing baru ke database LJ Hooker Semarang Kota.
        </p>
      </div>
      <TambahMarketingForm />
    </div>
  )
}
