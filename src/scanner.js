const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'data', 'licitaciones_vistas.json');

class ProcurementScanner {
    constructor() {
        this.categories = ['TECNOLOGIA', 'SALUD', 'CONSTRUCCION', 'SERVICIOS'];
    }

    async fetchOpportunities() {
        console.log('📡 [Scanner] Consultando portales de compras públicas y licitaciones...');

        // Simulación estructurada de feed de compras públicas en tiempo real (COMPR.AR / Boletín)
        const sampleTenders = [
            {
                id: `LIC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                organismo: 'Ministerio de Salud y Desarrollo Social',
                titulo: 'Adquisición de Equipamiento Informático y Servidores para Centros Médicos',
                categoria: 'TECNOLOGIA',
                montoEstimado: '$ 45.000.000 ARS',
                apertura: new Date(Date.now() + 86400000 * 12).toLocaleDateString('es-AR'),
                enlace: 'https://comprar.gob.ar/licitacion/sample-tech-2026',
                fechaDeteccion: new Date().toISOString()
            },
            {
                id: `LIC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                organismo: 'Hospital Regional de Agudos',
                titulo: 'Provisión de Insumos Descartables y Reactivos de Laboratorio',
                categoria: 'SALUD',
                montoEstimado: '$ 28.500.000 ARS',
                apertura: new Date(Date.now() + 86400000 * 8).toLocaleDateString('es-AR'),
                enlace: 'https://comprar.gob.ar/licitacion/sample-health-2026',
                fechaDeteccion: new Date().toISOString()
            },
            {
                id: `LIC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                organismo: 'Agencia de Recaudación y Control',
                titulo: 'Contratación de Servicios de Auditoría de Ciberseguridad y Pentesting',
                categoria: 'TECNOLOGIA',
                montoEstimado: '$ 18.200.000 ARS',
                apertura: new Date(Date.now() + 86400000 * 15).toLocaleDateString('es-AR'),
                enlace: 'https://comprar.gob.ar/licitacion/sample-sec-2026',
                fechaDeteccion: new Date().toISOString()
            }
        ];

        // Filtrar nuevas que no hayamos visto antes
        let historico = [];
        if (fs.existsSync(DB_FILE)) {
            try {
                historico = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
            } catch (e) {
                historico = [];
            }
        }

        const idsVistos = new Set(historico.map(t => t.id));
        const nuevas = sampleTenders.filter(t => !idsVistos.has(t.id));

        console.log(`📊 [Scanner] Oportunidades detectadas: ${sampleTenders.length} | Nuevas para alertar: ${nuevas.length}`);

        // Guardar actualizadas
        const actualizado = [...nuevas, ...historico].slice(0, 100);
        fs.writeFileSync(DB_FILE, JSON.stringify(actualizado, null, 2), 'utf-8');

        return nuevas;
    }
}

module.exports = ProcurementScanner;
