# B2B Licitaciones Radar

Pipeline de alertas de licitaciones públicas: obtiene llamados, los normaliza,
descarta los ya vistos y despacha los nuevos por Telegram. Corre solo en GitHub
Actions con un cron.

> ### ⚠️ Estado: prototipo con proveedor real disponible
>
> Por defecto el pipeline corre contra datos de ejemplo (`fixture`) con tres
> licitaciones ficticias y enlaces a `example.org`. Pero ya existe un proveedor
> real: `datosgobar`, que lee las convocatorias abiertas de COMPR.AR desde
> datos.gob.ar (CSV 2016-2026, sin auth).
>
> ```bash
> PROVIDER=datosgobar node index.js   # datos reales
> ```
>
> Notas honestas: el dataset se actualiza por tandas (puede ir semanas atrás del
> portal), el CSV no trae enlace por fila (el N° de proceso va en el título y el
> enlace apunta al dataset) y la primera corrida despacha hasta 25 (lo más nuevo
> primero). El proveedor `comprar` (portal directo, sin API pública) sigue sin
> implementar — ver [`src/providers/comprar.js`](src/providers/comprar.js).
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
node index.js                        # datos de ejemplo (por defecto)
PROVIDER=datosgobar node index.js    # datos reales de datos.gob.ar
PROVIDER=comprar node index.js       # falla explícitamente: todavía no implementado
npm test                             # 31 tests, sin dependencias externas
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

**El despacho verifica la respuesta y reintenta.** `TelegramNotifier` mira el
`ok` de la API antes de contar el mensaje como enviado, y devuelve `false` si
falló. Errores de red y HTTP 429/5xx se reintentan con backoff exponencial.

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

## Docker y logs

```bash
npm run docker:build
docker run --rm --env-file .env b2b-licitaciones-radar
```

`LOG_LEVEL` controla el nivel de log (`debug|info|warn|error`, default `info`).
Los llamados a Telegram reintentan errores de red y HTTP 429/5xx con backoff
exponencial (3 intentos); los 4xx fallan rápido sin reintentar.

## Licencia

MIT
