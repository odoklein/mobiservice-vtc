import puppeteer from 'puppeteer-core';

/**
 * Fonction helper pour charger chromium dynamiquement
 * Nécessaire pour Vercel serverless
 */
async function getChromium() {
  if (process.env.NODE_ENV === 'production') {
    // En production (Vercel), charger dynamiquement @sparticuz/chromium
    const chromium = await import('@sparticuz/chromium');
    return chromium.default || chromium;
  }
  return null;
}

/**
 * Options pour la génération PDF
 */
export interface PDFRenderOptions {
  format?: 'A4' | 'Letter';
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  printBackground?: boolean;
  displayHeaderFooter?: boolean;
  preferCSSPageSize?: boolean;
}

/**
 * Génère un PDF à partir d'un contenu HTML en utilisant Puppeteer + Chromium
 * Optimisé pour l'environnement serverless Vercel
 * 
 * @param htmlContent - Le contenu HTML à convertir en PDF
 * @param options - Options de configuration PDF
 * @returns Buffer contenant le PDF généré
 */
export async function renderHTMLToPDF(
  htmlContent: string,
  options: PDFRenderOptions = {}
): Promise<Buffer> {
  let browser = null;

  try {
    console.log('[Puppeteer] Lancement du navigateur...');
    
    const chromium = await getChromium();
    
    // Configuration pour Vercel serverless
    let executablePath: string;
    let browserArgs: string[];

    if (process.env.NODE_ENV === 'production' && chromium) {
      // Production Vercel avec chromium
      executablePath = await chromium.executablePath();
      browserArgs = chromium.args;
    } else {
      // Développement local
      executablePath = process.env.CHROME_PATH || 
        process.platform === 'win32' 
          ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
          : process.platform === 'darwin'
          ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
          : '/usr/bin/google-chrome';
      
      browserArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ];
    }

    browser = await puppeteer.launch({
      args: browserArgs,
      executablePath,
      headless: true,
      defaultViewport: {
        width: 1280,
        height: 720,
      },
    });

    console.log('[Puppeteer] Navigateur lancé, création de la page...');
    const page = await browser.newPage();

    // Configuration de la page pour le français
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'fr-FR,fr;q=0.9',
    });

    // Charger le contenu HTML
    console.log('[Puppeteer] Chargement du contenu HTML...');
    await page.setContent(htmlContent, {
      waitUntil: ['load', 'networkidle0'],
      timeout: 20000, // 20 secondes max
    });

    // Options PDF par défaut
    const defaultOptions: PDFRenderOptions = {
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
    };

    const pdfOptions = { ...defaultOptions, ...options };

    console.log('[Puppeteer] Génération du PDF...');
    const pdfBuffer = await page.pdf({
      format: pdfOptions.format,
      margin: pdfOptions.margin,
      printBackground: pdfOptions.printBackground,
      preferCSSPageSize: pdfOptions.preferCSSPageSize,
      displayHeaderFooter: pdfOptions.displayHeaderFooter,
    });

    console.log('[Puppeteer] PDF généré avec succès');
    return Buffer.from(pdfBuffer);

  } catch (error) {
    console.error('[Puppeteer] Erreur lors de la génération du PDF:', error);
    throw new Error(`Erreur de génération PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  } finally {
    // Toujours fermer le navigateur pour libérer les ressources
    if (browser) {
      console.log('[Puppeteer] Fermeture du navigateur...');
      await browser.close();
    }
  }
}

/**
 * Génère un PDF à partir d'une URL
 * Utile pour tester ou générer des PDFs depuis des pages web
 * 
 * @param url - L'URL de la page à convertir
 * @param options - Options de configuration PDF
 * @returns Buffer contenant le PDF généré
 */
export async function renderURLToPDF(
  url: string,
  options: PDFRenderOptions = {}
): Promise<Buffer> {
  let browser = null;

  try {
    console.log('[Puppeteer] Lancement du navigateur pour URL...');
    
    const chromium = await getChromium();
    
    let executablePath: string;
    let browserArgs: string[];

    if (process.env.NODE_ENV === 'production' && chromium) {
      executablePath = await chromium.executablePath();
      browserArgs = chromium.args;
    } else {
      executablePath = process.env.CHROME_PATH || 
        process.platform === 'win32' 
          ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
          : process.platform === 'darwin'
          ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
          : '/usr/bin/google-chrome';
      
      browserArgs = ['--no-sandbox', '--disable-setuid-sandbox'];
    }

    browser = await puppeteer.launch({
      args: browserArgs,
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    
    console.log(`[Puppeteer] Navigation vers ${url}...`);
    await page.goto(url, {
      waitUntil: ['load', 'networkidle0'],
      timeout: 20000,
    });

    const defaultOptions: PDFRenderOptions = {
      format: 'A4',
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      printBackground: true,
      preferCSSPageSize: true,
    };

    const pdfOptions = { ...defaultOptions, ...options };

    console.log('[Puppeteer] Génération du PDF depuis URL...');
    const pdfBuffer = await page.pdf(pdfOptions);

    console.log('[Puppeteer] PDF généré avec succès');
    return Buffer.from(pdfBuffer);

  } catch (error) {
    console.error('[Puppeteer] Erreur lors de la génération du PDF depuis URL:', error);
    throw new Error(`Erreur de génération PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

