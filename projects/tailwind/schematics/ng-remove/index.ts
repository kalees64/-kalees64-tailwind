import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

export function ngRemove(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const log = context.logger.info.bind(context.logger);
    const warn = context.logger.warn.bind(context.logger);
    // Remove Tailwind dependencies
    // const packageJsonPath = 'package.json';
    // if (tree.exists(packageJsonPath)) {
    //   const packageJson = JSON.parse(tree.read(packageJsonPath)!.toString());

    //   const dependencies = packageJson.dependencies || {};
    //   delete dependencies['tailwindcss'];
    //   delete dependencies['autoprefixer'];
    //   delete dependencies['postcss'];

    //   packageJson.dependencies = dependencies;
    //   tree.overwrite(packageJsonPath, JSON.stringify(packageJson, null, 2));
    // }

    //Remove packages M2
    const packageJsonPath = '/package.json';

    if (tree.exists(packageJsonPath)) {
      const buffer = tree.read(packageJsonPath);
      if (buffer) {
        const content = buffer.toString('utf-8');
        const packageJson = JSON.parse(content);

        // Remove the packages from dependencies
        const packagesToRemove = [
          'tailwindcss',
          'postcss',
          'autoprefixer',
          '@kalees64/tailwind',
        ];
        packagesToRemove.forEach((pkg) => {
          if (packageJson.dependencies && packageJson.dependencies[pkg]) {
            delete packageJson.dependencies[pkg];
          }
          if (packageJson.devDependencies && packageJson.devDependencies[pkg]) {
            delete packageJson.devDependencies[pkg];
          }
        });

        // Write the updated package.json back
        tree.overwrite(packageJsonPath, JSON.stringify(packageJson, null, 2));

        // Schedule npm install task
        context.addTask(new NodePackageInstallTask());
      }
    } else {
      context.logger.warn(`No package.json file found.`);
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

    // Step 5: Remove ThemeService file
    const themeServicePath = 'src/app/services/theme.service.ts';
    if (tree.exists(themeServicePath)) {
      tree.delete(themeServicePath);
      log('Deleted ThemeService file.');
    } else {
      warn('ThemeService file not found.');
    }

    // Step 6: Remove ThemeService imports and methods from AppComponent
    const appComponentPath = 'src/app/app.component.ts';
    if (tree.exists(appComponentPath)) {
      const appComponentContent = tree.read(appComponentPath)!.toString();

      const updatedAppComponentContent = appComponentContent
        .replace(
          /import\s+{[^}]*ThemeService[^}]*}\s+from\s+'.\/services\/theme.service';?/g,
          ''
        )
        .replace(/private\s+themeService:\s+ThemeService,?\s*/g, '')
        .replace(
          /ngOnInit\(\):\s*void\s*{[^}]*this\.themeService\.initializeTheme\(\);?[^}]*}/g,
          ''
        )
        .replace(
          /toggleTheme\(\):\s*void\s*{[^}]*this\.themeService\.toggleTheme\(\);?[^}]*}/g,
          ''
        );

      if (appComponentContent !== updatedAppComponentContent) {
        tree.overwrite(appComponentPath, updatedAppComponentContent);
        log('Removed ThemeService-related configurations from AppComponent.');
      } else {
        warn('No ThemeService-related configurations found in AppComponent.');
      }
    } else {
      warn('AppComponent file not found.');
    }

    return tree;
  };
}
