import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

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
    
    // Configuration pour Vercel serverless
    const executablePath = process.env.NODE_ENV === 'production'
      ? await chromium.executablePath()
      : process.env.CHROME_PATH || '/usr/bin/google-chrome'; // Fallback pour développement local

    browser = await puppeteer.launch({
      args: process.env.NODE_ENV === 'production'
        ? chromium.args
        : [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
          ],
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
    
    const executablePath = process.env.NODE_ENV === 'production'
      ? await chromium.executablePath()
      : process.env.CHROME_PATH || '/usr/bin/google-chrome';

    browser = await puppeteer.launch({
      args: process.env.NODE_ENV === 'production'
        ? chromium.args
        : ['--no-sandbox', '--disable-setuid-sandbox'],
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

