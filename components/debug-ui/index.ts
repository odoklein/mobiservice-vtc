/**
 * Debug UI Components
 * 
 * This folder contains debugging and development UI components
 * that are NOT included in production builds.
 * 
 * Usage:
 * ```tsx
 * import { PricingDebugPanel, DebugModeToggle } from '@/components/debug-ui';
 * 
 * // In your component:
 * const [debugMode, setDebugMode] = useState(false);
 * 
 * return (
 *   <>
 *     <DebugModeToggle 
 *       debugMode={debugMode} 
 *       onToggle={() => setDebugMode(!debugMode)} 
 *     />
 *     {debugMode && <PricingDebugPanel bookingData={bookingData} />}
 *   </>
 * );
 * ```
 */

export { PricingDebugPanel, DebugModeToggle } from './PricingDebugPanel';



