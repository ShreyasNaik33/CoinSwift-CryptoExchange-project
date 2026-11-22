import React, { useEffect, useMemo, useState } from 'react';
import { HashRouter as Router, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BrainCircuit,
  ChevronDown,
  CircleUserRound,
  Eye,
  EyeOff,
  Menu,
  LogOut,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  WalletCards,
  X,
  Zap,
} from 'lucide-react';

type Coin = {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change: number;
  color: string;
  mark: string;
};

const coins: Coin[] = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', price: 64892.42, change: 2.84, color: '#f7931a', mark: 'B' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', price: 3482.16, change: 1.62, color: '#627eea', mark: 'E' },
  { id: 'solana', name: 'Solana', symbol: 'SOL', price: 172.38, change: 5.27, color: '#14f195', mark: 'S' },
  { id: 'usdcoin', name: 'USD Coin', symbol: 'USDC', price: 1, change: 0.01, color: '#2775ca', mark: '$' },
  { id: 'xrp', name: 'XRP', symbol: 'XRP', price: 0.5284, change: -1.24, color: '#252525', mark: 'X' },
];

const money = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: value < 10 ? 4 : 2 }).format(value);

function Header() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const loggedIn = localStorage.getItem('coinswift_logged_in') === 'true';
  const account = (() => {
    try {
      return JSON.parse(localStorage.getItem('coinswift_account') || 'null');
    } catch {
      return null;
    }
  })();
  const searchResults = coins.filter((coin) => `${coin.name} ${coin.symbol}`.toLowerCase().includes(searchQuery.toLowerCase()));
  const logout = () => {
    localStorage.removeItem('coinswift_logged_in');
    navigate('/');
  };
  const links = [
    ['/', 'Overview'],
    ['/market', 'Markets'],
    ['/trade', 'Trade'],
    ['/portfolio', 'Portfolio'],
  ];

  return (
    <header className="topbar">
      <div className="nav-wrap">
        <Link className="brand" to="/" onClick={() => setOpen(false)}><span className="brand-mark"><Zap size={18} fill="currentColor" /></span>CoinSwift</Link>
        <nav className={open ? 'nav-links nav-open' : 'nav-links'}>
          {links.map(([path, label]) => (
            <NavLink key={path} to={path} end={path === '/'} onClick={() => setOpen(false)}>{label}</NavLink>
          ))}
        </nav>
        <div className="nav-actions">
          <button className="icon-button search-button" aria-label="Search markets" onClick={() => setSearchOpen(true)}><Search size={18} /></button>
          {loggedIn ? (
            <>
              <button className="account-button" onClick={() => navigate('/portfolio')}><CircleUserRound size={16} />{account?.name?.split(' ')[0] || 'Account'}</button>
              <button className="icon-button" aria-label="Log out" onClick={logout}><LogOut size={17} /></button>
            </>
          ) : (
            <>
              <Link className="login-link" to="/login">Log in</Link>
              <Link className="primary-small" to="/signup">Get started</Link>
            </>
          )}
          <button className="icon-button menu-button" aria-label="Toggle menu" onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {searchOpen && (
        <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Search markets" onMouseDown={() => setSearchOpen(false)}>
          <div className="search-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="market-search modal-search"><Search size={18} /><input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search Bitcoin, ETH, SOL..." /><button aria-label="Close search" onClick={() => setSearchOpen(false)}><X size={18} /></button></div>
            <div className="search-results">
              {searchResults.map((coin) => (
                <button key={coin.id} onClick={() => { setSearchOpen(false); navigate(`/trade?coin=${coin.id}`); }}>
                  <CoinIcon coin={coin} small /><span><strong>{coin.name}</strong><small>{coin.symbol}</small></span><b>{money(coin.price)}</b>
                </button>
              ))}
              {searchResults.length === 0 && <p>No matching assets</p>}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <div className="brand muted-brand"><span className="brand-mark"><Zap size={18} fill="currentColor" /></span>CoinSwift</div>
        <p>Buy, sell and manage crypto securely.</p>
        <div className="footer-links"><span>Privacy</span><span>Terms</span><span>Support</span></div>
      </div>
    </footer>
  );
}

function CoinIcon({ coin, small = false }: { coin: Coin; small?: boolean }) {
  return <span className={small ? 'coin-icon coin-icon-small' : 'coin-icon'} style={{ background: coin.color }}>{coin.mark}</span>;
}

function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><TrendingUp size={15} /> Crypto made simple</span>
          <h1>Build your crypto future.</h1>
          <p>Buy, sell and track leading cryptocurrencies with a clear, secure platform built for everyone.</p>
          <div className="hero-actions">
            <Link className="primary-button" to="/signup">Create account</Link>
            <Link className="secondary-button" to="/market">Explore markets</Link>
          </div>
          <div className="trust-row"><ShieldCheck size={18} /><span>Trusted exchange</span><span className="dot" /><span>24/7 support</span></div>
        </div>
        <div className="hero-card">
          <div className="hero-card-head"><div><span>Portfolio balance</span><strong>$24,892.63</strong></div><Eye size={18} /></div>
          <div className="chart" aria-label="Portfolio growth chart">
            <svg viewBox="0 0 520 180" preserveAspectRatio="none">
              <defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity=".38"/><stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/></linearGradient></defs>
              <path className="chart-grid" d="M0 45H520 M0 90H520 M0 135H520" />
              <path d="M0 145 C40 150,55 125,85 132 S125 105,155 112 S205 85,235 94 S275 65,305 78 S350 48,380 60 S430 28,520 38 L520 180 L0 180 Z" fill="url(#fill)" />
              <path d="M0 145 C40 150,55 125,85 132 S125 105,155 112 S205 85,235 94 S275 65,305 78 S350 48,380 60 S430 28,520 38" fill="none" stroke="#4d8cff" strokeWidth="4" />
            </svg>
          </div>
          <div className="chart-legend"><span>Nov 16</span><span>Nov 22</span></div>
        </div>
      </section>

      <section className="market-section">
        <div className="section-heading"><div><span className="section-kicker">MARKETS</span><h2>Popular assets</h2></div><Link to="/market">View all markets <ArrowUpRight size={16} /></Link></div>
        <div className="coin-table">
          <div className="table-head"><span>Asset</span><span>Price</span><span>24h change</span><span>Market</span></div>
          {coins.map((coin) => (
            <Link className="table-row" key={coin.id} to={`/trade?coin=${coin.id}`}>
              <div className="asset"><CoinIcon coin={coin} /><div><strong>{coin.name}</strong><small>{coin.symbol}</small></div></div>
              <strong>{money(coin.price)}</strong>
              <span className={coin.change >= 0 ? 'change positive' : 'change negative'}>{coin.change >= 0 ? '+' : ''}{coin.change.toFixed(2)}%</span>
              <button className="trade-button">Trade</button>
            </Link>
          ))}
        </div>
      </section>

      <section className="feature-grid">
        <article><span className="feature-icon"><WalletCards /></span><h3>One smart wallet</h3><p>Keep every asset organized in one secure portfolio.</p></article>
        <article><span className="feature-icon"><ShieldCheck /></span><h3>Protected by default</h3><p>Advanced safeguards help keep your account and funds secure.</p></article>
        <article><span className="feature-icon"><Zap /></span><h3>Fast, simple trading</h3><p>Place trades in seconds with clear prices and low fees.</p></article>
      </section>
    </>
  );
}

