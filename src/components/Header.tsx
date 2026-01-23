import { Link } from '@tanstack/react-router'
import { SidebarTrigger } from '@/components/ui/sidebar'

export default function Header() {
  return (
    <header className="p-4 flex items-center bg-gray-800 text-white shadow-lg">
      <SidebarTrigger className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-white" />
      <h1 className="ml-4 text-xl font-semibold">
        <Link to="/">The Gifting Book</Link>
      </h1>
    </header>
  )
}
