this is the errors i found when deplyoing on vercel, pleae help me inspect and fix all of them immediately without causing any other error please - 


[17:18:00.874] Running build in Washington, D.C., USA (East) – iad1
[17:18:00.882] Build machine configuration: 2 cores, 8 GB
[17:18:00.956] Cloning github.com/adamstosho/GroChain_Project (Branch: main, Commit: 97aa2fc)
[17:18:01.347] Previous build caches not available
[17:18:02.379] Cloning completed: 1.423s
[17:18:02.717] Found .vercelignore (repository root)
[17:18:02.729] Removed 119 ignored files defined in .vercelignore
[17:18:02.729]   /backend/.gitignore
[17:18:02.729]   /backend/app.js
[17:18:02.729]   /backend/controllers/analytics.controller.js
[17:18:02.729]   /backend/controllers/auth.controller.js
[17:18:02.729]   /backend/controllers/bvnVerification.controller.js
[17:18:02.729]   /backend/controllers/commission.controller.js
[17:18:02.729]   /backend/controllers/exportImport.controller.js
[17:18:02.729]   /backend/controllers/farmer.controller.js
[17:18:02.729]   /backend/controllers/fintech.controller.js
[17:18:02.729]   /backend/controllers/googleAuth.controller.js
[17:18:03.226] Running "vercel build"
[17:18:03.634] Vercel CLI 48.0.2
[17:18:04.464] Installing dependencies...
[17:18:08.196] npm warn deprecated sourcemap-codec@1.4.8: Please use @jridgewell/sourcemap-codec instead
[17:18:08.420] npm warn deprecated rollup-plugin-terser@7.0.2: This package has been deprecated and is no longer maintained. Please use @rollup/plugin-terser
[17:18:08.421] npm warn deprecated rimraf@2.7.1: Rimraf versions prior to v4 are no longer supported
[17:18:09.267] npm warn deprecated workbox-cacheable-response@6.6.0: workbox-background-sync@6.6.0
[17:18:09.493] npm warn deprecated workbox-google-analytics@6.6.0: It is not compatible with newer versions of GA starting with v4, as long as you are using GAv3 it should be ok, but the package is not longer being maintained
[17:18:09.650] npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
[17:18:09.897] npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
[17:18:10.310] npm warn deprecated node-domexception@1.0.0: Use your platform's native DOMException instead
[17:18:14.243] npm warn deprecated source-map@0.8.0-beta.0: The work that was done in this beta branch won't be included in future versions
[17:18:32.521] 
[17:18:32.521] added 1131 packages in 28s
[17:18:32.521] 
[17:18:32.522] 194 packages are looking for funding
[17:18:32.522]   run `npm fund` for details
[17:18:32.747] Running "npm run build"
[17:18:32.971] 
[17:18:32.971] > Grochain@0.1.0 build
[17:18:32.972] > next build
[17:18:32.972] 
[17:18:34.602] Attention: Next.js now collects completely anonymous telemetry regarding usage.
[17:18:34.602] This information is used to shape Next.js' roadmap and prioritize features.
[17:18:34.602] You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
[17:18:34.603] https://nextjs.org/telemetry
[17:18:34.603] 
[17:18:34.647]    ▲ Next.js 15.5.3
[17:18:34.647] 
[17:18:34.748]    Creating an optimized production build ...
[17:18:35.097] > [PWA] Compile server
[17:18:35.098] > [PWA] Compile server
[17:18:35.099] > [PWA] Compile client (static)
[17:18:35.099] > [PWA] Auto register service worker with: /vercel/path0/node_modules/next-pwa/register.js
[17:18:35.100] > [PWA] Service worker: /vercel/path0/client/public/sw.js
[17:18:35.100] > [PWA]   url: /sw.js
[17:18:35.100] > [PWA]   scope: /
[17:18:35.120] > [PWA] Fallback to precache routes when fetch failed from cache or network:
[17:18:35.121] > [PWA]   document (page): /offline
[17:19:32.988]  ✓ Compiled successfully in 58s
[17:19:32.994]    Linting and checking validity of types ...
[17:19:56.577] 
[17:19:56.577] Failed to compile.
[17:19:56.577] 
[17:19:56.579] ./app/analytics/page.tsx
[17:19:56.579] 3:10  Warning: 'useState' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.580] 3:20  Warning: 'useEffect' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.580] 
[17:19:56.580] ./app/auth/google/callback/page.tsx
[17:19:56.580] 14:10  Warning: 'retryCount' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.580] 88:20  Warning: 'e' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.580] 
[17:19:56.582] ./app/dashboard/cart/page.tsx
[17:19:56.582] 8:45  Warning: 'Package' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.582] 
[17:19:56.582] ./app/dashboard/commissions/page.tsx
[17:19:56.582] 22:3  Warning: 'Filter' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.582] 23:3  Warning: 'Calendar' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.582] 30:3  Warning: 'Edit' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.582] 36:11  Warning: 'Commission' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.582] 63:14  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.582] 68:11  Warning: 'CommissionSummary' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.582] 87:5  Warning: 'processPayout' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.582] 90:5  Warning: 'approvedCommissions' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.583] 93:5  Warning: 'totalPaidAmount' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.583] 94:5  Warning: 'updateFilters' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.583] 103:64  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.583] 143:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.589] 155:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.589] 
[17:19:56.589] ./app/dashboard/farmers/add/page.tsx
[17:19:56.589] 10:10  Warning: 'Alert' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.589] 10:17  Warning: 'AlertDescription' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.589] 19:3  Warning: 'MapPin' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.590] 20:3  Warning: 'Phone' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.590] 21:3  Warning: 'Mail' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.590] 22:3  Warning: 'Calendar' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.590] 23:3  Warning: 'Building' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.590] 163:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.590] 
[17:19:56.590] ./app/dashboard/farmers/bulk/page.tsx
[17:19:56.590] 7:10  Warning: 'Input' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.590] 8:10  Warning: 'Badge' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.591] 21:3  Warning: 'Users' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.593] 51:10  Warning: 'csvData' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.593] 70:6  Warning: React Hook useCallback has a missing dependency: 'processCSV'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.593] 86:60  Warning: 'index' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.594] 97:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.594] 192:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.594] 
[17:19:56.594] ./app/dashboard/farmers/page.tsx
[17:19:56.594] 11:10  Warning: 'Tabs' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.594] 11:16  Warning: 'TabsContent' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.594] 11:29  Warning: 'TabsList' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.594] 11:39  Warning: 'TabsTrigger' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.594] 18:3  Warning: 'Filter' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.594] 35:11  Warning: 'Farmer' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.594] 49:5  Warning: 'farmers' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.594] 52:5  Warning: 'filters' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.595] 56:5  Warning: 'addFarmer' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.595] 57:5  Warning: 'updateFarmer' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.595] 58:5  Warning: 'deleteFarmer' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.595] 60:5  Warning: 'activeFarmers' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.595] 61:5  Warning: 'inactiveFarmers' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.595] 62:5  Warning: 'suspendedFarmers' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.595] 63:5  Warning: 'totalFarmers' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.595] 64:5  Warning: 'totalActiveFarmers' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.595] 
[17:19:56.595] ./app/dashboard/favorites/page.tsx
[17:19:56.595] 19:3  Warning: 'Star' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.595] 84:58  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.596] 87:75  Warning: 'profile' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.596] 89:51  Warning: 'createAlert' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.596] 89:64  Warning: 'updateAlert' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.596] 119:23  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.596] 183:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.596] 193:9  Warning: 'handleAddToFavorites' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.596] 200:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.596] 200:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.596] 218:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.597] 218:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.597] 265:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.597] 265:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.597] 296:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.597] 827:17  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[17:19:56.597] 827:33  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[17:19:56.597] 
[17:19:56.597] ./app/dashboard/financial/credit/page.tsx
[17:19:56.597] 19:3  Warning: 'Banknote' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.598] 20:3  Warning: 'Calendar' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.598] 24:3  Warning: 'Star' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.598] 25:3  Warning: 'Award' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.598] 27:3  Warning: 'BarChart3' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.598] 28:3  Warning: 'PieChart' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.598] 29:3  Warning: 'Activity' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.598] 31:3  Warning: 'Eye' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.598] 32:3  Warning: 'EyeOff' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.598] 88:10  Warning: 'showDetails' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.598] 88:23  Warning: 'setShowDetails' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.598] 93:6  Warning: React Hook useEffect has a missing dependency: 'fetchCreditScore'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.598] 103:50  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.599] 111:54  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.599] 117:53  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.600] 122:67  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.601] 143:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.601] 150:59  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.601] 202:16  Warning: 'fallbackError' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.601] 233:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.601] 
[17:19:56.601] ./app/dashboard/financial/goals/page.tsx
[17:19:56.601] 25:3  Warning: 'AlertCircle' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.601] 30:3  Warning: 'Car' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.601] 132:10  Warning: 'stats' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.601] 155:6  Warning: React Hook useEffect has a missing dependency: 'fetchGoals'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.601] 165:50  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.601] 168:72  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.602] 371:9  Warning: 'getProgressColor' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.602] 742:49  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[17:19:56.602] 742:71  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[17:19:56.602] 
[17:19:56.602] ./app/dashboard/financial/insurance/claims/page.tsx
[17:19:56.602] 13:10  Warning: 'apiService' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.602] 23:3  Warning: 'Banknote' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.602] 24:3  Warning: 'Calendar' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.602] 29:3  Warning: 'MapPin' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.602] 31:3  Warning: 'Thermometer' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.602] 32:3  Warning: 'Droplets' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.602] 33:3  Warning: 'Wind' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.602] 34:3  Warning: 'Sun' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.603] 35:3  Warning: 'Cloud' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.603] 37:3  Warning: 'Zap' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.610] 39:8  Warning: 'Link' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.610] 113:6  Warning: React Hook useEffect has a missing dependency: 'fetchClaimsData'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.610] 208:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.610] 
[17:19:56.610] ./app/dashboard/financial/insurance/compare/page.tsx
[17:19:56.610] 23:3  Warning: 'Clock' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.611] 24:3  Warning: 'Banknote' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.611] 25:3  Warning: 'MapPin' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.611] 27:3  Warning: 'Building' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.611] 126:6  Warning: React Hook useEffect has a missing dependency: 'fetchInsurancePolicies'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.611] 142:48  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.611] 145:82  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.611] 189:9  Warning: 'applyFilters' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.613] 231:9  Warning: 'getExclusionIcon' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.613] 
[17:19:56.614] ./app/dashboard/financial/insurance/policies/page.tsx
[17:19:56.614] 18:3  Warning: 'RefreshCw' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.614] 20:3  Warning: 'Filter' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.614] 21:3  Warning: 'Calendar' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.614] 22:3  Warning: 'Banknote' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.614] 24:3  Warning: 'CheckCircle' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.614] 25:3  Warning: 'Clock' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.614] 26:3  Warning: 'XCircle' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.614] 28:3  Warning: 'TrendingDown' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.614] 29:3  Warning: 'MapPin' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.615] 31:3  Warning: 'Droplets' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.615] 32:3  Warning: 'Thermometer' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.615] 33:3  Warning: 'Wind' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.615] 34:3  Warning: 'Sun' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.615] 35:3  Warning: 'Cloud' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.615] 37:3  Warning: 'ChevronDown' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.615] 38:3  Warning: 'ChevronUp' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.615] 39:3  Warning: 'Minus' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.615] 147:6  Warning: React Hook useEffect has a missing dependency: 'fetchPolicies'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.615] 160:56  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.615] 163:82  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.615] 184:64  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.615] 189:53  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.616] 196:57  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.616] 215:62  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.616] 232:41  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.616] 253:59  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.616] 256:89  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.616] 286:58  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.616] 287:70  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.616] 288:69  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.616] 328:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.616] 337:9  Warning: 'handleSort' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.616] 377:17  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.616] 378:17  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.616] 
[17:19:56.616] ./app/dashboard/financial/loans/apply/page.tsx
[17:19:56.617] 13:68  Warning: 'AlertCircle' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.617] 79:6  Warning: React Hook useEffect has a missing dependency: 'loadUserData'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.617] 88:49  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.617] 110:53  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.617] 114:58  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.617] 235:32  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.617] 302:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.617] 
[17:19:56.617] ./app/dashboard/financial/loans/page.tsx
[17:19:56.617] 21:3  Warning: 'Calendar' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.617] 27:3  Warning: 'ArrowRight' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.617] 100:6  Warning: React Hook useEffect has a missing dependency: 'fetchLoansData'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.617] 113:64  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.618] 116:87  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.618] 138:73  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.618] 138:108  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.618] 155:60  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.618] 156:56  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.618] 156:89  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.618] 648:28  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.618] 
[17:19:56.618] ./app/dashboard/financial/page.tsx
[17:19:56.618] 22:3  Warning: 'Calendar' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.618] 23:3  Warning: 'MapPin' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.618] 98:6  Warning: React Hook useEffect has a missing dependency: 'fetchFinancialData'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.618] 115:33  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.618] 116:51  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.619] 116:82  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.619] 117:37  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.619] 118:33  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.619] 119:39  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.619] 120:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.619] 121:36  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.619] 122:31  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.619] 126:65  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.619] 126:114  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.619] 137:51  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.619] 137:86  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.619] 150:59  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.619] 150:102  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.620] 169:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.620] 
[17:19:56.620] ./app/dashboard/financial/transactions/page.tsx
[17:19:56.620] 18:3  Warning: 'Filter' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.620] 20:3  Warning: 'Calendar' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.620] 22:3  Warning: 'Wallet' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.620] 25:3  Warning: 'MoreHorizontal' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.620] 36:3  Warning: 'MapPin' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.620] 37:3  Warning: 'User' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.620] 121:6  Warning: React Hook useEffect has a missing dependency: 'fetchTransactions'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.620] 134:70  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.620] 137:83  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.620] 166:66  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.621] 187:41  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.621] 208:56  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.621] 210:87  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.621] 229:44  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.621] 231:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.621] 233:46  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.621] 314:17  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.621] 315:17  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.628] 
[17:19:56.629] ./app/dashboard/harvests/[id]/edit/page.tsx
[17:19:56.629] 11:21  Warning: 'Leaf' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.629] 52:3  Error: React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[17:19:56.629] 54:6  Warning: React Hook useEffect has a missing dependency: 'fetchHarvestData'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.629] 60:36  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.629] 60:66  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.629] 166:32  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.629] 192:3  Error: React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
[17:19:56.630] 
[17:19:56.630] ./app/dashboard/harvests/[id]/page.tsx
[17:19:56.631] 30:16  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.631] 64:6  Warning: React Hook useEffect has a missing dependency: 'fetchHarvestData'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.631] 70:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.631] 70:70  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.631] 111:61  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.631] 111:82  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.631] 
[17:19:56.631] ./app/dashboard/harvests/new/page.tsx
[17:19:56.631] 50:36  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.631] 50:66  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.631] 64:32  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.631] 177:20  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.632] 
[17:19:56.632] ./app/dashboard/harvests/page.tsx
[17:19:56.632] 10:79  Warning: 'DialogTrigger' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.632] 40:3  Warning: 'Star' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.632] 41:3  Warning: 'Thermometer' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.632] 47:3  Warning: 'FileText' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.632] 48:3  Warning: 'Activity' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.632] 85:25  Warning: 'setQualityFilter' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.632] 86:25  Warning: 'setOrganicFilter' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.632] 87:21  Warning: 'setDateRange' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.632] 88:18  Warning: 'setSortBy' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.632] 91:10  Warning: 'showBulkActions' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.632] 91:27  Warning: 'setShowBulkActions' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.633] 109:6  Warning: React Hook useEffect has a missing dependency: 'fetchHarvests'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.633] 120:6  Warning: React Hook useEffect has missing dependencies: 'fetchHarvests' and 'loading'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.633] 127:22  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.633] 150:23  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.633] 154:53  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.633] 203:23  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.633] 250:28  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.633] 251:26  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.633] 252:25  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.633] 256:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.633] 257:54  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.633] 257:86  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.633] 289:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.634] 300:9  Warning: 'handleSelectHarvest' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.634] 308:9  Warning: 'handleSelectAll' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.634] 316:9  Warning: 'handleBulkDelete' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.634] 333:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.634] 344:9  Warning: 'handleBulkExport' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.634] 360:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.634] 431:35  Warning: 'variant' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.634] 935:28  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.634] 
[17:19:56.634] ./app/dashboard/marketplace/analytics/page.tsx
[17:19:56.634] 6:10  Warning: 'Badge' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.634] 22:3  Warning: 'Filter' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.634] 94:10  Warning: 'selectedMetric' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.634] 94:26  Warning: 'setSelectedMetric' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.635] 100:6  Warning: React Hook useEffect has a missing dependency: 'fetchAnalytics'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.635] 113:28  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.635] 114:29  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.635] 115:28  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.635] 116:31  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.635] 117:27  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.635] 118:33  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.635] 118:77  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.635] 125:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.636] 125:74  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.636] 130:33  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.636] 130:65  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.636] 139:31  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.636] 140:36  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.636] 141:33  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.636] 145:31  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.637] 146:36  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.637] 147:33  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.637] 151:31  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.637] 152:36  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.637] 153:33  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.637] 156:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.637] 
[17:19:56.637] ./app/dashboard/marketplace/listings/[id]/edit/page.tsx
[17:19:56.637] 17:3  Warning: 'Tag' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.637] 18:3  Warning: 'MapPin' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.637] 19:3  Warning: 'Banknote' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.638] 21:3  Warning: 'Info' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.638] 104:10  Warning: 'listing' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.638] 129:6  Warning: React Hook useEffect has a missing dependency: 'loadListingData'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.638] 137:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.638] 245:63  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.638] 259:32  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.653] 586:31  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[17:19:56.654] 
[17:19:56.654] ./app/dashboard/marketplace/listings/page.tsx
[17:19:56.654] 5:29  Warning: 'CardDescription' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.654] 18:3  Warning: 'Filter' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.654] 20:3  Warning: 'Calendar' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.654] 23:3  Warning: 'TrendingUp' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.654] 24:3  Warning: 'TrendingDown' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.654] 26:3  Warning: 'Archive' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.654] 31:3  Warning: 'MoreHorizontal' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.654] 32:3  Warning: 'Trash2' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.654] 113:10  Warning: 'showCreateModal' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.655] 113:27  Warning: 'setShowCreateModal' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.655] 119:6  Warning: React Hook useEffect has a missing dependency: 'fetchListings'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.655] 123:6  Warning: React Hook useEffect has a missing dependency: 'filterListings'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.655] 134:63  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.655] 135:48  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.655] 139:62  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.655] 
[17:19:56.657] ./app/dashboard/marketplace/new/page.tsx
[17:19:56.659] 17:3  Warning: 'Tag' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.659] 18:3  Warning: 'MapPin' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.660] 19:3  Warning: 'Banknote' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.660] 74:7  Warning: 'states' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.660] 119:6  Warning: React Hook useEffect has a missing dependency: 'loadHarvestData'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.660] 127:36  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.660] 277:14  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.660] 293:32  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.660] 623:31  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[17:19:56.660] 
[17:19:56.660] ./app/dashboard/marketplace/orders/page.tsx
[17:19:56.660] 5:29  Warning: 'CardDescription' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.660] 18:3  Warning: 'XCircle' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.661] 21:3  Warning: 'Filter' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.661] 30:3  Warning: 'MoreHorizontal' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.661] 122:6  Warning: React Hook useEffect has a missing dependency: 'fetchOrders'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.661] 184:63  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.661] 185:46  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.661] 189:56  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.661] 198:48  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.661] 
[17:19:56.661] ./app/dashboard/marketplace/page.tsx
[17:19:56.661] 18:3  Warning: 'Trash2' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.668] 23:3  Warning: 'MapPin' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.677] 25:3  Warning: 'Filter' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.678] 27:3  Warning: 'MoreHorizontal' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.678] 109:6  Warning: React Hook useEffect has a missing dependency: 'fetchMarketplaceData'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.678] 119:61  Warning: 'farmerAnalytics' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.678] 137:44  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.678] 138:45  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.678] 140:44  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.678] 141:43  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.678] 142:45  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.678] 167:75  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.678] 167:131  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.679] 168:54  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.679] 169:62  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.679] 194:71  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.679] 194:123  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.679] 195:50  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.679] 196:56  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.679] 213:67  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.679] 214:69  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.679] 349:9  Warning: 'handleUpdateListingStatus' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.679] 
[17:19:56.679] ./app/dashboard/orders/[orderId]/page.tsx
[17:19:56.679] 84:37  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.680] 95:23  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.680] 138:38  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.680] 139:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.680] 139:86  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.680] 
[17:19:56.680] ./app/dashboard/orders/page.tsx
[17:19:56.680] 13:10  Warning: 'SkeletonCard' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.680] 13:24  Warning: 'SkeletonStats' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.680] 13:39  Warning: 'SkeletonFilters' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.680] 17:10  Warning: 'useBuyerStore' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.680] 22:3  Warning: 'Search' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.680] 23:3  Warning: 'Filter' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.681] 25:3  Warning: 'Star' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.681] 27:3  Warning: 'Calendar' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.681] 32:3  Warning: 'AlertCircle' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.681] 34:3  Warning: 'Download' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.681] 39:3  Warning: 'TrendingUp' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.681] 42:3  Warning: 'ArrowRight' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.681] 43:3  Warning: 'ChevronRight' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.681] 45:3  Warning: 'TruckIcon' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.681] 46:3  Warning: 'MapPinIcon' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.681] 47:3  Warning: 'ClockIcon' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.681] 49:3  Warning: 'AlertTriangle' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.682] 50:3  Warning: 'Plus' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.682] 131:11  Warning: 'OrdersResponse' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.682] 192:10  Warning: 'pagination' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.682] 225:6  Warning: React Hook useEffect has a missing dependency: 'fetchOrdersData'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.682] 250:46  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.682] 251:43  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.682] 262:32  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.682] 267:50  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.682] 300:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.682] 301:56  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.682] 1144:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.682] 1171:61  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.682] 1181:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.682] 1270:113  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.682] 1274:62  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.682] 
[17:19:56.682] ./app/dashboard/payments/page.tsx
[17:19:56.682] 5:29  Warning: 'CardDescription' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.682] 5:46  Warning: 'CardHeader' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.682] 5:58  Warning: 'CardTitle' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.682] 15:3  Warning: 'Smartphone' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.682] 21:3  Warning: 'Search' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.682] 22:3  Warning: 'Filter' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.682] 23:3  Warning: 'Calendar' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.690] 32:3  Warning: 'ArrowUpRight' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.690] 45:11  Warning: 'profile' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.690] 49:52  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.690] 50:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.690] 55:56  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.690] 70:88  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.692] 71:56  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.692] 72:50  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.692] 74:56  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.692] 87:54  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.692] 104:60  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.692] 114:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.692] 143:73  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.692] 144:54  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.692] 149:37  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.692] 150:48  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.692] 151:44  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.692] 152:48  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.692] 154:47  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.692] 160:58  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.692] 167:19  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.692] 192:36  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.692] 670:52  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.693] 
[17:19:56.693] ./app/dashboard/products/[productId]/page.tsx
[17:19:56.693] 6:29  Warning: 'CardDescription' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.693] 8:10  Warning: 'Separator' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.693] 22:3  Warning: 'TrendingUp' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.693] 30:3  Warning: 'Eye' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.693] 84:10  Warning: 'favorites' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.693] 84:21  Warning: 'setFavorites' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.693] 84:46  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.693] 91:6  Warning: React Hook useEffect has missing dependencies: 'fetchFavorites' and 'fetchProductDetail'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.694] 107:45  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.694] 122:38  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.694] 123:52  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.694] 126:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.694] 127:47  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.694] 134:52  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.694] 145:28  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.694] 155:19  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.694] 211:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.694] 244:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.694] 312:32  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.694] 312:53  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.694] 
[17:19:56.694] ./app/dashboard/products/page.tsx
[17:19:56.694] 5:29  Warning: 'CardDescription' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.695] 9:10  Warning: 'Tabs' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.695] 9:16  Warning: 'TabsContent' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.695] 9:29  Warning: 'TabsList' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.695] 9:39  Warning: 'TabsTrigger' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.695] 27:3  Warning: 'Leaf' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.695] 28:3  Warning: 'TrendingUp' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.695] 77:10  Warning: 'products' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.695] 118:85  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.695] 143:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.695] 170:6  Warning: React Hook useEffect has a missing dependency: 'fetchProducts'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.695] 174:6  Warning: React Hook useEffect has a missing dependency: 'fetchProducts'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.695] 190:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.695] 262:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.695] 268:74  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.696] 298:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.696] 377:74  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.696] 383:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.698] 384:33  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.698] 486:118  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.698] 500:118  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.698] 516:122  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.698] 530:116  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.698] 542:114  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.698] 680:14  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.698] 694:11  Warning: 'toast' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.698] 697:73  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.698] 900:123  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.698] 
[17:19:56.698] ./app/dashboard/qr-codes/[id]/page.tsx
[17:19:56.698] 20:3  Warning: 'CheckCircle' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.698] 26:3  Warning: 'Eye' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.698] 27:3  Warning: 'Smartphone' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.698] 28:3  Warning: 'Printer' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.698] 30:3  Warning: 'Share2' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.698] 31:3  Warning: 'RefreshCw' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.698] 37:8  Warning: 'Image' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.698] 57:29  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.699] 69:24  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.699] 89:6  Warning: React Hook useEffect has a missing dependency: 'fetchQRCodeDetails'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.699] 105:27  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.699] 106:31  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.699] 107:33  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.699] 108:32  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.699] 109:31  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.699] 110:32  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.699] 111:28  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.699] 112:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.699] 113:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.699] 114:33  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.699] 115:30  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.699] 116:30  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.700] 117:29  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.700] 118:32  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.700] 119:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.700] 120:32  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.700] 121:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.700] 121:58  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.700] 274:66  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.700] 274:87  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.700] 337:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[17:19:56.700] 383:141  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.700] 383:189  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.700] 461:135  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.700] 461:183  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.700] 513:41  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.700] 531:142  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.700] 531:188  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.700] 551:40  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.700] 
[17:19:56.700] ./app/dashboard/qr-codes/generate/page.tsx
[17:19:56.700] 14:54  Warning: 'Share2' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.700] 14:93  Warning: 'Info' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.700] 56:50  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.700] 82:6  Warning: React Hook useEffect has a missing dependency: 'fetchHarvests'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.700] 86:23  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.700] 129:13  Warning: 'payload' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.700] 165:32  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.700] 282:110  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.700] 282:159  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.700] 490:25  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[17:19:56.700] 
[17:19:56.700] ./app/dashboard/qr-codes/page.tsx
[17:19:56.700] 19:3  Warning: 'Filter' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.700] 24:3  Warning: 'AlertTriangle' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.700] 25:3  Warning: 'FileText' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.700] 27:3  Warning: 'Calendar' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.700] 28:3  Warning: 'Package' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.700] 31:3  Warning: 'TrendingDown' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.700] 32:3  Warning: 'Minus' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.700] 126:10  Warning: 'statsLoading' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.700] 131:6  Warning: React Hook useEffect has a missing dependency: 'fetchQRCodes'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.700] 139:6  Warning: React Hook useEffect has missing dependencies: 'fetchStats' and 'loading'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.700] 143:6  Warning: React Hook useEffect has a missing dependency: 'fetchStats'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.700] 183:65  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.701] 239:49  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.701] 407:17  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.701] 408:17  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.701] 893:37  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.701] 900:25  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[17:19:56.701] 901:51  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.701] 919:91  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.701] 927:77  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.701] 961:51  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.701] 978:37  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.701] 978:70  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.701] 985:45  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.701] 985:80  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.701] 1021:58  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.701] 
[17:19:56.701] ./app/dashboard/referrals/page.tsx
[17:19:56.701] 22:3  Warning: 'Filter' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.701] 26:3  Warning: 'Eye' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.701] 40:5  Warning: 'createReferral' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.701] 41:5  Warning: 'updateReferral' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.701] 46:5  Warning: 'updateFilters' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.702] 57:60  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.702] 71:41  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.702] 76:41  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.702] 81:49  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.702] 
[17:19:56.702] ./app/dashboard/reports/page.tsx
[17:19:56.702] 7:10  Warning: 'Input' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.702] 8:10  Warning: 'Label' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.702] 9:10  Warning: 'Select' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.702] 9:18  Warning: 'SelectContent' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.702] 9:33  Warning: 'SelectItem' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.702] 9:45  Warning: 'SelectTrigger' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.703] 9:60  Warning: 'SelectValue' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.703] 11:10  Warning: 'Checkbox' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.703] 17:3  Warning: 'Calendar' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.703] 19:3  Warning: 'TrendingUp' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.703] 21:3  Warning: 'Leaf' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.703] 24:3  Warning: 'CreditCard' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.703] 30:3  Warning: 'XCircle' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.703] 66:10  Warning: 'selectedTemplates' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.703] 66:29  Warning: 'setSelectedTemplates' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.707] 72:6  Warning: React Hook useEffect has a missing dependency: 'fetchReportsData'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.707] 170:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.707] 
[17:19:56.707] ./app/dashboard/reviews/page.tsx
[17:19:56.707] 5:29  Warning: 'CardHeader' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.707] 5:41  Warning: 'CardTitle' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.707] 10:10  Warning: 'Tabs' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.707] 10:16  Warning: 'TabsContent' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.707] 10:29  Warning: 'TabsList' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.707] 10:39  Warning: 'TabsTrigger' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.707] 12:60  Warning: 'DialogTrigger' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.707] 26:3  Warning: 'TrendingUp' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.707] 27:3  Warning: 'Users' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.708] 28:3  Warning: 'ThumbsUp' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.708] 69:11  Warning: 'user' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.708] 87:6  Warning: React Hook useEffect has a missing dependency: 'fetchReviews'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.708] 96:27  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.708] 97:25  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.708] 125:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.708] 335:29  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[17:19:56.708] 
[17:19:56.708] ./app/dashboard/scanner/page.tsx
[17:19:56.708] 10:10  Warning: 'Dialog' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.708] 10:18  Warning: 'DialogContent' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.709] 10:33  Warning: 'DialogDescription' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.709] 10:52  Warning: 'DialogHeader' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.709] 10:66  Warning: 'DialogTitle' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.709] 10:79  Warning: 'DialogTrigger' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.709] 23:3  Warning: 'RefreshCw' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.709] 31:3  Warning: 'MapPin' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.709] 33:3  Warning: 'Star' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.709] 36:3  Warning: 'Upload' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.709] 38:3  Warning: 'ExternalLink' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.709] 39:3  Warning: 'User' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.709] 40:3  Warning: 'Calendar' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.709] 41:3  Warning: 'Leaf' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.709] 42:3  Warning: 'Award' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.709] 43:3  Warning: 'Globe' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.709] 44:3  Warning: 'Phone' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.709] 45:3  Warning: 'Mail' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.709] 46:3  Warning: 'Building' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.709] 47:3  Warning: 'Navigation' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.709] 48:3  Warning: 'Zap' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.709] 50:3  Warning: 'CheckCircle2' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.709] 56:8  Warning: 'Image' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.709] 150:6  Warning: React Hook useEffect has a missing dependency: 'loadScanHistory'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.709] 156:54  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.709] 194:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.709] 227:32  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.710] 228:30  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.710] 229:30  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.710] 230:31  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.710] 254:27  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.711] 264:29  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.711] 306:43  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.711] 312:48  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.711] 326:43  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.711] 332:49  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.711] 385:9  Warning: 'getStatusColor' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.711] 397:9  Warning: 'getStatusIcon' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.712] 637:29  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[17:19:56.712] 637:42  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[17:19:56.712] 726:73  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.712] 
[17:19:56.712] ./app/dashboard/shipments/[shipmentId]/page.tsx
[17:19:56.712] 10:60  Warning: 'DialogTrigger' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.712] 26:3  Warning: 'User' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.712] 28:3  Warning: 'Mail' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.712] 53:10  Warning: 'showDeliveryConfirm' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.712] 54:10  Warning: 'showIssueReport' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.712] 125:9  Warning: 'handleDeliveryConfirm' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.712] 125:47  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.712] 135:9  Warning: 'handleIssueReport' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.712] 137:53  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.712] 
[17:19:56.712] ./app/dashboard/shipments/create/page.tsx
[17:19:56.712] 18:3  Warning: 'Calendar' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.712] 63:11  Warning: 'createShipment' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.712] 63:27  Warning: 'loading' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.712] 76:6  Warning: React Hook useEffect has a missing dependency: 'fetchOrders'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.712] 94:63  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.712] 95:46  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.712] 99:56  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.712] 108:48  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.712] 146:63  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.712] 153:67  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.712] 159:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.712] 171:44  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.712] 250:30  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.712] 
[17:19:56.712] ./app/dashboard/shipments/page.tsx
[17:19:56.712] 9:10  Warning: 'Badge' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.712] 22:3  Warning: 'CheckCircle' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.712] 37:11  Warning: 'toast' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.713] 57:66  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.713] 74:9  Warning: 'getStatusColor' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.713] 
[17:19:56.713] ./app/dashboard/weather/page.tsx
[17:19:56.713] 7:10  Warning: 'Select' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.713] 7:18  Warning: 'SelectContent' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.713] 7:33  Warning: 'SelectItem' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.713] 7:45  Warning: 'SelectTrigger' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.713] 7:60  Warning: 'SelectValue' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.713] 10:10  Warning: 'apiService' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.715] 21:3  Warning: 'Navigation' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.715] 27:3  Warning: 'Download' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.715] 29:3  Warning: 'Crop' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.715] 32:3  Warning: 'Umbrella' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.715] 121:20  Warning: 'setLocation' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.715] 126:6  Warning: React Hook useEffect has a missing dependency: 'fetchWeatherData'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.715] 
[17:19:56.715] ./app/debug/page.tsx
[17:19:56.715] 26:15  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.715] 46:14  Warning: 'e' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.715] 96:14  Warning: 'e' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.716] 141:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.716] 171:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.716] 
[17:19:56.716] ./app/finance/credit-score/page.tsx
[17:19:56.716] 25:23  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.716] 27:30  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.716] 
[17:19:56.716] ./app/finance/loans/apply/page.tsx
[17:19:56.716] 70:23  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.716] 
[17:19:56.716] ./app/finance/loans/page.tsx
[17:19:56.716] 36:6  Warning: React Hook useEffect has a missing dependency: 'fetchLoans'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.716] 41:13  Warning: 'params' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.716] 46:23  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.716] 51:29  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.716] 
[17:19:56.723] ./app/forgot-password/page.tsx
[17:19:56.723] 25:19  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.723] 
[17:19:56.723] ./app/harvests/[id]/edit/page.tsx
[17:19:56.723] 25:6  Warning: React Hook useEffect has a missing dependency: 'fetchHarvestData'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.723] 31:36  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.723] 31:66  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.723] 97:56  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.723] 122:32  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.723] 
[17:19:56.723] ./app/harvests/[id]/page.tsx
[17:19:56.723] 14:15  Warning: 'Harvest' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.723] 21:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.724] 34:6  Warning: React Hook useEffect has missing dependencies: 'fetchHarvest' and 'generateQRCode'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.724] 39:30  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.724] 39:63  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.724] 39:102  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.724] 50:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.724] 74:9  Warning: 'handleListOnMarketplace' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.724] 79:25  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.724] 83:73  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.724] 111:60  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.724] 111:81  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.724] 431:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.724] 433:29  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.724] 
[17:19:56.724] ./app/harvests/new/page.tsx
[17:19:56.724] 43:56  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.724] 57:36  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.725] 57:66  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.725] 57:102  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.725] 70:32  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.725] 
[17:19:56.725] ./app/harvests/page.tsx
[17:19:56.725] 4:34  Warning: 'MapPin' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.725] 4:42  Warning: 'QrCode' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.725] 4:50  Warning: 'Eye' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.725] 4:55  Warning: 'Edit' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.725] 4:61  Warning: 'Trash2' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.725] 7:29  Warning: 'CardHeader' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.725] 8:10  Warning: 'Badge' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.725] 10:10  Warning: 'Dialog' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.725] 10:18  Warning: 'DialogContent' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.725] 10:33  Warning: 'DialogHeader' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.725] 10:47  Warning: 'DialogTitle' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.725] 10:60  Warning: 'DialogTrigger' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.725] 15:8  Warning: 'Image' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.725] 27:6  Warning: React Hook useEffect has a missing dependency: 'fetchHarvests'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.725] 38:23  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.725] 53:9  Warning: 'getStatusColor' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.725] 69:9  Warning: 'handleDeleteHarvest' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.725] 72:55  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.726] 72:73  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.726] 81:30  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.726] 81:54  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.726] 82:31  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.726] 82:62  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.726] 84:28  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.726] 85:41  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.726] 85:66  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.726] 89:28  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.726] 90:27  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.726] 91:27  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.726] 92:26  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.726] 93:28  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.726] 94:36  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.726] 95:26  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.726] 182:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.726] 182:57  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.726] 
[17:19:56.726] ./app/layout.tsx
[17:19:56.726] 70:9  Error: Synchronous scripts should not be used. See: https://nextjs.org/docs/messages/no-sync-scripts  @next/next/no-sync-scripts
[17:19:56.726] 
[17:19:56.726] ./app/marketplace/cart/page.tsx
[17:19:56.728] 24:10  Warning: 'loading' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.728] 24:19  Warning: 'setLoading' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.728] 25:64  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.728] 61:28  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.728] 82:9  Warning: 'tax' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.728] 97:9  Warning: 'handleClearCart' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.728] 
[17:19:56.728] ./app/marketplace/checkout/page.tsx
[17:19:56.728] 19:33  Warning: 'getAllShippingOptions' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.728] 26:17  Warning: 'createOrder' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.728] 31:10  Warning: 'paymentProvider' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.728] 173:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.728] 234:88  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.728] 283:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.728] 339:88  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.728] 388:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.728] 695:27  Warning: 'shippingCost' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.728] 
[17:19:56.728] ./app/marketplace/order-success/[orderId]/page.tsx
[17:19:56.728] 71:9  Warning: 'paymentMethod' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.728] 84:14  Warning: 'err' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.728] 117:37  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.728] 135:23  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.728] 398:21  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.728] 414:61  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.728] 
[17:19:56.728] ./app/marketplace/page.tsx
[17:19:56.728] 4:38  Warning: 'MapPin' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.728] 4:46  Warning: 'Star' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.728] 4:52  Warning: 'Heart' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.728] 4:59  Warning: 'ShoppingCart' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.728] 7:16  Warning: 'CardContent' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.728] 7:29  Warning: 'CardFooter' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.728] 7:41  Warning: 'CardHeader' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.728] 8:10  Warning: 'Badge' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.728] 20:8  Warning: 'Image' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.728] 38:11  Warning: 'user' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.728] 71:6  Warning: React Hook useEffect has missing dependencies: 'fetchProducts' and 'products.length'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.728] 85:29  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.728] 86:31  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.728] 87:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.728] 88:44  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.729] 96:6  Warning: React Hook useEffect has a missing dependency: 'fetchProducts'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.729] 112:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.729] 160:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.729] 163:66  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.729] 172:56  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.729] 216:48  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.729] 219:25  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.729] 230:27  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.729] 231:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.729] 232:33  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.729] 234:29  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.729] 235:30  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.729] 236:30  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.729] 237:31  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.729] 238:33  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.729] 239:33  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.729] 240:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.729] 247:39  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.729] 257:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.729] 258:36  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.729] 285:45  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.729] 285:83  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.729] 285:112  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.729] 289:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.729] 290:33  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.729] 291:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.729] 297:58  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.729] 298:32  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.729] 315:30  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.729] 316:25  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.729] 317:29  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.729] 318:28  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.729] 320:26  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.729] 321:25  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.730] 322:29  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 323:38  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 324:28  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 325:26  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 326:28  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 327:41  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 328:29  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 330:25  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 331:27  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 332:29  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 333:29  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 334:31  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 335:31  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 337:27  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 337:54  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 340:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 342:32  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 343:27  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 344:36  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 346:27  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 347:32  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 348:27  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 349:25  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 540:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 540:57  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 
[17:19:56.731] ./app/marketplace/products/[id]/page.tsx
[17:19:56.731] 18:15  Warning: 'Product' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.731] 30:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 36:48  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 46:6  Warning: React Hook useEffect has missing dependencies: 'fetchProduct', 'fetchReviews', and 'fetchUserOrders'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.731] 51:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 85:33  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 97:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 107:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 107:69  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 109:52  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 110:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 149:29  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 150:31  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 151:28  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 152:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 152:78  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 199:60  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.731] 199:81  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.731] 226:41  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.731] 226:78  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.732] 230:28  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.732] 240:57  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.732] 259:39  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.732] 259:76  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.732] 274:62  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.733] 290:37  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.734] 291:33  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.734] 292:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.734] 292:82  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.734] 293:36  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.734] 293:77  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.734] 302:50  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.734] 562:60  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.734] 
[17:19:56.734] ./app/offline/page.tsx
[17:19:56.734] 20:45  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.734] 22:30  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.734] 22:68  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.734] 34:47  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.734] 58:57  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.734] 
[17:19:56.734] ./app/partners/bulk-onboard/page.tsx
[17:19:56.734] 59:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.735] 
[17:19:56.735] ./app/partners/page.tsx
[17:19:56.735] 14:17  Warning: 'Plus' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.735] 14:83  Warning: 'Bell' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.735] 67:11  Warning: 'unreadCount' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.735] 80:38  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.735] 258:50  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.735] 468:131  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.735] 468:179  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.735] 
[17:19:56.735] ./app/payment/verify/page.tsx
[17:19:56.735] 7:29  Warning: 'CardHeader' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.736] 7:41  Warning: 'CardTitle' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.736] 14:17  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.736] 15:18  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.736] 46:15  Warning: 'verifyUrl' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.736] 55:49  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.736] 56:47  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.736] 66:47  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.736] 99:53  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.736] 119:53  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.736] 144:51  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.736] 165:49  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.736] 206:60  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.736] 207:23  Warning: 'orderData' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.736] 207:58  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.736] 215:56  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.737] 267:23  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.737] 288:6  Warning: React Hook useEffect has a missing dependency: 'testMode'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.737] 
[17:19:56.737] ./app/reset-password/page.tsx
[17:19:56.737] 34:19  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.737] 
[17:19:56.737] ./app/test-google-auth/page.tsx
[17:19:56.737] 8:10  Warning: 'apiService' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.737] 17:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.737] 33:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.737] 
[17:19:56.737] ./app/verify/[batchId]/page.tsx
[17:19:56.737] 4:29  Warning: 'CardDescription' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.737] 22:3  Warning: 'Globe' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.737] 29:3  Warning: 'ExternalLink' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.737] 30:3  Warning: 'Star' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.737] 86:6  Warning: React Hook useEffect has a missing dependency: 'fetchVerificationData'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.737] 98:46  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.737] 155:9  Warning: 'getStatusColor' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.737] 167:9  Warning: 'getStatusIcon' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.737] 462:56  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.737] 
[17:19:56.737] ./app/verify-email/error.tsx
[17:19:56.737] 6:34  Warning: 'Mail' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.737] 
[17:19:56.737] ./app/verify-email/page.tsx
[17:19:56.737] 76:13  Warning: 'response' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.737] 88:19  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.738] 112:19  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.738] 228:20  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.738] 231:46  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.738] 
[17:19:56.738] ./components/agricultural/analytics-dashboard.tsx
[17:19:56.738] 5:10  Warning: 'Badge' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.738] 16:3  Warning: 'Calendar' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.738] 22:3  Warning: 'Eye' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.738] 23:3  Warning: 'Filter' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.738] 40:18  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.739] 126:10  Warning: 'selectedMetric' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.739] 126:26  Warning: 'setSelectedMetric' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.739] 245:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.739] 341:50  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.740] 350:49  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.740] 372:49  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.740] 401:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.740] 502:49  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.740] 
[17:19:56.740] ./components/agricultural/harvest-analytics.tsx
[17:19:56.740] 11:3  Warning: 'TrendingDown' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.740] 12:3  Warning: 'Calendar' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.741] 15:3  Warning: 'Leaf' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.741] 22:3  Warning: 'Clock' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.741] 77:6  Warning: React Hook useEffect has a missing dependency: 'fetchAnalytics'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.741] 96:31  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.741] 97:38  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.741] 98:31  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.741] 99:38  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.741] 108:85  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.741] 371:55  Warning: 'index' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.741] 
[17:19:56.741] ./components/agricultural/harvest-card.tsx
[17:19:56.741] 174:94  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.741] 174:143  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.741] 
[17:19:56.741] ./components/agricultural/harvest-form.tsx
[17:19:56.741] 19:10  Warning: 'Progress' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.741] 24:3  Warning: 'Scale' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.742] 25:3  Warning: 'Thermometer' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.742] 26:3  Warning: 'Camera' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.742] 116:10  Warning: 'uploadingImages' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.742] 185:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.742] 852:25  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[17:19:56.742] 
[17:19:56.742] ./components/agricultural/marketplace-card.tsx
[17:19:56.742] 4:29  Warning: 'CardDescription' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.742] 4:46  Warning: 'CardFooter' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.742] 4:58  Warning: 'CardHeader' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.742] 4:70  Warning: 'CardTitle' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.742] 7:34  Warning: 'AvatarImage' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.742] 8:10  Warning: 'Separator' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.742] 16:3  Warning: 'Calendar' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.742] 20:3  Warning: 'MessageCircle' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.742] 21:3  Warning: 'Share2' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.742] 22:3  Warning: 'QrCode' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.742] 76:7  Warning: 'qualityColors' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.742] 92:3  Warning: 'onAddToWishlist' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.742] 99:10  Warning: 'showQR' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.742] 99:18  Warning: 'setShowQR' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.742] 105:73  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.742] 133:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.742] 163:9  Warning: 'handleShare' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.742] 169:9  Warning: 'discount' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.742] 180:15  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[17:19:56.742] 210:113  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.742] 249:9  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[17:19:56.742] 311:123  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.742] 
[17:19:56.742] ./components/agricultural/qr-scanner.tsx
[17:19:56.742] 8:79  Warning: 'DialogTrigger' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.742] 19:3  Warning: 'Info' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.742] 20:3  Warning: 'X' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.742] 29:17  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.742] 34:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.742] 50:64  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.742] 51:10  Warning: 'showScanner' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.742] 
[17:19:56.742] ./components/analytics/admin-analytics.tsx
[17:19:56.742] 5:10  Warning: 'Badge' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.742] 12:3  Warning: 'TrendingDown' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.742] 16:3  Warning: 'Calendar' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.742] 25:3  Warning: 'Globe' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.742] 26:3  Warning: 'AlertTriangle' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.742] 27:3  Warning: 'CheckCircle' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.742] 30:3  Warning: 'LineChart' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.742] 32:3  Warning: 'AreaChart' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.742] 71:11  Warning: 'ChartData' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.742] 74:18  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.742] 78:18  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.742] 79:15  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.742] 80:18  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.743] 81:18  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.743] 85:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.743] 86:15  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.746] 87:17  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.746] 88:13  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.746] 92:17  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.746] 96:24  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.746] 97:18  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.746] 98:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.746] 99:20  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.746] 116:6  Warning: React Hook useEffect has a missing dependency: 'fetchAllAnalytics'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.746] 130:54  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.746] 151:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.746] 191:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.746] 191:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.746] 233:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.746] 282:78  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.746] 284:55  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.746] 310:60  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.746] 430:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.747] 551:51  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.747] 551:56  Warning: 'name' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.747] 578:66  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.747] 635:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.747] 
[17:19:56.747] ./components/analytics/analytics-dashboard.tsx
[17:19:56.747] 3:20  Warning: 'useEffect' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.747] 12:3  Warning: 'BarChart3' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.747] 18:3  Warning: 'Calendar' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.747] 25:3  Warning: 'Globe' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.747] 26:3  Warning: 'PieChart' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.747] 27:3  Warning: 'LineChart' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.747] 28:3  Warning: 'BarChart' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.747] 29:3  Warning: 'Filter' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.747] 30:3  Warning: 'Search' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.747] 33:3  Warning: 'XCircle' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.747] 54:5  Warning: 'clearCache' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.747] 102:9  Warning: 'getPerformanceBadge' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.747] 334:116  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.747] 334:167  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.747] 
[17:19:56.747] ./components/analytics/buyer-analytics.tsx
[17:19:56.747] 11:3  Warning: 'TrendingDown' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.747] 14:3  Warning: 'Heart' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.747] 15:3  Warning: 'Calendar' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.747] 20:3  Warning: 'MapPin' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.747] 24:3  Warning: 'Truck' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.747] 25:3  Warning: 'AlertCircle' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.747] 27:3  Warning: 'XCircle' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.747] 31:10  Warning: 'cn' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.747] 74:11  Warning: 'ChartData' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.747] 77:18  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.747] 92:43  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.747] 93:23  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.747] 117:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.747] 146:30  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.747] 170:9  Warning: 'prepareOrderStatusData' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.747] 246:60  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.747] 364:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.747] 487:51  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.747] 517:51  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.747] 559:56  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.747] 559:83  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.749] 568:51  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.749] 598:51  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.749] 639:68  Warning: 'index' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.749] 687:73  Warning: 'index' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.749] 
[17:19:56.749] ./components/analytics/farmer-analytics.tsx
[17:19:56.749] 12:3  Warning: 'TrendingDown' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.749] 16:3  Warning: 'Calendar' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.749] 22:3  Warning: 'MapPin' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.749] 23:3  Warning: 'QrCode' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.749] 27:3  Warning: 'Clock' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.749] 77:11  Warning: 'ChartData' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.749] 80:18  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.749] 109:43  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.749] 114:37  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.749] 115:43  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.749] 116:50  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.749] 122:49  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.750] 123:52  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.750] 125:52  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.750] 127:52  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.750] 127:98  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.750] 128:52  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.750] 128:97  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.750] 143:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.750] 210:30  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.752] 215:9  Warning: 'renderChart' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.752] 215:49  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.752] 417:62  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.752] 428:65  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.752] 615:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.752] 765:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.760] 810:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.760] 862:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.761] 937:54  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.761] 937:78  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.761] 953:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.761] 994:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.761] 1124:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.761] 
[17:19:56.761] ./components/analytics/partner-analytics.tsx
[17:19:56.761] 11:3  Warning: 'TrendingDown' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.761] 14:3  Warning: 'Handshake' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.761] 15:3  Warning: 'Calendar' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.761] 27:27  Warning: 'AreaChart' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.761] 29:10  Warning: 'cn' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.761] 103:11  Warning: 'ChartData' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.772] 106:18  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.773] 132:23  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.773] 159:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.773] 178:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.773] 204:30  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.773] 248:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.773] 331:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.773] 388:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.773] 442:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.773] 503:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.773] 618:60  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.773] 740:29  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.774] 835:62  Warning: 'index' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.774] 921:68  Warning: 'index' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.774] 
[17:19:56.774] ./components/approvals/approvals-dashboard.tsx
[17:19:56.774] 16:10  Warning: 'approvalsService' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.774] 37:3  Warning: 'Upload' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.774] 38:3  Warning: 'Users' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.774] 39:3  Warning: 'TrendingUp' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.774] 62:11  Warning: 'user' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.775] 70:5  Warning: 'filters' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.775] 75:5  Warning: 'markForReview' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.775] 142:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.775] 189:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.775] 246:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.775] 558:145  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.775] 558:195  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.775] 716:161  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.775] 716:219  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.775] 736:23  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[17:19:56.775] 
[17:19:56.775] ./components/auth/login-form.tsx
[17:19:56.775] 46:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.775] 186:52  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.775] 
[17:19:56.775] ./components/auth/register-form.tsx
[17:19:56.775] 148:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.775] 205:64  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.775] 
[17:19:56.775] ./components/dashboard/admin-dashboard.tsx
[17:19:56.775] 19:38  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.775] 20:52  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.775] 21:50  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.775] 41:63  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.775] 91:63  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.775] 113:61  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.775] 122:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.775] 144:6  Warning: React Hook useCallback has a missing dependency: 'stats?.totalUsers'. Either include it or remove the dependency array. You can also replace multiple useState variables with useReducer if 'setSystemHealth' needs the current value of 'stats.totalUsers'.  react-hooks/exhaustive-deps
[17:19:56.775] 147:11  Warning: 'refresh' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.775] 164:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.775] 
[17:19:56.775] ./components/dashboard/buyer-dashboard.tsx
[17:19:56.775] 7:10  Warning: 'Input' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.775] 18:8  Warning: 'Image' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.775] 33:52  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.776] 34:60  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.776] 42:69  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.776] 96:6  Warning: React Hook useCallback has a missing dependency: 'fetchDashboardData'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.776] 126:47  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.776] 127:46  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.776] 128:53  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.776] 129:48  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.776] 130:52  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.776] 131:48  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.776] 132:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.776] 133:45  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.776] 154:37  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.776] 155:36  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.776] 156:36  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.776] 167:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.776] 193:11  Warning: 'refresh' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.776] 200:6  Warning: React Hook useEffect has a missing dependency: 'fetchDashboardData'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.776] 211:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.776] 254:49  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.776] 316:25  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.776] 370:66  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.776] 370:73  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.776] 436:22  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.776] 
[17:19:56.776] ./components/dashboard/dashboard-layout.tsx
[17:19:56.776] 37:3  Warning: 'ChevronRight' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.776] 
[17:19:56.776] ./components/dashboard/farmer-dashboard.tsx
[17:19:56.776] 15:58  Warning: 'QrCode' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.776] 38:56  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.776] 43:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.776] 63:63  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.776] 78:56  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.776] 98:45  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.776] 99:45  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.776] 100:33  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.776] 100:70  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.776] 102:43  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.776] 103:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.776] 111:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.779] 136:11  Warning: 'refresh' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.779] 153:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.779] 196:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.779] 209:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.780] 
[17:19:56.780] ./components/dashboard/partner-dashboard.tsx
[17:19:56.780] 15:47  Warning: 'UserPlus' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.780] 15:79  Warning: 'Upload' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.780] 20:54  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.780] 21:50  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.780] 22:56  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.782] 23:50  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.782] 34:55  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.782] 38:29  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.782] 80:17  Warning: 'lastCommissionUpdate' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.782] 81:12  Warning: 'commissionError' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.782] 207:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.783] 228:11  Warning: 'refresh' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.783] 530:75  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.783] 575:64  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.783] 
[17:19:56.783] ./components/dashboard/recent-activity.tsx
[17:19:56.783] 17:14  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.783] 44:23  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.783] 81:6  Warning: React Hook useEffect has a missing dependency: 'toast'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.783] 
[17:19:56.783] ./components/dashboard/user-management.tsx
[17:19:56.783] 13:10  Warning: 'Textarea' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.783] 21:3  Warning: 'MoreHorizontal' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.783] 35:3  Warning: 'AlertTriangle' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.783] 39:3  Warning: 'Mail' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.783] 40:3  Warning: 'Phone' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.784] 41:3  Warning: 'MapPin' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.784] 42:3  Warning: 'Calendar' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.784] 43:3  Warning: 'Activity' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.785] 44:3  Warning: 'TrendingUp' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.786] 45:3  Warning: 'Banknote' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.786] 46:3  Warning: 'Package' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.786] 47:3  Warning: 'Settings' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.786] 48:3  Warning: 'MoreVertical' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.786] 50:8  Warning: 'Link' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.787] 79:15  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.787] 80:17  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.787] 81:14  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.787] 117:23  Warning: 'setCurrentPage' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.787] 138:6  Warning: React Hook useEffect has a missing dependency: 'fetchUsers'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.787] 142:6  Warning: React Hook useEffect has a missing dependency: 'applyFilters'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.787] 155:45  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.787] 161:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.787] 300:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.787] 328:11  Warning: 'response' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.787] 342:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.787] 
[17:19:56.787] ./components/dashboard/weather-widget.tsx
[17:19:56.787] 14:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.787] 15:44  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.787] 18:10  Warning: 'currentLocation' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.788] 25:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.788] 119:27  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.788] 194:39  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.788] 194:77  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.788] 194:117  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.788] 199:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.788] 199:82  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.788] 200:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.788] 201:51  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.788] 204:46  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.788] 205:24  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.788] 207:37  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.788] 215:23  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.788] 278:6  Warning: React Hook useEffect has missing dependencies: 'isLoading', 'requestLocation', and 'user'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.788] 305:25  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.788] 343:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.789] 591:37  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.789] 
[17:19:56.789] ./components/debug/websocket-test.tsx
[17:19:56.789] 76:48  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.789] 81:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.789] 108:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.789] 126:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.789] 239:63  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[17:19:56.789] 239:71  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[17:19:56.789] 
[17:19:56.789] ./components/dialogs/commission-details-dialog.tsx
[17:19:56.789] 3:10  Warning: 'useState' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.789] 7:29  Warning: 'CardDescription' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.789] 14:3  Warning: 'TrendingUp' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.789] 23:15  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.789] 
[17:19:56.789] ./components/dialogs/commission-payout-dialog.tsx
[17:19:56.789] 10:29  Warning: 'CardDescription' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.790] 18:23  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.790] 104:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.790] 
[17:19:56.790] ./components/dialogs/price-alert-dialog.tsx
[17:19:56.790] 120:9  Warning: 'getAlertTypeIcon' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.790] 
[17:19:56.790] ./components/dialogs/referral-dialog.tsx
[17:19:56.790] 8:10  Warning: 'Select' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.790] 8:18  Warning: 'SelectContent' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.790] 8:33  Warning: 'SelectItem' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.790] 8:45  Warning: 'SelectTrigger' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.790] 8:60  Warning: 'SelectValue' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.790] 18:14  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.790] 138:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.790] 
[17:19:56.790] ./components/dialogs/referral-status-dialog.tsx
[17:19:56.790] 16:13  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.790] 53:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.790] 72:59  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.790] 
[17:19:56.790] ./components/layout/footer.tsx
[17:19:56.791] 30:22  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.791] 
[17:19:56.791] ./components/notifications/notification-bell.tsx
[17:19:56.791] 3:20  Warning: 'useRef' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.791] 3:28  Warning: 'useEffect' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.791] 4:16  Warning: 'Check' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.791] 4:35  Warning: 'Trash2' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.791] 9:10  Warning: 'Separator' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.791] 13:3  Warning: 'DropdownMenuItem' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.791] 14:3  Warning: 'DropdownMenuLabel' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.791] 15:3  Warning: 'DropdownMenuSeparator' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.791] 60:9  Warning: 'getNotificationColor' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.791] 88:50  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.791] 98:9  Warning: 'handleMarkAsRead' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.791] 103:9  Warning: 'handleDeleteNotification' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.791] 185:23  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.791] 
[17:19:56.792] ./components/notifications/notification-list.tsx
[17:19:56.792] 4:73  Warning: 'Filter' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.792] 22:5  Warning: 'fetchNotifications' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.792] 
[17:19:56.792] ./components/notifications/notification-provider.tsx
[17:19:56.792] 14:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.792] 14:50  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.792] 15:45  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.792] 16:48  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.792] 19:26  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.792] 
[17:19:56.792] ./components/notifications/notification-settings.tsx
[17:19:56.792] 68:6  Warning: React Hook useEffect has a missing dependency: 'loadPreferences'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.792] 
[17:19:56.792] ./components/onboarding/onboarding-analytics.tsx
[17:19:56.792] 8:3  Warning: 'TrendingDown' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.792] 21:18  Warning: 'onboardings' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.792] 
[17:19:56.793] ./components/onboarding/onboarding-list.tsx
[17:19:56.793] 12:3  Warning: 'Filter' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.793] 30:24  Warning: 'filters' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.793] 30:33  Warning: 'setFilters' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.793] 154:65  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.793] 178:144  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.793] 178:203  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.793] 
[17:19:56.793] ./components/onboarding/onboarding-overview.tsx
[17:19:56.793] 12:3  Warning: 'MapPin' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.793] 32:9  Warning: 'getNextActions' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.793] 150:136  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.793] 150:195  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.793] 214:138  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.793] 214:197  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.793] 
[17:19:56.793] ./components/onboarding/onboarding-portal.tsx
[17:19:56.793] 17:3  Warning: 'FileText' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.794] 19:3  Warning: 'Upload' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.794] 20:3  Warning: 'MessageSquare' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.794] 21:3  Warning: 'Settings' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.794] 22:3  Warning: 'BarChart3' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.794] 40:9  Warning: 'getStatusBadge' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.794] 
[17:19:56.794] ./components/onboarding/onboarding-templates.tsx
[17:19:56.794] 14:3  Warning: 'Settings' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.794] 
[17:19:56.794] ./components/onboarding/onboarding-workflow.tsx
[17:19:56.794] 8:3  Warning: 'Clock' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.794] 
[17:19:56.795] ./components/payment-verification-button.tsx
[17:19:56.795] 20:3  Warning: 'orderId' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.795] 89:26  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.795] 99:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.795] 132:57  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.795] 150:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.795] 
[17:19:56.795] ./components/profile/admin-profile.tsx
[17:19:56.795] 30:3  Warning: 'Upload' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.795] 31:3  Warning: 'Download' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.795] 157:6  Warning: React Hook useEffect has missing dependencies: 'fetchProfileData' and 'toast'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.795] 164:6  Warning: React Hook useEffect has a missing dependency: 'fetchProfileData'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.795] 254:60  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.795] 290:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.795] 370:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.796] 420:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.796] 497:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.796] 514:52  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.796] 521:69  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.796] 560:55  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.796] 624:29  Warning: 'e' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.797] 
[17:19:56.797] ./components/profile/buyer-profile-form.tsx
[17:19:56.797] 9:10  Warning: 'Avatar' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.797] 9:18  Warning: 'AvatarFallback' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.797] 9:34  Warning: 'AvatarImage' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.797] 20:3  Warning: 'Camera' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.797] 76:6  Warning: React Hook useEffect has a missing dependency: 'fetchProfile'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.797] 84:46  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.798] 127:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.798] 165:37  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.798] 167:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.798] 168:36  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.798] 169:36  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.798] 170:38  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.798] 178:37  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.798] 179:38  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.798] 180:38  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.798] 181:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.798] 195:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.798] 
[17:19:56.799] ./components/profile/buyer-profile.tsx
[17:19:56.799] 81:6  Warning: React Hook useEffect has a missing dependency: 'fetchProfile'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.799] 90:37  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.799] 91:38  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.799] 115:50  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.799] 122:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.799] 140:52  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.799] 147:69  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.799] 153:52  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.799] 
[17:19:56.799] ./components/profile/buyer-settings-form.tsx
[17:19:56.799] 28:3  Warning: 'Upload' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.799] 29:3  Warning: 'Camera' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.800] 133:6  Warning: React Hook useEffect has a missing dependency: 'loadSettings'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.800] 141:39  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.800] 159:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.800] 241:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.800] 296:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.800] 321:37  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.800] 328:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.800] 711:46  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.800] 
[17:19:56.800] ./components/profile/farmer-profile.tsx
[17:19:56.800] 10:10  Warning: 'Avatar' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.800] 10:18  Warning: 'AvatarFallback' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.800] 10:34  Warning: 'AvatarImage' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.801] 101:6  Warning: React Hook useEffect has a missing dependency: 'fetchProfile'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.801] 142:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.801] 160:52  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.801] 170:69  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.801] 
[17:19:56.801] ./components/profile/partner-profile.tsx
[17:19:56.801] 10:10  Warning: 'Avatar' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.801] 10:18  Warning: 'AvatarFallback' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.801] 10:34  Warning: 'AvatarImage' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.801] 11:10  Warning: 'Separator' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.801] 85:6  Warning: React Hook useEffect has a missing dependency: 'fetchProfile'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.801] 93:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.801] 114:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.801] 130:52  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.802] 137:69  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.802] 
[17:19:56.802] ./components/profile/profile-form.tsx
[17:19:56.802] 10:10  Warning: 'Avatar' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.802] 10:18  Warning: 'AvatarFallback' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.802] 10:34  Warning: 'AvatarImage' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.802] 23:3  Warning: 'Camera' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.802] 91:19  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.802] 106:6  Warning: React Hook useEffect has a missing dependency: 'fetchProfile'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.802] 116:46  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.802] 155:39  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.802] 192:37  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.802] 197:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.802] 216:23  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.803] 268:49  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.803] 269:53  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.803] 272:33  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.803] 309:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.803] 325:58  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.803] 327:60  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.803] 589:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.803] 722:6  Warning: React Hook useEffect has a missing dependency: 'fetchFarmerProfile'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.803] 735:53  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.803] 761:46  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.803] 762:46  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.803] 763:44  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.804] 764:45  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.804] 775:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.804] 819:37  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.804] 821:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.804] 822:36  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.804] 823:36  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.804] 835:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.804] 1217:65  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.804] 
[17:19:56.804] ./components/profile/profile-settings.tsx
[17:19:56.804] 20:3  Warning: 'Settings' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.804] 23:3  Warning: 'CreditCard' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.804] 25:3  Warning: 'Phone' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.805] 26:3  Warning: 'Mail' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.805] 28:3  Warning: 'Globe' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.805] 31:3  Warning: 'Camera' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.805] 94:11  Warning: 'user' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.805] 109:6  Warning: React Hook useEffect has a missing dependency: 'fetchProfile'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.805] 118:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.805] 136:37  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.805] 144:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.805] 183:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.805] 517:44  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.805] 
[17:19:56.805] ./components/profile/settings-form.tsx
[17:19:56.805] 27:3  Warning: 'MapPin' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.805] 29:3  Warning: 'Banknote' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.806] 140:6  Warning: React Hook useEffect has a missing dependency: 'loadSettings'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.806] 154:29  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.806] 155:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.806] 156:33  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.806] 157:30  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.806] 159:29  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.806] 170:70  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.806] 172:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.811] 268:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.811] 324:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.811] 350:37  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.812] 358:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.812] 413:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.812] 477:21  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[17:19:56.812] 483:21  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[17:19:56.812] 
[17:19:56.812] ./components/qr-generator.tsx
[17:19:56.812] 3:20  Warning: 'useEffect' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.812] 8:10  Warning: 'Textarea' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.812] 72:13  Warning: 'qrString' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.812] 179:15  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[17:19:56.813] 
[17:19:56.813] ./components/reviews/review-form.tsx
[17:19:56.813] 9:24  Warning: 'Upload' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.813] 81:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.813] 231:23  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[17:19:56.813] 
[17:19:56.813] ./components/reviews/review-list.tsx
[17:19:56.813] 69:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.813] 78:33  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.813] 79:32  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.813] 80:38  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.813] 98:6  Warning: React Hook useEffect has a missing dependency: 'fetchReviews'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.813] 116:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.813] 280:27  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[17:19:56.814] 
[17:19:56.815] ./components/sections/about.tsx
[17:19:56.815] 34:24  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.815] 44:19  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.815] 81:19  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[17:19:56.816] 82:59  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[17:19:56.816] 
[17:19:56.816] ./components/sections/cta.tsx
[17:19:56.816] 12:36  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.816] 15:26  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.816] 
[17:19:56.816] ./components/sections/features.tsx
[17:19:56.816] 53:66  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.816] 
[17:19:56.816] ./components/sections/hero.tsx
[17:19:56.816] 22:73  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.816] 
[17:19:56.816] ./components/sections/marketplace-preview.tsx
[17:19:56.817] 4:41  Warning: 'CardHeader' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.817] 57:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.817] 60:68  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.817] 90:28  Warning: 'productId' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.817] 113:50  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.817] 209:50  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.817] 222:51  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.817] 222:92  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.817] 271:65  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.817] 
[17:19:56.817] ./components/sections/testimonials.tsx
[17:19:56.817] 66:70  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[17:19:56.817] 66:92  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[17:19:56.818] 82:140  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.818] 82:193  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.818] 
[17:19:56.819] ./components/settings/admin-settings.tsx
[17:19:56.819] 5:10  Warning: 'Input' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.819] 10:10  Warning: 'Separator' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.819] 11:10  Warning: 'Badge' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.819] 15:10  Warning: 'LoadingSpinner' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.819] 17:3  Warning: 'Settings' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.819] 21:3  Warning: 'Upload' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.819] 22:3  Warning: 'Languages' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.819] 23:3  Warning: 'Palette' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.819] 24:3  Warning: 'Database' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.819] 25:3  Warning: 'AlertTriangle' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.819] 26:3  Warning: 'CheckCircle' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.819] 27:3  Warning: 'X' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.819] 29:3  Warning: 'RefreshCw' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.820] 30:3  Warning: 'Trash2' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.820] 31:3  Warning: 'FileText' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.820] 33:3  Warning: 'Cog' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.820] 34:3  Warning: 'Users' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.820] 97:7  Warning: 'timezones' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.820] 106:7  Warning: 'dateFormats' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.820] 118:7  Warning: 'reportFormats' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.820] 133:7  Warning: 'timeFormats' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.820] 142:10  Warning: 'importing' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.821] 142:21  Warning: 'setImporting' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.821] 149:6  Warning: React Hook useEffect has a missing dependency: 'fetchSettings'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.822] 218:31  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.822] 222:31  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.822] 226:31  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.822] 230:31  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.822] 234:31  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.822] 
[17:19:56.822] ./components/settings/buyer-settings.tsx
[17:19:56.822] 11:10  Warning: 'Badge' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.822] 17:3  Warning: 'Settings' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.822] 22:3  Warning: 'Upload' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.822] 26:3  Warning: 'Smartphone' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.822] 27:3  Warning: 'Mail' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.822] 28:3  Warning: 'Calendar' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.823] 29:3  Warning: 'Languages' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.823] 30:3  Warning: 'Palette' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.823] 32:3  Warning: 'AlertTriangle' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.823] 33:3  Warning: 'CheckCircle' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.823] 34:3  Warning: 'X' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.823] 36:3  Warning: 'RefreshCw' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.823] 37:3  Warning: 'Trash2' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.823] 38:3  Warning: 'FileText' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.823] 39:3  Warning: 'CreditCard' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.823] 40:3  Warning: 'UserCheck' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.823] 41:3  Warning: 'BellOff' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.823] 42:3  Warning: 'BellRing' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.823] 44:3  Warning: 'Truck' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.823] 45:3  Warning: 'Banknote' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.823] 46:3  Warning: 'Package' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.824] 47:3  Warning: 'Store' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.824] 48:3  Warning: 'TrendingUp' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.824] 129:7  Warning: 'dateFormats' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.824] 136:7  Warning: 'cropTypes' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.824] 141:7  Warning: 'qualityStandards' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.830] 147:7  Warning: 'paymentTerms' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.830] 152:7  Warning: 'deliveryPreferences' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.830] 166:10  Warning: 'importing' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.831] 166:21  Warning: 'setImporting' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.831] 173:6  Warning: React Hook useEffect has a missing dependency: 'fetchSettings'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.831] 
[17:19:56.831] ./components/settings/farmer-settings.tsx
[17:19:56.831] 54:7  Warning: 'timezones' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.831] 75:6  Warning: React Hook useEffect has a missing dependency: 'fetchSettings'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.831] 
[17:19:56.831] ./components/settings/partner-settings.tsx
[17:19:56.831] 11:10  Warning: 'Badge' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.831] 17:3  Warning: 'Settings' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.831] 22:3  Warning: 'Upload' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.831] 26:3  Warning: 'Smartphone' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.831] 27:3  Warning: 'Mail' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.831] 28:3  Warning: 'Calendar' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.831] 29:3  Warning: 'Languages' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.831] 30:3  Warning: 'Palette' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.831] 32:3  Warning: 'AlertTriangle' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.832] 33:3  Warning: 'CheckCircle' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.832] 34:3  Warning: 'X' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.832] 36:3  Warning: 'RefreshCw' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.832] 37:3  Warning: 'Trash2' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.832] 38:3  Warning: 'FileText' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.832] 39:3  Warning: 'CreditCard' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.832] 40:3  Warning: 'UserCheck' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.832] 41:3  Warning: 'BellOff' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.832] 42:3  Warning: 'BellRing' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.832] 43:3  Warning: 'Users' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.833] 45:3  Warning: 'Handshake' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.833] 46:3  Warning: 'Target' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.833] 47:3  Warning: 'BarChart3' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.833] 48:3  Warning: 'FileSpreadsheet' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.833] 121:7  Warning: 'timezones' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.833] 130:7  Warning: 'dateFormats' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.833] 147:7  Warning: 'reportFormats' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.833] 157:7  Warning: 'reportFrequencies' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.833] 171:10  Warning: 'importing' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.833] 171:21  Warning: 'setImporting' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.833] 178:6  Warning: React Hook useEffect has a missing dependency: 'fetchSettings'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.833] 251:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.833] 252:39  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.833] 280:14  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.833] 
[17:19:56.833] ./components/shipment/shipment-card.tsx
[17:19:56.833] 18:8  Warning: 'Link' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.833] 45:9  Warning: 'formatDate' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.833] 
[17:19:56.833] ./components/shipment/shipment-creation-form.tsx
[17:19:56.834] 43:15  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.834] 44:26  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.834] 63:26  Warning: 'isValid' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.834] 101:73  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.834] 113:71  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.834] 211:83  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.834] 
[17:19:56.834] ./components/shipment/shipment-tracking-timeline.tsx
[17:19:56.834] 24:3  Warning: 'currentStatus' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.834] 121:19  Warning: 'isCompleted' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.834] 
[17:19:56.834] ./components/shipment/shipment-tracking-widget.tsx
[17:19:56.834] 6:10  Warning: 'Badge' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.834] 8:10  Warning: 'useShipments' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.834] 11:10  Warning: 'ShipmentTrackingTimeline' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.834] 30:44  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.834] 38:6  Warning: React Hook useEffect has a missing dependency: 'fetchShipmentForOrder'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.834] 61:19  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.834] 77:9  Warning: 'formatPrice' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.834] 89:9  Warning: 'formatDate' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.834] 152:28  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.834] 
[17:19:56.835] ./components/system/system-management.tsx
[17:19:56.835] 15:79  Warning: 'DialogTrigger' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.835] 21:3  Warning: 'Shield' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.835] 29:3  Warning: 'Upload' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.835] 31:3  Warning: 'Trash2' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.835] 32:3  Warning: 'Play' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.835] 33:3  Warning: 'Pause' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.835] 35:3  Warning: 'HardDrive' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.835] 37:3  Warning: 'MemoryStick' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.835] 39:3  Warning: 'Lock' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.835] 40:3  Warning: 'Bell' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.835] 42:3  Warning: 'Calendar' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.835] 43:3  Warning: 'Clock' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.835] 44:3  Warning: 'User' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.835] 45:3  Warning: 'Info' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.835] 53:3  Warning: 'Filter' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.835] 54:3  Warning: 'Eye' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.835] 55:3  Warning: 'Power' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.835] 84:14  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.835] 88:16  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.836] 89:13  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.836] 90:13  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.836] 91:13  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.836] 92:11  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.836] 126:6  Warning: React Hook useEffect has a missing dependency: 'fetchSystemData'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.836] 136:6  Warning: React Hook useEffect has missing dependencies: 'fetchBackups', 'fetchSystemConfig', and 'fetchSystemLogs'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
[17:19:56.836] 141:30  Warning: 'healthResponse' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.836] 147:54  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.836] 149:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.836] 149:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.836] 170:41  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.836] 172:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.836] 172:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.836] 185:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.836] 187:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.836] 187:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.836] 200:38  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.836] 202:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.836] 202:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.836] 221:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.836] 221:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.836] 241:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.836] 241:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.837] 259:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.837] 259:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.837] 326:9  Warning: 'formatBytes' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.837] 735:53  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.837] 858:87  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.837] 
[17:19:56.837] ./components/ui/avatar-upload.tsx
[17:19:56.837] 96:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.837] 
[17:19:56.837] ./components/ui/chart.tsx
[17:19:56.837] 123:15  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.837] 124:13  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.837] 125:30  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.837] 127:25  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.837] 127:36  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.838] 266:15  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.838] 
[17:19:56.838] ./components/ui/offline-indicator.tsx
[17:19:56.838] 30:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.838] 56:64  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.838] 104:47  Warning: 'index' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.838] 170:16  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[17:19:56.838] 
[17:19:56.838] ./components/ui/textarea.tsx
[17:19:56.838] 5:18  Error: An interface declaring no members is equivalent to its supertype.  @typescript-eslint/no-empty-object-type
[17:19:56.838] 
[17:19:56.838] ./components/ui/toaster.tsx
[17:19:56.838] 4:39  Warning: 'AlertTriangle' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.838] 90:23  Warning: 'id' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.839] 
[17:19:56.839] ./components/ui/use-toast.ts
[17:19:56.839] 21:7  Warning: 'actionTypes' is assigned a value but only used as a type.  @typescript-eslint/no-unused-vars
[17:19:56.839] 
[17:19:56.839] ./lib/admin-api.ts
[17:19:56.839] 3:32  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.839] 54:20  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.839] 83:29  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.839] 83:74  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.839] 88:63  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.839] 92:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.839] 92:73  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.839] 99:79  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.839] 106:64  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.839] 112:62  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.839] 118:105  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.839] 125:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.839] 125:71  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.839] 132:32  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.839] 132:80  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.839] 137:69  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.839] 141:85  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.839] 148:84  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.839] 155:124  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.839] 162:38  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.839] 162:74  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.840] 169:32  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.840] 169:80  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.840] 174:69  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.840] 178:85  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.840] 185:84  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.847] 192:48  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.847] 192:79  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.847] 199:68  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.847] 205:38  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.847] 205:74  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.847] 212:32  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.847] 212:80  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.847] 217:69  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.847] 221:48  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.847] 221:79  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.847] 228:68  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.848] 234:30  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.848] 234:76  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.848] 239:65  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.849] 243:102  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.849] 250:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.849] 250:78  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.849] 257:58  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.849] 261:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.849] 261:86  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.849] 266:67  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.850] 266:98  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.850] 273:32  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.850] 273:80  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.850] 278:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.850] 278:76  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.850] 283:45  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.850] 283:76  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.850] 292:56  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.850] 296:61  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.850] 301:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.850] 301:73  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.850] 308:38  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.850] 325:53  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.850] 329:54  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.850] 333:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.850] 333:71  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.851] 340:31  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.851] 340:75  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.851] 345:51  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.851] 345:82  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.854] 352:53  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.854] 356:41  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.854] 356:72  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.854] 365:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.854] 365:82  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.854] 370:85  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.854] 377:84  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.854] 384:41  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.854] 384:77  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.854] 391:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.854] 391:81  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.854] 396:33  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.854] 396:80  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.854] 401:46  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.855] 401:77  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.855] 408:57  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.855] 414:53  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.855] 418:41  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.855] 418:72  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.855] 425:57  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.855] 429:37  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.855] 429:87  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.855] 
[17:19:56.855] ./lib/analytics-service.ts
[17:19:56.855] 197:38  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.855] 215:39  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.855] 219:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.855] 317:27  Warning: 'filters' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.855] 317:54  Warning: 'format' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.855] 
[17:19:56.855] ./lib/api.ts
[17:19:56.855] 14:30  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.855] 17:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.855] 73:49  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.855] 77:51  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.856] 93:7  Error: Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.  @typescript-eslint/ban-ts-comment
[17:19:56.856] 183:20  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.856] 259:23  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.856] 288:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.856] 347:14  Warning: 'e' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.856] 349:58  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.856] 355:50  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.856] 400:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.856] 412:47  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.856] 412:62  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.856] 412:81  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.856] 457:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.856] 468:39  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.856] 479:51  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.856] 490:47  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.856] 516:32  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.856] 525:43  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.856] 580:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.856] 590:37  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.856] 599:60  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.856] 632:46  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.857] 637:54  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.857] 661:43  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.857] 672:43  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.857] 685:46  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.857] 758:64  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.857] 772:70  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.857] 813:50  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.857] 880:61  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.857] 889:16  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.857] 894:12  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.857] 903:16  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.857] 908:12  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.857] 934:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.857] 947:54  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.857] 999:53  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.865] 1012:31  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.865] 1034:32  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.865] 1045:49  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.865] 1058:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.865] 1074:47  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.865] 1119:49  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.865] 1126:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.865] 1143:39  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.865] 1153:57  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.865] 1160:47  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.865] 1183:60  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.865] 1205:31  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.866] 1213:33  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.866] 1254:51  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.866] 1259:49  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.866] 1423:20  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.866] 1598:38  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.866] 1609:52  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.866] 1616:37  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.866] 1642:81  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.866] 1678:20  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.866] 1723:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.866] 1736:43  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.866] 1746:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.866] 1746:61  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.866] 1748:25  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.866] 1751:41  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.868] 1751:60  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.868] 1753:25  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.868] 1756:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.868] 1756:59  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.868] 1758:25  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.869] 1761:36  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.869] 1761:55  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.869] 1763:25  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.869] 1766:41  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.869] 1766:55  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.869] 1767:25  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.869] 1817:31  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.869] 1817:50  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.869] 1819:25  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.869] 1822:54  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.869] 1823:25  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.869] 1826:38  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.869] 1826:52  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.869] 1828:25  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.869] 1831:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.869] 1831:48  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.870] 1833:25  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.870] 1836:37  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.870] 1837:25  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.871] 1840:105  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.871] 1840:121  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.871] 1845:41  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.871] 1858:94  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.871] 1863:41  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.871] 1876:78  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.871] 1877:25  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.871] 1883:121  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.871] 1884:25  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.871] 1890:44  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.871] 1890:58  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.871] 1891:25  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.871] 1897:37  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.871] 1897:56  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.871] 1899:25  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.871] 1902:57  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.872] 1903:25  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.872] 1906:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.872] 1932:17  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.872] 1940:25  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.872] 1944:25  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.872] 1948:17  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.872] 1952:18  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.872] 1952:48  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.872] 1960:17  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.872] 1960:47  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.872] 1968:19  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.872] 1968:49  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.872] 1976:20  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.872] 1981:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.872] 2007:16  Warning: 'e' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.872] 
[17:19:56.872] ./lib/approvals-service.ts
[17:19:56.872] 6:3  Warning: 'ApprovalAction' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.873] 14:38  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.873] 32:39  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.873] 36:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.873] 55:20  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.873] 77:67  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.873] 112:26  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.873] 113:9  Warning: 'lastError' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.873] 186:24  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.873] 248:24  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.873] 291:12  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.873] 309:24  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.873] 352:12  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.873] 402:57  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.873] 424:46  Warning: 'format' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.873] 439:22  Error: A `require()` style import is forbidden.  @typescript-eslint/no-require-imports
[17:19:56.873] 536:19  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.873] 537:19  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.874] 
[17:19:56.874] ./lib/auth-config.ts
[17:19:56.874] 20:35  Warning: 'profile' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.874] 
[17:19:56.874] ./lib/auth.ts
[17:19:56.874] 22:32  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.874] 26:24  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.874] 49:36  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.874] 88:27  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.874] 88:46  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.874] 110:44  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.874] 125:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.874] 130:27  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.874] 130:46  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.874] 136:39  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.874] 193:27  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.875] 193:46  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.875] 
[17:19:56.875] ./lib/certificate-generator.ts
[17:19:56.875] 72:11  Warning: 'accentColor' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.875] 
[17:19:56.875] ./lib/commission-service.ts
[17:19:56.875] 35:14  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.875] 85:30  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.875] 100:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.875] 114:39  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.875] 125:107  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.875] 164:47  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.875] 178:37  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.875] 228:103  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.875] 228:119  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.876] 
[17:19:56.876] ./lib/export-utils.ts
[17:19:56.876] 1:10  Warning: 'useToast' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.876] 12:28  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.876] 43:54  Warning: 'contentType' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.876] 61:57  Warning: 'variant' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.876] 110:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.876] 167:52  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.876] 302:32  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.876] 338:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.876] 
[17:19:56.876] ./lib/flutterwave.ts
[17:19:56.876] 5:26  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.876] 68:17  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.876] 113:30  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.876] 198:16  Warning: 'parseError' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.876] 226:19  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.876] 
[17:19:56.876] ./lib/offline-cache.ts
[17:19:56.876] 10:45  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.876] 95:25  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.876] 99:18  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.876] 103:27  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.877] 107:19  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.877] 111:36  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.877] 115:29  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.877] 119:27  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.877] 123:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.877] 127:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.877] 131:16  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.877] 
[17:19:56.877] ./lib/onboarding-service.ts
[17:19:56.877] 13:38  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.877] 31:39  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.877] 35:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.877] 204:25  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.877] 252:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.877] 253:23  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.877] 274:18  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.877] 321:58  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.877] 367:58  Warning: 'format' is assigned a value but never used.  @typescript-eslint/no-unused-vars
[17:19:56.877] 
[17:19:56.877] ./lib/paystack.ts
[17:19:56.877] 5:18  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.877] 66:17  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.877] 96:30  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.877] 194:16  Warning: 'parseError' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.877] 222:19  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.877] 
[17:19:56.877] ./lib/referral-service.ts
[17:19:56.877] 95:30  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.877] 110:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.877] 124:39  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.877] 135:99  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.877] 186:61  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.877] 237:64  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.877] 
[17:19:56.877] ./lib/stores/analytics-store.ts
[17:19:56.877] 20:30  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.877] 26:54  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.877] 41:28  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.877] 81:60  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.877] 102:27  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.877] 122:27  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.877] 142:27  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.877] 162:27  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.877] 182:27  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.877] 206:27  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.877] 212:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.878] 224:27  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.878] 
[17:19:56.878] ./lib/token-refresh.ts
[17:19:56.878] 1:10  Warning: 'apiService' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.878] 
[17:19:56.878] ./lib/types/onboarding.ts
[17:19:56.878] 143:13  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.878] 
[17:19:56.878] ./lib/types/partners.ts
[17:19:56.878] 280:12  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.878] 419:13  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.878] 426:33  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.878] 433:29  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.878] 
[17:19:56.878] ./lib/types.ts
[17:19:56.878] 169:28  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.878] 201:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.878] 232:29  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[17:19:56.878] 
[17:19:56.878] ./lib/utils.ts
[17:19:56.878] 16:12  Warning: 'e' is defined but never used.  @typescript-eslint/no-unused-vars
[17:19:56.878] 
[17:19:56.878] info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/app/api-reference/config/eslint#disabling-rules
[17:19:56.878] npm error Lifecycle script `build` failed with error:
[17:19:56.878] npm error code 1
[17:19:56.878] npm error path /vercel/path0/client
[17:19:56.878] npm error workspace Grochain@0.1.0
[17:19:56.879] npm error location /vercel/path0/client
[17:19:56.879] npm error command failed
[17:19:56.879] npm error command sh -c next build
[17:19:56.879] Error: Command "npm run build" exited with 1