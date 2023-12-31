import 'bootstrap/dist/css/bootstrap.css'
import './globals.css'
import { Inter } from 'next/font/google'


const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Dashboard creator',
  description: 'NextJS dashboard creator',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <html lang="en">
      <body className={`${inter.className} bg-light`}>
        {children}
      </body>
    </html>
  )
}
