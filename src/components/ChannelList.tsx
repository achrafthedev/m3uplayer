interface ChannelListEntry {
  id: string
  name: string
  logo?: string
}

interface ChannelListProps {
  items: ChannelListEntry[]
  activeId: string | null
  onSelect: (id: string) => void
}

export function ChannelList({ items, activeId, onSelect }: ChannelListProps) {
  return (
    <div className="channel-list">
      {items.map((item) => (
        <div
          key={item.id}
          className={`channel-item${item.id === activeId ? ' active' : ''}`}
          onClick={() => onSelect(item.id)}
        >
          {item.logo ? (
            <img className="logo" src={item.logo} alt="" loading="lazy" onError={(e) => (e.currentTarget.style.visibility = 'hidden')} />
          ) : (
            <span className="logo" style={{ display: 'inline-block' }} />
          )}
          <span className="name">{item.name}</span>
        </div>
      ))}
      {items.length === 0 && <div className="empty-state">No results</div>}
    </div>
  )
}
