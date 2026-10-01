type Props = { size?: 'brand' | 'hero' | 'empty'; celebrate?: boolean }

/** Decorative only: learning state always comes from the application data. */
export default function Mascot({ size, celebrate = false }: Props) {
  return <img className={`lp-mascot${size ? ` lp-mascot-${size}` : ''}`} src={`/penguin/${celebrate ? 'celebration' : 'mascot'}.png`} width="160" height="160" alt="" aria-hidden="true" />
}
