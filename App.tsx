import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { HashRouter as Router, Link, NavLink, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
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
import { MARKET_ASSETS, type MarketAsset } from './shared/market';

type Coin = MarketAsset;
type User = { id: string; name: string; email: string };
type StoredAccount = User & { salt: string; passwordHash: string };
type PaperOrder = {
  id: string;
  side: 'BUY' | 'SELL';
  assetId: string;
  symbol: string;
  quantity: number;
  amountUsd: number;
  createdAt: string;
};
type PaperPortfolio = {
  cashCents: number;
  holdings: Record<string, number>;
  orders: PaperOrder[];
};
const coins = MARKET_ASSETS;

function readStored<T>(key: string, fallback: T): T {
  const value = localStorage.getItem(key);
  if (value === null) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error(`Saved demo data for "${key}" is invalid. Clear this site's browser data and try again.`);
  }
}

function writeStored(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new Error('Browser storage is unavailable or full. Enable local storage and try again.');
  }
}

function portfolioKey(userId: string): string {
  return `coinswift_paper_portfolio_${userId}`;
}

function readPaperPortfolio(userId: string): PaperPortfolio {
  return readStored<PaperPortfolio>(portfolioKey(userId), {
    cashCents: 1_000_000,
    holdings: {},
    orders: [],
  });
}

function newSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password: string, salt: string): Promise<string> {
  if (!crypto.subtle) throw new Error('Secure browser cryptography is unavailable. Open this site over HTTPS.');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 150_000, hash: 'SHA-256' },
    key,
    256,
  );
  return Array.from(new Uint8Array(derived), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function saveLocalSession(user: User): void {
  writeStored('coinswift_local_session', user);
}

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
};
const AuthContext = createContext<AuthContextValue | null>(null);

function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      localStorage.removeItem('coinswift_account');
      localStorage.removeItem('coinswift_logged_in');
      const saved = readStored<User | null>('coinswift_local_session', null);
      if (saved && typeof saved.id === 'string' && typeof saved.name === 'string' && typeof saved.email === 'string') {
        setUser(saved);
      }
    } catch (error) {
      console.error('Unable to restore local paper-trading session', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return <AuthContext.Provider value={{ user, loading, setUser }}>{children}</AuthContext.Provider>;
}

const money = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: value < 10 ? 4 : 2 }).format(value);

