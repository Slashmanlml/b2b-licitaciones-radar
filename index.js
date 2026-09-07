const ProcurementScanner = require('./src/scanner');
const TelegramNotifier = require('./src/notifier');

async function main() {
    console.log('====================================================');
    console.log('🏛️ B2B LICITACIONES RADAR - EJECUCIÓN AUTÓNOMA');
    console.log('====================================================\n');

    const scanner = new ProcurementScanner();
    const nuevasLicitaciones = await scanner.fetchOpportunities();

    for (const licitacion of nuevasLicitaciones) {
        await TelegramNotifier.dispatchTenderAlert(licitacion);
        // Pequeña pausa entre mensajes
        await new Promise(r => setTimeout(r, 800));
    }

    console.log('\n====================================================');
    console.log(`✅ Pipeline finalizado. ${nuevasLicitaciones.length} alertas procesadas.`);
    console.log('====================================================');
}

main().catch(err => {
    console.error('❌ Error crítico en el radar:', err);
    process.exit(1);
});