function Market() {
  const [query, setQuery] = useState('');
  const filtered = coins.filter((coin) => `${coin.name} ${coin.symbol}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <main className="page">
      <div className="page-heading"><div><span className="section-kicker">MARKET OVERVIEW</span><h1>Explore crypto</h1></div><div className="market-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search assets" /></div></div>
      <div className="stats-grid">
        <article><span>Total market cap</span><strong>$2.49T</strong><small className="positive">+2.18%</small></article>
        <article><span>24h volume</span><strong>$92.8B</strong><small className="positive">+8.42%</small></article>
        <article><span>BTC dominance</span><strong>52.4%</strong><small>of total market</small></article>
      </div>
      <div className="coin-table full-table">
        <div className="table-head"><span>Asset</span><span>Price</span><span>24h change</span><span>Action</span></div>
        {filtered.map((coin) => (
          <Link className="table-row" key={coin.id} to={`/trade?coin=${coin.id}`}>
            <div className="asset"><CoinIcon coin={coin} /><div><strong>{coin.name}</strong><small>{coin.symbol}</small></div></div>
            <strong>{money(coin.price)}</strong>
            <span className={coin.change >= 0 ? 'change positive' : 'change negative'}>{coin.change >= 0 ? '+' : ''}{coin.change.toFixed(2)}%</span>
            <button className="trade-button">Buy</button>
          </Link>
        ))}
        {filtered.length === 0 && <div className="empty-state">No assets match your search.</div>}
      </div>
    </main>
  );
}

function Trade() {
  const [searchParams] = useSearchParams();
  const [side, setSide] = useState<'buy' | 'sell' | 'ai'>('buy');
  const [selectedId, setSelectedId] = useState(searchParams.get('coin') || 'bitcoin');
  const [amount, setAmount] = useState('100');
  const [range, setRange] = useState('1D');
  const [orderMessage, setOrderMessage] = useState('');
  const navigate = useNavigate();
  const coin = coins.find((item) => item.id === selectedId) || coins[0];
  const quantity = Number(amount) / coin.price;
  const chart = useMemo(() => {
    const rangeScale: Record<string, number> = { '1D': 0.35, '1W': 0.8, '1M': 1.5, '1Y': 2.4 };
    const scale = rangeScale[range] || 0.35;
    const seed = coins.findIndex((item) => item.id === coin.id) + 1;
    const values = Array.from({ length: 25 }, (_, index) => {
      const progress = index / 24;
      const trend = (progress - 0.5) * coin.change * scale;
      const wave = Math.sin((progress * 3.2 + seed) * Math.PI) * 1.8 * scale
        + Math.sin((progress * 8 + seed * 0.7) * Math.PI) * 0.75 * scale;
      return coin.price * (1 + (trend + wave) * 0.004);
    });
    const min = Math.min(...values);
    const max = Math.max(...values);
    const points = values.map((value, index) => ({
      x: 54 + index * (680 / (values.length - 1)),
      y: 242 - ((value - min) / (max - min || 1)) * 190,
    }));
    const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
    const area = `${line} L${points[points.length - 1].x.toFixed(1)} 250 L${points[0].x.toFixed(1)} 250 Z`;
    return { points, line, area, high: max, middle: (max + min) / 2, low: min };
  }, [coin, range]);
  useEffect(() => {
    const coinId = searchParams.get('coin');
    if (coinId && coins.some((item) => item.id === coinId)) setSelectedId(coinId);
  }, [searchParams]);
  const placeOrder = () => {
    const usdAmount = Number(amount);
    if (!Number.isFinite(usdAmount) || usdAmount <= 0) {
      setOrderMessage('Enter a valid amount greater than $0.');
      return;
    }
    if (localStorage.getItem('coinswift_logged_in') !== 'true') {
      navigate('/login');
      return;
    }
    const holdings = JSON.parse(localStorage.getItem('coinswift_holdings') || '{"cash":10000}');
    const previousQuantity = Number(holdings[coin.id] || 0);
    if (side === 'buy') {
      if (usdAmount > Number(holdings.cash || 0)) {
        setOrderMessage('Insufficient demo cash balance.');
        return;
      }
      holdings.cash = Number(holdings.cash || 0) - usdAmount;
      holdings[coin.id] = previousQuantity + usdAmount / coin.price;
    } else {
      const sellQuantity = usdAmount / coin.price;
      if (sellQuantity > previousQuantity) {
        setOrderMessage(`Insufficient ${coin.symbol} balance.`);
        return;
      }
      holdings[coin.id] = previousQuantity - sellQuantity;
      holdings.cash = Number(holdings.cash || 0) + usdAmount;
    }
    const order = {
      id: crypto.randomUUID?.() || String(Date.now()),
      type: side.toUpperCase(),
      coinId: coin.id,
      symbol: coin.symbol,
      amountUsd: usdAmount,
      quantity: usdAmount / coin.price,
      createdAt: new Date().toISOString(),
    };
    const orders = JSON.parse(localStorage.getItem('coinswift_orders') || '[]');
    localStorage.setItem('coinswift_holdings', JSON.stringify(holdings));
    localStorage.setItem('coinswift_orders', JSON.stringify([order, ...orders].slice(0, 50)));
    setOrderMessage(`${side === 'buy' ? 'Buy' : 'Sell'} order completed successfully.`);
  };
  const recommendation = useMemo(() => {
    if (coin.change >= 3) {
      return {
        action: 'BUY',
        label: 'Bullish momentum',
        confidence: 78,
        rationale: 'Strong 24-hour upward momentum and sustained market interest.',
      };
    }
    if (coin.change >= 0.5) {
      return {
        action: 'HOLD',
        label: 'Moderate upside',
        confidence: 68,
        rationale: 'Positive short-term movement, but the signal is not strong enough for an aggressive entry.',
      };
    }
    if (coin.change < 0) {
      return {
        action: 'WAIT',
        label: 'Weak momentum',
        confidence: 72,
        rationale: 'Recent downward pressure suggests waiting for confirmation before entering.',
      };
    }
    return {
      action: 'HOLD',
      label: 'Stable outlook',
      confidence: 64,
      rationale: 'Limited 24-hour movement indicates low short-term volatility.',
    };
  }, [coin.change]);

  return (
    <main className="page trade-page">
      <div className="trade-market">
        <div className="trade-asset"><CoinIcon coin={coin} /><div><h1>{coin.name}</h1><span>{coin.symbol} / USD</span></div></div>
        <div className="trade-price"><strong>{money(coin.price)}</strong><span className={coin.change >= 0 ? 'positive' : 'negative'}>{coin.change >= 0 ? '+' : ''}{coin.change}% today</span></div>
      </div>
      <div className="trade-layout">
        <section className="chart-card">
          <div className="card-heading"><div><h2>Price chart</h2><span className="chart-subtitle">Illustrative {range} trend</span></div><div className="range-tabs" role="group" aria-label="Chart time range">{['1D','1W','1M','1Y'].map((item) => <button key={item} type="button" aria-pressed={range === item} className={range === item ? 'active' : ''} onClick={() => setRange(item)}>{item}</button>)}</div></div>
          <div className="large-chart">
            <svg viewBox="0 0 760 300" preserveAspectRatio="none" role="img" aria-label={`${coin.name} illustrative ${range} price trend`}>
              <defs><linearGradient id="trade-chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4d8cff" stopOpacity=".24" /><stop offset="100%" stopColor="#4d8cff" stopOpacity="0" /></linearGradient></defs>
              <path className="chart-grid" d="M54 52H734 M54 100H734 M54 148H734 M54 196H734 M54 244H734" />
              <text className="chart-axis-label" x="0" y="56">{money(chart.high)}</text>
              <text className="chart-axis-label" x="0" y="152">{money(chart.middle)}</text>
              <text className="chart-axis-label" x="0" y="248">{money(chart.low)}</text>
              <path d={chart.area} fill="url(#trade-chart-fill)" />
              <path d={chart.line} fill="none" stroke="#4d8cff" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              <line className="chart-current-guide" x1="54" y1={chart.points[chart.points.length - 1].y} x2="734" y2={chart.points[chart.points.length - 1].y} />
              <circle className="chart-current-point" cx={chart.points[chart.points.length - 1].x} cy={chart.points[chart.points.length - 1].y} r="5" />
              <text className="chart-time-label" x="54" y="282">START</text>
              <text className="chart-time-label" x="734" y="282" textAnchor="end">NOW</text>
            </svg>
          </div>
        </section>
        <aside className="order-card">
          <div className="trade-tabs trade-tabs-three">
            <button className={side === 'buy' ? 'active' : ''} onClick={() => setSide('buy')}>Buy</button>
            <button className={side === 'sell' ? 'active' : ''} onClick={() => setSide('sell')}>Sell</button>
            <button className={side === 'ai' ? 'active ai-active' : 'ai-tab'} onClick={() => setSide('ai')}><Sparkles size={13} />AI</button>
          </div>
          {side !== 'ai' ? (
            <>
              <label>Choose asset <div className="select-wrap"><CoinIcon coin={coin} small /><select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{coins.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.symbol})</option>)}</select><ChevronDown size={16} /></div></label>
              <label>Amount<div className="amount-input"><span>$</span><input value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ''))} inputMode="decimal" /></div></label>
              <div className="order-summary"><span>You receive</span><strong>{isFinite(quantity) ? quantity.toFixed(6) : '0'} {coin.symbol}</strong></div>
              {orderMessage && <div className={orderMessage.includes('completed') ? 'order-message order-success' : 'order-message'} role="status">{orderMessage}</div>}
              <button className="place-order" onClick={placeOrder}>{side === 'buy' ? 'Buy' : 'Sell'} {coin.symbol}</button>
            </>
          ) : (
            <div className="ai-recommendation">
              <div className="ai-heading">
                <span className="ai-brain"><BrainCircuit size={20} /></span>
                <div><span>AI market insight</span><strong>{coin.name}</strong></div>
                <span className="ai-live">DEMO</span>
              </div>
              <label className="ai-select-label">Analyze asset
                <div className="select-wrap"><CoinIcon coin={coin} small /><select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{coins.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.symbol})</option>)}</select><ChevronDown size={16} /></div>
              </label>
              <div className={`recommendation-result recommendation-${recommendation.action.toLowerCase()}`}>
                <div className="recommendation-main"><span>Recommendation</span><strong>{recommendation.action}</strong></div>
                <div className="confidence"><div><span>Confidence</span><strong>{recommendation.confidence}%</strong></div><div className="confidence-track"><i style={{ width: `${recommendation.confidence}%` }} /></div></div>
              </div>
              <div className="recommendation-details">
                <span>{recommendation.label}</span>
                <p>{recommendation.rationale}</p>
              </div>
              <div className="risk-notice"><ShieldCheck size={16} /><p>Indicative analysis only. Crypto prices are volatile and this is not financial advice.</p></div>
              {recommendation.action !== 'WAIT' && (
                <button className="place-order" onClick={() => setSide(recommendation.action === 'BUY' ? 'buy' : 'sell')}>
                  Open {recommendation.action === 'BUY' ? 'buy' : 'sell'} ticket
                </button>
              )}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

function Portfolio() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const holdings = (() => {
    try {
      return JSON.parse(localStorage.getItem('coinswift_holdings') || '{"cash":10000,"bitcoin":0.186,"ethereum":2.42,"solana":42.8,"usdcoin":1245}');
    } catch {
      return { cash: 10000, bitcoin: 0.186, ethereum: 2.42, solana: 42.8, usdcoin: 1245 };
    }
  })();
  const [holdingsVersion, setHoldingsVersion] = useState(0);
  const assetValues = coins.map((coin) => Number(holdings[coin.id] || 0) * coin.price);
  const total = assetValues.reduce((sum, value) => sum + value, 0) + Number(holdings.cash || 0);
  useEffect(() => {
    if (localStorage.getItem('coinswift_logged_in') !== 'true') navigate('/login');
  }, [navigate]);
  if (localStorage.getItem('coinswift_logged_in') !== 'true') return null;
  const updateCash = (amount: number, type: 'deposit' | 'send') => {
    const nextCash = type === 'deposit'
      ? Number(holdings.cash || 0) + amount
      : Number(holdings.cash || 0) - amount;
    if (type === 'send' && amount > Number(holdings.cash || 0)) {
      setActionMessage('Insufficient cash balance.');
      return;
    }
    const updated = { ...holdings, cash: nextCash };
    localStorage.setItem('coinswift_holdings', JSON.stringify(updated));
    setActionMessage(type === 'deposit' ? '$1,000 demo cash deposited.' : '$250 demo cash sent.');
    setHoldingsVersion((value) => value + 1);
  };
  return (
    <main className="page">
      <div className="page-heading"><div><span className="section-kicker">MY PORTFOLIO</span><h1>Welcome back</h1></div><button className="primary-small" onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={16} /> : <Eye size={16} />} {visible ? 'Hide balance' : 'Show balance'}</button></div>
      <div className="portfolio-summary">
        <div><span>Total balance</span><strong>{visible ? money(total) : '••••••••'}</strong><small>Cash: {visible ? money(Number(holdings.cash || 0)) : '••••'}</small></div>
        <div className="portfolio-actions"><button onClick={() => updateCash(1000, 'deposit')}><ArrowDownLeft size={18} />Deposit</button><button onClick={() => updateCash(250, 'send')}><ArrowUpRight size={18} />Send</button></div>
      </div>
      {actionMessage && <div className="portfolio-message" role="status">{actionMessage}</div>}
      <section className="coin-table full-table">
        <div className="table-head"><span>Asset</span><span>Balance</span><span>Value</span><span>Allocation</span></div>
        {coins.map((coin, index) => (
          holdings[coin.id] ? (
          <div className="table-row" key={coin.id}>
            <div className="asset"><CoinIcon coin={coin} /><div><strong>{coin.name}</strong><small>{coin.symbol}</small></div></div>
            <strong>{visible ? `${Number(holdings[coin.id]).toFixed(coin.price < 10 ? 4 : 6)} ${coin.symbol}` : '••••'}</strong>
            <strong>{visible ? money(assetValues[index]) : '••••'}</strong>
            <span className="allocation"><i style={{ width: `${total ? Math.max(2, assetValues[index] / total * 100) : 0}%` }} /></span>
          </div>
          ) : null
        ))}
      </section>
    </main>
  );
}

function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const isSignup = location.pathname === '/signup';
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setName('');
    setEmail('');
    setPassword('');
    setShow(false);
    setError('');
    setSuccess('');
  }, [location.pathname]);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const normalizedEmail = email.trim().toLowerCase();
    if (isSignup && name.trim().length < 2) {
      setError('Enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (isSignup) {
      const account = { name: name.trim(), email: normalizedEmail, password };
      try {
        localStorage.setItem('coinswift_account', JSON.stringify(account));
        localStorage.setItem('coinswift_logged_in', 'true');
      } catch {
        setError('Your browser blocked account storage. Enable local storage and try again.');
        return;
      }
      setSuccess('Account created successfully. Opening your portfolio...');
      window.setTimeout(() => navigate('/portfolio'), 700);
      return;
    }

    let storedAccount: { name: string; email: string; password: string } | null = null;
    try {
      const saved = localStorage.getItem('coinswift_account');
      storedAccount = saved ? JSON.parse(saved) : null;
    } catch {
      storedAccount = null;
    }

    const demoAccount = normalizedEmail === 'demo@coinswift.com' && password === 'password123';
    const matchesAccount = storedAccount?.email === normalizedEmail && storedAccount.password === password;
    if (!demoAccount && !matchesAccount) {
      setError('Email or password is incorrect. Create an account or use the demo credentials.');
      return;
    }

    try {
      localStorage.setItem('coinswift_logged_in', 'true');
    } catch {
      setError('Your browser blocked account storage. Enable local storage and try again.');
      return;
    }
    setSuccess('Login successful. Opening your portfolio...');
    window.setTimeout(() => navigate('/portfolio'), 700);
  };

  return (
    <main className="auth-page">
      <Link className="brand auth-brand" to="/"><span className="brand-mark"><Zap size={18} fill="currentColor" /></span>CoinSwift</Link>
      <form className="auth-card" onSubmit={submit} noValidate>
        <span className="auth-icon"><CircleUserRound size={28} /></span>
        <h1>{isSignup ? 'Create your account' : 'Welcome back'}</h1>
        <p>{isSignup ? 'Start building your crypto portfolio today.' : 'Log in to manage your portfolio.'}</p>
        {isSignup && <label>Full name<input type="text" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Alex Morgan" /></label>}
        <label>Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
        <label>Password<div className="password-field"><input type={show ? 'text' : 'password'} autoComplete={isSignup ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" /><button type="button" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
        {error && <div className="auth-message auth-error" role="alert">{error}</div>}
        {success && <div className="auth-message auth-success" role="status">{success}</div>}
        {!isSignup && <div className="demo-credentials">Demo: <strong>demo@coinswift.com</strong> / <strong>password123</strong></div>}
        <button type="submit" className="place-order auth-submit">{isSignup ? 'Create account' : 'Log in'}</button>
        <div className="auth-switch">{isSignup ? 'Already have an account?' : 'New to CoinSwift?' } <Link to={isSignup ? '/login' : '/signup'}>{isSignup ? 'Log in' : 'Create account'}</Link></div>
      </form>
    </main>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const auth = pathname === '/login' || pathname === '/signup';
  return <div className="app">{!auth && <Header />}<main className="main">{children}</main>{!auth && <Footer />}</div>;
}

function NotFound() {
  return (
    <main className="not-found">
      <span>404</span>
      <h1>Page not found</h1>
      <p>The page you requested does not exist.</p>
      <Link className="primary-button" to="/">Return home</Link>
    </main>
  );
}

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/market" element={<Market />} />
          <Route path="/trade" element={<Trade />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </Router>
  );
}