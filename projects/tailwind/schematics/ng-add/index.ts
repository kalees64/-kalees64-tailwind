import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

export function ngAdd(_options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    // Update styles in angular.json
    const angularJsonPath = 'angular.json';
    if (tree.exists(angularJsonPath)) {
      const angularJson = JSON.parse(tree.read(angularJsonPath)!.toString());
      const projectName = Object.keys(angularJson.projects)[0];
      const stylesArray =
        angularJson.projects[projectName]?.architect?.build?.options?.styles ||
        [];

      if (!stylesArray.includes('src/styles.css')) {
        stylesArray.push('src/styles.css');
      }
      angularJson.projects[projectName].architect.build.options.styles =
        stylesArray;
      tree.overwrite(angularJsonPath, JSON.stringify(angularJson, null, 2));
    }

    // Generate Tailwind config files
    if (!tree.exists('tailwind.config.js')) {
      tree.create(
        'tailwind.config.js',
        `module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {},
  },
  plugins: [],
};`
      );
    }

    if (!tree.exists('postcss.config.js')) {
      tree.create(
        'postcss.config.js',
        `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};`
      );
    }

    // Update styles.css with Tailwind directives
    const stylesPath = '/src/styles.css';
    const stylesContent = `
@tailwind base;
@tailwind components;
@tailwind utilities;
`;
    if (tree.exists(stylesPath)) {
      const existingStyles = tree.read(stylesPath)!.toString('utf-8');
      tree.overwrite(stylesPath, existingStyles + '\n' + stylesContent);
    } else {
      tree.create(stylesPath, stylesContent);
    }

    // Add Tailwind dependencies
    context.addTask(
      new NodePackageInstallTask({
        packageName: 'tailwindcss postcss autoprefixer',
      })
    );

    return tree;
  };
}
