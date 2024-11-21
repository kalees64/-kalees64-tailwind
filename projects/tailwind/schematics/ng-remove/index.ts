import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

export function ngRemove(): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    // Remove Tailwind dependencies
    const packageJsonPath = 'package.json';
    if (tree.exists(packageJsonPath)) {
      const packageJson = JSON.parse(tree.read(packageJsonPath)!.toString());

      const dependencies = packageJson.dependencies || {};
      delete dependencies['tailwindcss'];
      delete dependencies['autoprefixer'];
      delete dependencies['postcss'];

      packageJson.dependencies = dependencies;
      tree.overwrite(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }

    // Remove Tailwind configuration files
    if (tree.exists('tailwind.config.js')) {
      tree.delete('tailwind.config.js');
    }
    if (tree.exists('postcss.config.js')) {
      tree.delete('postcss.config.js');
    }

    // Remove Tailwind directives from styles.css
    const stylesPath = 'src/styles.css';
    if (tree.exists(stylesPath)) {
      const stylesContent = tree.read(stylesPath)!.toString();
      const updatedContent = stylesContent
        .replace(/@tailwind base;\s*/, '')
        .replace(/@tailwind components;\s*/, '')
        .replace(/@tailwind utilities;\s*/, '');

      tree.overwrite(stylesPath, updatedContent.trim());
    }

    // Remove Tailwind from angular.json styles array
    const angularJsonPath = 'angular.json';
    if (tree.exists(angularJsonPath)) {
      const angularJson = JSON.parse(tree.read(angularJsonPath)!.toString());
      const projectName = Object.keys(angularJson.projects)[0];
      const stylesArray =
        angularJson.projects[projectName]?.architect?.build?.options?.styles ||
        [];

      angularJson.projects[projectName].architect.build.options.styles =
        stylesArray.filter(
          (style: string) => !style.includes('tailwind.config.js')
        );

      tree.overwrite(angularJsonPath, JSON.stringify(angularJson, null, 2));
    }

    return tree;
  };
}