function Header() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [logoutError, setLogoutError] = useState('');
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const searchResults = coins.filter((coin) => `${coin.name} ${coin.symbol}`.toLowerCase().includes(searchQuery.toLowerCase()));
  const logout = async () => {
    setLogoutError('');
    try {
      localStorage.removeItem('coinswift_local_session');
      setUser(null);
      navigate('/');
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : 'Unable to log out. Please try again.');
    }
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
          {user ? (
            <>
              <button className="account-button" onClick={() => navigate('/portfolio')}><CircleUserRound size={16} />{user.name.split(' ')[0] || 'Account'}</button>
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
      {logoutError && <div className="header-error" role="alert">{logoutError}</div>}
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
        <p>Practice with simulated assets and demo balances.</p>
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
          <p>Practice crypto trading in a paper-trading sandbox. Every quote, balance, deposit, and order is simulated.</p>
          <div className="hero-actions">
            <Link className="primary-button" to="/signup">Create account</Link>
            <Link className="secondary-button" to="/market">Explore markets</Link>
          </div>
          <div className="trust-row"><ShieldCheck size={18} /><span>Paper-trading sandbox</span><span className="dot" /><span>No real funds involved</span></div>
        </div>
        <div className="hero-card">
          <div className="hero-card-head"><div><span>Example paper balance</span><strong>$10,000.00</strong></div><Eye size={18} /></div>
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
        <article><span>Sample market cap</span><strong>$2.49T</strong><small className="positive">Illustrative</small></article>
        <article><span>Sample 24h volume</span><strong>$92.8B</strong><small className="positive">Illustrative</small></article>
        <article><span>Sample BTC dominance</span><strong>52.4%</strong><small>Illustrative</small></article>
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
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
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
  const placeOrder = async () => {
    const usdAmount = Number(amount);
    if (!Number.isFinite(usdAmount) || usdAmount <= 0) {
      setOrderMessage('Enter a valid amount greater than $0.');
      return;
    }
    if (!user) {
      navigate('/login');
      return;
    }
    setSubmitting(true);
    setOrderMessage('');
    try {
      const totalCents = Math.round(usdAmount * 100);
      if (totalCents < 100 || totalCents > 100_000_000) {
        throw new Error('Trade amount must be between $1 and $1,000,000.');
      }
      const portfolio = readPaperPortfolio(user.id);
      const quantity = Number((totalCents / 100 / coin.price).toFixed(12));
      const currentQuantity = Number(portfolio.holdings[coin.id] || 0);
      if (side === 'buy') {
        if (totalCents > portfolio.cashCents) throw new Error('Insufficient paper cash balance.');
        portfolio.cashCents -= totalCents;
        portfolio.holdings[coin.id] = currentQuantity + quantity;
      } else {
        if (quantity > currentQuantity) throw new Error(`Insufficient ${coin.symbol} balance.`);
        portfolio.holdings[coin.id] = currentQuantity - quantity;
        portfolio.cashCents += totalCents;
      }
      portfolio.orders.unshift({
        id: crypto.randomUUID(),
        side: side.toUpperCase() as 'BUY' | 'SELL',
        assetId: coin.id,
        symbol: coin.symbol,
        quantity,
        amountUsd: totalCents / 100,
        createdAt: new Date().toISOString(),
      });
      portfolio.orders = portfolio.orders.slice(0, 50);
      writeStored(portfolioKey(user.id), portfolio);
      setOrderMessage(`${side === 'buy' ? 'Buy' : 'Sell'} order completed successfully.`);
    } catch (error) {
      setOrderMessage(error instanceof Error ? error.message : 'Unable to place this paper trade.');
    } finally {
      setSubmitting(false);
    }
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
              <button className="place-order" onClick={placeOrder} disabled={submitting}>{submitting ? 'Processing...' : `${side === 'buy' ? 'Buy' : 'Sell'} ${coin.symbol}`}</button>
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
  const { user, loading: authLoading } = useAuth();
  const [visible, setVisible] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const [error, setError] = useState('');
  const [portfolio, setPortfolio] = useState<PaperPortfolio | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login', { replace: true });
  }, [authLoading, navigate, user]);

  useEffect(() => {
    if (!user) return;
    try {
      setPortfolio(readPaperPortfolio(user.id));
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load your local paper portfolio.');
    }
  }, [user]);

  const updateCash = (action: 'DEPOSIT' | 'WITHDRAW', amountUsd: number) => {
    if (!user || !portfolio) return;
    setError('');
    setActionMessage('');
    const updated = { ...portfolio, holdings: { ...portfolio.holdings }, orders: [...portfolio.orders] };
    const amountCents = Math.round(amountUsd * 100);
    if (action === 'WITHDRAW' && amountCents > updated.cashCents) {
      setError('Insufficient paper cash balance.');
      return;
    }
    updated.cashCents += action === 'DEPOSIT' ? amountCents : -amountCents;
    try {
      writeStored(portfolioKey(user.id), updated);
      setPortfolio(updated);
      setActionMessage(action === 'DEPOSIT' ? `${money(amountUsd)} paper cash added.` : `${money(amountUsd)} paper cash withdrawn.`);
    } catch (writeError) {
      setError(writeError instanceof Error ? writeError.message : 'Unable to update your local paper wallet.');
    }
  };

  if (authLoading || !user) return <main className="page"><div className="loading-message">Loading your local demo account...</div></main>;
  if (error && !portfolio) return <main className="page"><div className="auth-message auth-error" role="alert">{error}</div></main>;
  if (!portfolio) return <main className="page"><div className="loading-message">Loading portfolio...</div></main>;

  const cashUsd = portfolio.cashCents / 100;
  const holdings = coins.flatMap((coin) => {
    const quantity = Number(portfolio.holdings[coin.id] || 0);
    return quantity > 0 ? [{ ...coin, quantity, value: quantity * coin.price }] : [];
  });
  const totalUsd = holdings.reduce((sum, holding) => sum + holding.value, cashUsd);

  return (
    <main className="page">
      <div className="page-heading"><div><span className="section-kicker">LOCAL PAPER-TRADING PORTFOLIO</span><h1>Welcome, {user.name.split(' ')[0]}</h1></div><button className="primary-small" onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={16} /> : <Eye size={16} />} {visible ? 'Hide balance' : 'Show balance'}</button></div>
      <div className="portfolio-summary">
        <div><span>Total paper balance</span><strong>{visible ? money(totalUsd) : '••••••••'}</strong><small>Available paper cash: {visible ? money(cashUsd) : '••••'}</small></div>
        <div className="portfolio-actions"><button onClick={() => updateCash('DEPOSIT', 1000)}><ArrowDownLeft size={18} />Add $1,000 demo cash</button><button onClick={() => updateCash('WITHDRAW', 250)}><ArrowUpRight size={18} />Withdraw $250</button></div>
      </div>
      {error && <div className="portfolio-message" role="alert">{error}</div>}
      {actionMessage && <div className="portfolio-message" role="status">{actionMessage}</div>}
      <section className="coin-table full-table">
        <div className="table-head"><span>Asset</span><span>Balance</span><span>Value</span><span>Allocation</span></div>
        {holdings.map((holding) => (
          <div className="table-row" key={holding.id}>
            <div className="asset"><CoinIcon coin={holding} /><div><strong>{holding.name}</strong><small>{holding.symbol}</small></div></div>
            <strong>{visible ? `${holding.quantity.toFixed(holding.price < 10 ? 4 : 6)} ${holding.symbol}` : '••••'}</strong>
            <strong>{visible ? money(holding.value) : '••••'}</strong>
            <span className="allocation"><i style={{ width: `${totalUsd ? Math.max(2, holding.value / totalUsd * 100) : 0}%` }} /></span>
          </div>
        ))}
        {holdings.length === 0 && <div className="empty-state">No crypto holdings yet. Place a paper trade to get started.</div>}
      </section>
      <section className="orders-section">
        <div className="section-heading"><div><span className="section-kicker">PAPER TRADING</span><h2>Recent orders</h2></div></div>
        <div className="coin-table">
          <div className="table-head order-table-head"><span>Side</span><span>Asset</span><span>Quantity</span><span>Total</span></div>
          {portfolio.orders.map((order) => (
            <div className="table-row order-table-row" key={order.id}>
              <strong className={order.side === 'BUY' ? 'positive' : 'negative'}>{order.side}</strong>
              <strong>{order.symbol}</strong>
              <span>{order.quantity.toFixed(6)}</span>
              <span>{money(order.amountUsd)}</span>
            </div>
          ))}
          {portfolio.orders.length === 0 && <div className="empty-state">Your completed paper trades will appear here.</div>}
        </div>
      </section>
    </main>
  );
}

