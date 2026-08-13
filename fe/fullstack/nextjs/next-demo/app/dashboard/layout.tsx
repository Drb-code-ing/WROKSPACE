import Link from "next/link";


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {children}
      <nav>Nav
        <Link href="/dashboard/settings">设置</Link>
      </nav>
    </div>
  )
}