import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RoutePathEnum } from '@routes/route-path.enum'

export function HomePage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div className="space-y-6">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-rose-700">
            Repostería artesanal
          </p>
          <h2 className="text-4xl font-semibold leading-tight text-stone-900 md:text-5xl">
            Dulces hechos con calma, canto y mucho cariño.
          </h2>
          <p className="max-w-xl text-lg text-stone-600">
            Descubre nuestras creaciones para celebrar momentos especiales o simplemente
            consentirte con algo delicioso.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to={RoutePathEnum.Products}
              className="inline-flex h-8 items-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Ver productos
            </Link>
            <Link
              to={RoutePathEnum.Contact}
              className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium transition hover:bg-muted"
            >
              Contáctanos
            </Link>
          </div>
        </div>

        <Card className="border-rose-100 bg-white/90 shadow-xl shadow-rose-100/60">
          <CardHeader>
            <CardTitle>Temporada destacada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-stone-600">
            <p>Tortas personalizadas, postres individuales y boxes para regalar.</p>
            <p className="text-sm text-stone-500">
              El catálogo público consume el módulo de productos vía servicios hexagonales.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
