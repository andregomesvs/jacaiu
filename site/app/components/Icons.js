// Ícones gaming/militares SVG
// Uso: <Icons.Crosshair size={20} color="#FF4655" />

const Icon = ({ children, size = 20, color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {children}
  </svg>
);

// Crosshair (mira) — home/dashboard
export function Crosshair({ size, color, ...p }) {
  return (
    <Icon size={size} color={color} {...p}>
      <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4" strokeWidth="1.5" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
    </Icon>
  );
}

// Shield (escudo) — proteção/monitoramento
export function Shield({ size, color, ...p }) {
  return (
    <Icon size={size} color={color} {...p}>
      <path d="M12 2l8 4v6c0 5.25-3.5 8.5-8 10-4.5-1.5-8-4.75-8-10V6l8-4z" strokeWidth="1.5" />
      <path d="M9 12l2 2 4-4" strokeWidth="2" />
    </Icon>
  );
}

// Skull (caveira) — ban/banido
export function Skull({ size, color, ...p }) {
  return (
    <Icon size={size} color={color} {...p}>
      <circle cx="12" cy="10" r="8" strokeWidth="1.5" />
      <circle cx="9" cy="9" r="1.5" fill={color} stroke="none" />
      <circle cx="15" cy="9" r="1.5" fill={color} stroke="none" />
      <path d="M8 18v4h2v-2h4v2h2v-4" strokeWidth="1.5" />
      <path d="M9 14h6" strokeWidth="1.5" />
    </Icon>
  );
}

// Target (alvo) — verificar bans
export function Target({ size, color, ...p }) {
  return (
    <Icon size={size} color={color} {...p}>
      <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="6" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2" fill={color} stroke="none" />
    </Icon>
  );
}

// Swords (espadas cruzadas) — alertas
export function Swords({ size, color, ...p }) {
  return (
    <Icon size={size} color={color} {...p}>
      <path d="M3 3l7 7" strokeWidth="2" />
      <path d="M3 7V3h4" strokeWidth="2" />
      <path d="M21 3l-7 7" strokeWidth="2" />
      <path d="M21 7V3h-4" strokeWidth="2" />
      <path d="M7 17l-4 4" strokeWidth="2" />
      <path d="M17 17l4 4" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" strokeWidth="1.5" />
    </Icon>
  );
}

// Radar — lista/monitoramento
export function Radar({ size, color, ...p }) {
  return (
    <Icon size={size} color={color} {...p}>
      <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="6" strokeWidth="1" opacity="0.5" />
      <circle cx="12" cy="12" r="2" strokeWidth="1" opacity="0.3" />
      <line x1="12" y1="2" x2="12" y2="12" strokeWidth="1.5" />
      <circle cx="15" cy="8" r="1.5" fill={color} stroke="none" opacity="0.8" />
    </Icon>
  );
}

// User/Soldier — perfil
export function Soldier({ size, color, ...p }) {
  return (
    <Icon size={size} color={color} {...p}>
      <circle cx="12" cy="8" r="4" strokeWidth="1.5" />
      <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" strokeWidth="1.5" />
      <path d="M8 4l4-2 4 2" strokeWidth="1.5" />
    </Icon>
  );
}

// Plus — adicionar
export function Plus({ size, color, ...p }) {
  return (
    <Icon size={size} color={color} {...p}>
      <line x1="12" y1="5" x2="12" y2="19" strokeWidth="2.5" />
      <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2.5" />
    </Icon>
  );
}

// Search
export function Search({ size, color, ...p }) {
  return (
    <Icon size={size} color={color} {...p}>
      <circle cx="11" cy="11" r="7" strokeWidth="1.5" />
      <line x1="16" y1="16" x2="21" y2="21" strokeWidth="2" />
    </Icon>
  );
}

// Exit/Logout
export function Logout({ size, color, ...p }) {
  return (
    <Icon size={size} color={color} {...p}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeWidth="1.5" />
      <polyline points="16,17 21,12 16,7" strokeWidth="2" />
      <line x1="21" y1="12" x2="9" y2="12" strokeWidth="2" />
    </Icon>
  );
}

// Steam logo
export function SteamIcon({ size = 20, color = '#66C0F4', ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 259" fill={color} {...p}>
      <path d="M127.779 0C60.224 0 5.133 52.266 0 118.658l68.905 28.477c5.852-3.999 12.909-6.342 20.52-6.342.682 0 1.357.022 2.027.06l30.704-44.476v-.624c0-27.514 22.394-49.908 49.912-49.908 27.512 0 49.912 22.406 49.912 49.932 0 27.526-22.412 49.932-49.93 49.932h-1.16l-43.76 31.24c0 .532.024 1.064.024 1.584 0 20.644-16.784 37.428-37.44 37.428-18.18 0-33.36-13.024-36.77-30.252L3.388 161.044C21.87 216.754 73.834 258.746 127.779 258.746c70.588 0 127.78-57.186 127.78-127.373C255.559 57.186 198.367 0 127.779 0" />
    </svg>
  );
}

export default {
  Crosshair, Shield, Skull, Target, Swords, Radar,
  Soldier, Plus, Search, Logout, SteamIcon,
};
