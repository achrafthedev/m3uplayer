interface CategoryListItem {
  id: string
  name: string
  count?: number
}

interface CategoryListProps {
  categories: CategoryListItem[]
  activeId: string | null
  onSelect: (id: string) => void
}

export function CategoryList({ categories, activeId, onSelect }: CategoryListProps) {
  return (
    <div className="category-list">
      {categories.map((cat) => (
        <div
          key={cat.id}
          className={`category-item${cat.id === activeId ? ' active' : ''}`}
          onClick={() => onSelect(cat.id)}
        >
          <span className="name">{cat.name}</span>
          {cat.count !== undefined && <span className="count">{cat.count}</span>}
        </div>
      ))}
      {categories.length === 0 && (
        <div className="empty-state">No categories</div>
      )}
    </div>
  )
}