function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const isSignup = location.pathname === '/signup';
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setName('');
    setEmail('');
    setPassword('');
    setShow(false);
    setError('');
    setSuccess('');
  }, [location.pathname]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
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
    if (password.length < 8 || password.length > 128) {
      setError('Password must be between 8 and 128 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const accounts = readStored<StoredAccount[]>('coinswift_local_accounts', []);
      if (!Array.isArray(accounts)) throw new Error('Saved demo accounts are invalid. Clear this site’s browser data and try again.');
      let account: StoredAccount | undefined;
      if (isSignup) {
        if (accounts.some((savedAccount) => savedAccount.email === normalizedEmail)) {
          throw new Error('An account with this email already exists in this browser.');
        }
        const salt = newSalt();
        account = {
          id: crypto.randomUUID(),
          name: name.trim(),
          email: normalizedEmail,
          salt,
          passwordHash: await hashPassword(password, salt),
        };
        writeStored('coinswift_local_accounts', [...accounts, account]);
      } else {
        account = accounts.find((savedAccount) => savedAccount.email === normalizedEmail);
        if (!account || (await hashPassword(password, account.salt)) !== account.passwordHash) {
          throw new Error('Email or password is incorrect. Create an account in this browser first.');
        }
      }
      const currentUser = { id: account.id, name: account.name, email: account.email };
      saveLocalSession(currentUser);
      setUser(currentUser);
      setSuccess(isSignup ? 'Local demo account created. Your paper wallet is ready.' : 'Login successful.');
      navigate('/portfolio');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to authenticate. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <Link className="brand auth-brand" to="/"><span className="brand-mark"><Zap size={18} fill="currentColor" /></span>CoinSwift</Link>
      <form className="auth-card" onSubmit={submit} noValidate>
        <span className="auth-icon"><CircleUserRound size={28} /></span>
        <h1>{isSignup ? 'Create your account' : 'Welcome back'}</h1>
        <p>{isSignup ? 'Create a local account to start paper trading.' : 'Log in to this browser’s paper-trading account.'}</p>
        {isSignup && <label>Full name<input type="text" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Alex Morgan" /></label>}
        <label>Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
        <label>Password<div className="password-field"><input type={show ? 'text' : 'password'} autoComplete={isSignup ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" /><button type="button" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
        {error && <div className="auth-message auth-error" role="alert">{error}</div>}
        {success && <div className="auth-message auth-success" role="status">{success}</div>}
        <div className="demo-credentials">Demo only: account data stays in this browser and is not server-secured or synced.</div>
        <button type="submit" className="place-order auth-submit" disabled={submitting}>{submitting ? 'Please wait...' : isSignup ? 'Create account' : 'Log in'}</button>
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
    <AuthProvider>
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
    </AuthProvider>
  );
}