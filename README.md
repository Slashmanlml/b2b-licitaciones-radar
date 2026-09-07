# 🏛️ B2B Licitaciones Radar — Monitor Autónomo de Compras Públicas

![Radar Status](https://github.com/Slashmanlml/b2b-licitaciones-radar/actions/workflows/licitaciones.yml/badge.svg)
![Business Model](https://img.shields.io/badge/Model-B2B_SaaS_Alerts-gold?style=flat)
![NodeJS](https://img.shields.io/badge/Node.js-20.x-green?style=flat&logo=node.js)
![Cloud Engine](https://img.shields.io/badge/Engine-GitHub_Actions_Cron-blue?style=flat&logo=githubactions)

Micro-servicio autónomo de **Inteligencia Comercial B2B**. Rastrea, filtra y categoriza llamados a licitaciones públicas y contrataciones estatales en tiempo real, despachando alertas instantáneas a empresas proveedoras antes de que venzan los pliegos.

---

## 💼 Modelo de Negocio (Monetización)

```text
[Portales Estatales / Boletines] 
               │
               ▼
[B2B Radar (Scraping + Filtros)] 
               │
               ▼
   [Canal VIP / Alerta Directa] ───► [Empresas Suscritas ($20 - $50 USD/mes)]
```

### 🏷️ Planes de Membresía:
- **Plan Starter ($20 USD/mes):** Alertas de 1 rubro específico (ej: Tecnología) vía Telegram.
- **Plan Pro ($45 USD/mes):** Alertas multirubro, cálculo de presupuesto estimado y fecha límite con 15 días de anticipación.
- **Plan Enterprise ($90 USD/mes):** Integración directa a webhook de Slack/Discord interno de la empresa y resumen diario en PDF.

---

## 🚀 Características Técnicas

- **Filtros por Rubro:** Categorización automática (Tecnología, Salud, Obra Pública, Seguridad).
- **Detección Anti-Duplicados:** Memoria histórica con persistencia en Git (`data/licitaciones_vistas.json`).
- **Despacho Inmediato:** Formateo en Markdown y entrega vía Telegram Bot API.
- **Infraestructura Serverless:** Ejecución en GitHub Actions con Cron programado para días hábiles.

---

## 💻 Ejecución Local

```bash
git clone https://github.com/Slashmanlml/b2b-licitaciones-radar.git
cd b2b-licitaciones-radar
node index.js
```
