// analyze-deps.ts
import { Project } from "ts-morph";

const project = new Project({
  tsConfigFilePath: "./tsconfig.json",
});

const sourceFiles = project.getSourceFiles();

const usageMap: Record<string, Set<string>> = {};

for (const file of sourceFiles) {
  const imports = file.getImportDeclarations();

  for (const imp of imports) {
    const moduleSpecifier = imp.getModuleSpecifierValue();

    // ローカルファイルを除外
    if (moduleSpecifier.startsWith(".")) continue;

    const namedImports = imp.getNamedImports();

    if (!usageMap[moduleSpecifier]) usageMap[moduleSpecifier] = new Set();

    for (const namedImport of namedImports) {
      usageMap[moduleSpecifier].add(namedImport.getName());
    }
  }
}

for (const [lib, funcs] of Object.entries(usageMap)) {
  console.log(`📦 ${lib}:`);
  funcs.forEach((fn) => console.log(`  - ${fn}`));
}
