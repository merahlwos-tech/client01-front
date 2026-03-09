const NAVY   = '#1e1b4b'
const PURPLE = '#7c3aed'

function SizeSelector({ sizes = [], selected, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {sizes.map(({ size, price }) => {
        const isSelected = selected === size
        return (
          <button key={size} onClick={() => onChange(size)}
            className="min-w-[52px] px-3 py-2 rounded-xl text-sm font-bold
                       transition-all duration-200 border-2"
            style={{
              background:   isSelected ? PURPLE : 'white',
              borderColor:  isSelected ? PURPLE : '#e5e7eb',
              color:        isSelected ? 'white' : NAVY,
              boxShadow:    isSelected ? '0 2px 12px rgba(124,58,237,0.3)' : 'none',
            }}>
            <span className="block">{size}</span>
            <span className="block text-[10px] font-normal mt-0.5"
              style={{ color: isSelected ? 'rgba(255,255,255,0.8)' : '#9ca3af' }}>
              {(price ?? 0).toLocaleString('fr-DZ')} DA
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default SizeSelector