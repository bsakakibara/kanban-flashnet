import { User } from 'lucide-react'

interface AvatarProps {
  username?: string
  size?: number
  fontSize?: number
}

const COLORS = ['#378ADD', '#639922', '#BA7517', '#E24B4A', '#534AB7', '#0F6E56']

function getColor(username: string): string {
  return COLORS[username.charCodeAt(0) % COLORS.length]
}

export function Avatar({ username, size = 28, fontSize = 11 }: AvatarProps) {
  if (!username) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        backgroundColor: '#EBEBEA',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <User size={size * 0.5} color="#888780" />
      </div>
    )
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      backgroundColor: getColor(username),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize, fontWeight: 600, color: '#FFFFFF',
      flexShrink: 0,
    }}>
      {username.slice(0, 2).toUpperCase()}
    </div>
  )
}