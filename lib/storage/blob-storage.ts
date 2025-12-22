import { put, del, head } from '@vercel/blob';

/**
 * Upload un PDF vers Vercel Blob Storage
 * 
 * @param buffer - Le buffer PDF à uploader
 * @param filename - Le nom du fichier (ex: "devis-123-1234567890.pdf")
 * @returns L'URL publique du fichier uploadé
 */
export async function uploadPDF(
  buffer: Buffer,
  filename: string
): Promise<string> {
  try {
    console.log(`[Blob Storage] Upload du fichier ${filename}...`);

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error('BLOB_READ_WRITE_TOKEN n\'est pas configuré dans les variables d\'environnement');
    }

    // Upload vers Vercel Blob avec le token configuré
    const blob = await put(filename, buffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: 'application/pdf',
    });

    console.log(`[Blob Storage] Fichier uploadé avec succès: ${blob.url}`);
    return blob.url;

  } catch (error) {
    console.error('[Blob Storage] Erreur lors de l\'upload:', error);
    throw new Error(`Échec de l'upload du PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Vérifie si un PDF existe dans Vercel Blob Storage
 * 
 * @param filename - Le nom du fichier à vérifier
 * @returns true si le fichier existe, false sinon
 */
export async function pdfExists(filename: string): Promise<boolean> {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return false;
    }

    const blobUrl = `https://${process.env.VERCEL_URL || 'blob.vercel-storage.com'}/${filename}`;
    
    await head(blobUrl, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return true;
  } catch (error) {
    // Si le fichier n'existe pas, head() lance une erreur
    return false;
  }
}

/**
 * Récupère l'URL d'un PDF existant dans Vercel Blob Storage
 * 
 * @param filename - Le nom du fichier
 * @returns L'URL du fichier ou null si non trouvé
 */
export async function getPDFUrl(filename: string): Promise<string | null> {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return null;
    }

    const exists = await pdfExists(filename);
    if (!exists) {
      return null;
    }

    // Construire l'URL du blob
    const blobUrl = `https://${process.env.VERCEL_URL || 'blob.vercel-storage.com'}/${filename}`;
    return blobUrl;

  } catch (error) {
    console.error('[Blob Storage] Erreur lors de la récupération de l\'URL:', error);
    return null;
  }
}

/**
 * Supprime un PDF de Vercel Blob Storage
 * 
 * @param url - L'URL complète du blob à supprimer
 * @returns true si la suppression a réussi
 */
export async function deletePDF(url: string): Promise<boolean> {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error('BLOB_READ_WRITE_TOKEN n\'est pas configuré');
    }

    console.log(`[Blob Storage] Suppression du fichier: ${url}`);
    
    await del(url, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log('[Blob Storage] Fichier supprimé avec succès');
    return true;

  } catch (error) {
    console.error('[Blob Storage] Erreur lors de la suppression:', error);
    return false;
  }
}

/**
 * Génère un nom de fichier unique pour un devis
 * Format: devis-{bookingId}-{timestamp}.pdf
 * 
 * @param bookingId - L'ID de la réservation
 * @returns Le nom du fichier généré
 */
export function generateDevisFilename(bookingId: number): string {
  const timestamp = Date.now();
  return `devis-${bookingId}-${timestamp}.pdf`;
}

/**
 * Génère un nom de fichier unique pour une facture
 * Format: facture-{bookingId}-{timestamp}.pdf
 * 
 * @param bookingId - L'ID de la réservation
 * @returns Le nom du fichier généré
 */
export function generateFactureFilename(bookingId: number): string {
  const timestamp = Date.now();
  return `facture-${bookingId}-${timestamp}.pdf`;
}

/**
 * Parse un nom de fichier pour extraire le bookingId et le timestamp
 * 
 * @param filename - Le nom du fichier (ex: "devis-123-1234567890.pdf")
 * @returns Objet contenant bookingId et timestamp, ou null si invalide
 */
export function parseFilename(filename: string): { bookingId: number; timestamp: number; type: 'devis' | 'facture' } | null {
  const match = filename.match(/^(devis|facture)-(\d+)-(\d+)\.pdf$/);
  if (!match) {
    return null;
  }

  return {
    type: match[1] as 'devis' | 'facture',
    bookingId: parseInt(match[2], 10),
    timestamp: parseInt(match[3], 10),
  };
}


