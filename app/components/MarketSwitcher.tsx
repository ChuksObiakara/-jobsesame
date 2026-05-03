'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function getMarketCookie(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;\s*)jobsesame_market=([^;]+)/);
  return match ? match[1] : '';
}

function setMarketCookie(value: string) {
  const maxAge = 60 * 60 * 24 * 30;
  document.cookie = `jobsesame_market=${value}; path=/; max-age=${maxAge}; samesite=lax`;
}

interface Props {
  compact?: boolean;
}

export default function MarketSwitcher({ compact = false }: Props) {
  const router = useRouter();
  const [market, setMarket] = useState<'ZA' | 'GB'>('ZA');

  useEffect(() => {
    const cookie = getMarketCookie();
    if (cookie === 'GB') setMarket('GB');
    else setMarket('ZA');
  }, []);

  const switchTo = (target: 'ZA' | 'GB') => {
    if (target === market) return;
    setMarketCookie(target);
    setMarket(target);
    router.push(target === 'GB' ? '/uk' : '/');
  };

  const base: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 99,
    padding: 3,
    border: '1px solid rgba(255,255,255,0.1)',
    flexShrink: 0,
  };

  const btn = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: compact ? 0 : 5,
    padding: compact ? '5px 8px' : '5px 11px',
    borderRadius: 99,
    border: 'none',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: active ? 700 : 500,
    background: active ? '#C8E600' : 'transparent',
    color: active ? '#052A14' : 'rgba(255,255,255,0.55)',
    transition: 'all 0.18s',
    whiteSpace: 'nowrap' as const,
  });

  return (
    <div style={base} title="Switch market">
      <button style={btn(market === 'ZA')} onClick={() => switchTo('ZA')}>
        <span style={{ fontSize: 14, lineHeight: 1 }}>🇿🇦</span>
        {!compact && <span>SA</span>}
      </button>
      <button style={btn(market === 'GB')} onClick={() => switchTo('GB')}>
        <span style={{ fontSize: 14, lineHeight: 1 }}>🇬🇧</span>
        {!compact && <span>UK</span>}
      </button>
    </div>
  );
}
