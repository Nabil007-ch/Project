import { useId, useState } from 'react'
import { CircleHelp } from 'lucide-react'

/** Focus, hover, and tap all expose the same explanation. Escape dismisses it. */
export function Tooltip({ term, children }: { term: string; children: string }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  return (
    <span
      className="ui-tooltip"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="ui-tooltip-trigger"
        aria-label={`About ${term}`}
        aria-describedby={open ? id : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setOpen(false)
            event.stopPropagation()
          }
        }}
      >
        <CircleHelp size={15} aria-hidden="true" />
      </button>
      {open && (
        <span role="tooltip" id={id} className="ui-tooltip-content">
          {children}
        </span>
      )}
    </span>
  )
}
