import AdminNav from "@/components/AdminNav";

export default async function AdminLayout({children}:{children:React.ReactNode}){
 return <div className="mx-auto grid w-full max-w-[1600px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8"><AdminNav/><main className="min-w-0">{children}</main></div>
}
