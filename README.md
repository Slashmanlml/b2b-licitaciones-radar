# B2B Licitaciones Radar

Pipeline de alertas de licitaciones públicas: obtiene llamados, los normaliza,
descarta los ya vistos y despacha los nuevos por Telegram. Corre solo en GitHub
Actions con un cron.

> ### ⚠️ Estado: prototipo
>
> **El proveedor de datos real todavía no está implementado.** Hoy el pipeline
> corre contra un proveedor de datos de ejemplo (`fixture`) con tres licitaciones
> ficticias y enlaces a `example.org`.
>
> Lo que está terminado y probado es el pipeline: normalización, identidad
> estable, deduplicación, formato y despacho. Falta la pieza que consulta el
> portal — ver [`src/providers/comprar.js`](src/providers/comprar.js), donde está
> documentado qué hace falta resolver.
>
> Cuando corre con datos de ejemplo, cada alerta lo dice en el propio mensaje.

## Cómo funciona

```
provider.fetchTenders()      obtiene los llamados crudos
        ↓
normalize()                  valida campos y calcula un id estable del contenido
        ↓
SeenStore.filterNew()        descarta los que ya se despacharon
        ↓
buildAlert()                 arma el mensaje (marcado si son datos de ejemplo)
        ↓
TelegramNotifier.send()      despacha y verifica la respuesta de la API
        ↓
SeenStore.commit()           persiste el historial
```

La fuente de datos está detrás de una interfaz: agregar un portal nuevo es
escribir un módulo en `src/providers/` que exponga `fetchTenders()` y devuelva
objetos con los campos que espera `normalize()`. El resto del pipeline no cambia.

## Uso

```bash
node index.js                 # datos de ejemplo (por defecto)
PROVIDER=comprar node index.js # falla explícitamente: todavía no implementado
npm test                       # 19 tests, sin dependencias externas
```

Para el despacho por Telegram, copiar `.env.example` y completar
`TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID`. Sin esas variables el pipeline corre
igual y solo omite el envío.

## Decisiones de diseño

**El id sale del contenido, no del azar.** Se calcula como un hash de
`organismo|titulo|apertura`, así la misma licitación produce el mismo id en
corridas distintas y la deduplicación funciona. En la primera versión el id se
generaba con `Math.random()`, de modo que nunca coincidía con el histórico y las
mismas licitaciones se re-despachaban en cada ejecución.

**El proveedor sin implementar falla fuerte.** `src/providers/comprar.js` lanza
una excepción en vez de devolver datos de ejemplo. Un dato inventado que parece
real es peor que un error: se propaga silencioso hasta el destinatario.

**El despacho verifica la respuesta.** `TelegramNotifier` mira el `ok` de la API
antes de contar el mensaje como enviado, y devuelve `false` si falló.

**El historial tolera archivos corruptos.** Un JSON ilegible se trata como
historial vacío y se avisa por consola, en vez de cortar la corrida.

## Pendiente

- [ ] Implementar el proveedor real (fuente, paginación, ritmo de requests,
      términos de uso del portal)
- [ ] Filtro de rubros por suscriptor
- [ ] Alerta de vencimiento próximo de pliegos ya notificados

## Stack

Node 20+, sin dependencias de producción. Tests con el runner nativo
(`node --test`). CI en GitHub Actions.

## Licencia

MIT
