const fs = require('fs');
const path = require('path');

// Create the routes-manifest.json file that Vercel is looking for
const createRoutesManifest = () => {
  const outDir = path.join(process.cwd(), 'out');
  const routesManifestPath = path.join(outDir, 'routes-manifest.json');
  
  // Create a basic routes manifest
  const routesManifest = {
    version: 3,
    basePath: "",
    headers: [],
    redirects: [],
    rewrites: [],
    staticRoutes: [
      {
        page: "/",
        regex: "^/(?:/)?$"
      }
    ],
    dynamicRoutes: []
  };

  // Ensure the out directory exists
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Write the routes manifest file
  fs.writeFileSync(routesManifestPath, JSON.stringify(routesManifest, null, 2));
  console.log(`Created routes-manifest.json at ${routesManifestPath}`);
};

// Run the function
createRoutesManifest();
