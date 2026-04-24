import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getSalesAnalytics, type SalesAnalytics } from "@/services/analyticsService";
import { getCurrentUser } from "@/services/userService";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Maison Admin" }] }),
  component: AdminAnalyticsPage,
});

function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [days, setDays] = useState(30);
  const [data, setData] = useState<SalesAnalytics | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const user = await getCurrentUser();
        if (!active) return;
        if (!user) {
          setAuthorized(false);
          setLoading(false);
          return;
        }

        setAuthorized(true);
        const analytics = await getSalesAnalytics(days);
        if (!active) return;
        setData(analytics);
      } catch (e: unknown) {
        if (!active) return;
        setErr(e instanceof Error ? e.message : "Could not load analytics");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [days]);

  const topSales = useMemo(
    () => (data?.top_selling_products ?? []).map((x) => ({ name: x.product_name, units: x.units, revenue: x.revenue })),
    [data]
  );

  const leastSales = useMemo(
    () => (data?.least_selling_products ?? []).map((x) => ({ name: x.product_name, units: x.units, revenue: x.revenue })),
    [data]
  );

  if (loading) {
    return <div className="min-h-[60vh]" />;
  }

  if (!authorized) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-center px-5">
        <div>
          <p className="font-display text-3xl mb-3">Sign in required</p>
          <Link to="/account" className="eyebrow link-underline">Go to account</Link>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="px-5 md:px-10 py-16 max-w-3xl mx-auto">
        <p className="eyebrow text-destructive">Analytics error</p>
        <p className="text-sm mt-3">{err}</p>
      </div>
    );
  }

  return (
    <div className="px-5 md:px-10 py-12 md:py-16 max-w-7xl mx-auto space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-muted-foreground mb-3">Admin Intelligence</p>
          <h1 className="font-display text-4xl md:text-6xl">Commerce Analytics</h1>
        </div>
        <label className="text-sm">
          <span className="eyebrow text-muted-foreground mr-2">Range</span>
          <select
            className="border border-border bg-background px-3 py-2"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </label>
      </div>

      <section className="grid lg:grid-cols-2 gap-6">
        <Card title="Top Selling Products">
          <ChartWrap>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topSales.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" hide />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="units" fill="currentColor" opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </ChartWrap>
        </Card>

        <Card title="Least Selling Products">
          <ChartWrap>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={leastSales.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" hide />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="units" fill="currentColor" opacity={0.55} />
              </BarChart>
            </ResponsiveContainer>
          </ChartWrap>
        </Card>
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <Card title="Category Revenue">
          <ChartWrap>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data?.category_revenue ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category_name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="currentColor" opacity={0.75} />
              </BarChart>
            </ResponsiveContainer>
          </ChartWrap>
        </Card>

        <Card title="Daily Revenue Trend">
          <ChartWrap>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data?.daily_revenue ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="currentColor" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="orders" stroke="currentColor" strokeWidth={1.5} strokeOpacity={0.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartWrap>
        </Card>
      </section>

      <Card title="Low Stock Alerts">
        <div className="divide-y divide-border border border-border">
          {(data?.low_stock_alerts ?? []).length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No low stock items.</div>
          ) : (
            data?.low_stock_alerts.map((p) => (
              <div key={p.id} className="p-4 flex items-center justify-between text-sm">
                <span>{p.name}</span>
                <span className="tabular-nums">Stock: {p.stock}</span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-border bg-background p-5">
      <h2 className="font-display text-2xl mb-4">{title}</h2>
      {children}
    </section>
  );
}

function ChartWrap({ children }: { children: React.ReactNode }) {
  return <div className="text-foreground">{children}</div>;
}
