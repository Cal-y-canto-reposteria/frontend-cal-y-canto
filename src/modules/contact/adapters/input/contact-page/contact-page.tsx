import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ContactPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Contacto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-stone-600">
          <p>Escríbenos para pedidos personalizados, cotizaciones o alianzas.</p>
          <p>Correo: hola@caly-canto.com</p>
          <p>WhatsApp: +57 300 000 0000</p>
        </CardContent>
      </Card>
    </section>
  )
}
